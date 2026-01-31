const db = require('../config/database');
const ORDER_STATUS = require('../constants/orderStatus');
const { isWithinTimeSlot, TIME_SLOTS, getCurrentTimeIST } = require('../constants/timeSlots');
const { DAYS_OF_WEEK } = require('../constants/dailySpecials');
const notificationService = require('./notificationService');

// A helper to format order data consistently
const parseOrder = (order) => {
    if (!order) return null;

    const items = order.items || [];
    const cleanedItems = items.filter(item => item !== null && item.id !== null);

    return {
        ...order,
        total_price: order.total_price ? parseFloat(order.total_price) : 0,
        items: cleanedItems,
        feedback: order.feedback || null,
    };
};

const createOrder = async (orderData, userId, createdByAdmin = null) => {
    const { items, comment } = orderData;
    if (!items || items.length === 0) {
        throw new Error('An order must contain at least one item.');
    }

    let totalOrderPrice = 0;
    const createdOrderItems = [];

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const uniqueItemIds = [...new Set(items.map(item => item.menu_item_id))];
        const { rows: menuItems } = await client.query(
            'SELECT * FROM menu_items WHERE id = ANY($1::int[]) AND available = TRUE AND deleted_from IS NULL',
            [uniqueItemIds]
        );

        if (menuItems.length !== uniqueItemIds.length) {
            throw new Error('One or more menu items are invalid, unavailable, or could not be found.');
        }

        const menuItemMap = new Map(menuItems.map(item => [item.id, item]));

        // Get current day name for day_of_week validation
        const currentTimeIST = getCurrentTimeIST();
        const currentDayName = DAYS_OF_WEEK[currentTimeIST.getDay()];

        // Validate time slots AND day_of_week for all items
        const unavailableItems = [];
        for (const menuItem of menuItems) {
            const category = menuItem.category?.toLowerCase();
            const itemDayOfWeek = menuItem.day_of_week;

            // Check time slot restriction
            if (category && TIME_SLOTS[category]) {
                if (!isWithinTimeSlot(category)) {
                    const slot = TIME_SLOTS[category];
                    unavailableItems.push({
                        name: menuItem.name,
                        reason: `${category} time slot (${slot.displayStart} - ${slot.displayEnd})`
                    });
                    continue; // Skip day check if time is already wrong
                }
            }

            // Check day_of_week restriction (if item has a specific day assigned)
            if (itemDayOfWeek && itemDayOfWeek !== currentDayName) {
                unavailableItems.push({
                    name: menuItem.name,
                    reason: `only available on ${itemDayOfWeek} (today is ${currentDayName})`
                });
            }
        }

        if (unavailableItems.length > 0) {
            const itemNames = unavailableItems.map(i => `${i.name} - ${i.reason}`).join(', ');
            throw new Error(`The following items are not available for ordering: ${itemNames}`);
        }

        for (const item of items) {
            if (item.quantity <= 0) {
                throw new Error('Item quantity must be a positive number.');
            }

            const menuItem = menuItemMap.get(item.menu_item_id);
            if (!menuItem) {
                throw new Error(`Menu item with ID ${item.menu_item_id} could not be found.`);
            }

            let priceAtOrder;
            let nameAtOrder = menuItem.name;

            if (item.proportion_name) {
                const selectedProportion = (menuItem.proportions || []).find(p => p.name === item.proportion_name);
                if (!selectedProportion) {
                    throw new Error(`Proportion '${item.proportion_name}' is not available for menu item '${menuItem.name}'.`);
                }
                priceAtOrder = selectedProportion.price;
                nameAtOrder = `${menuItem.name} (${item.proportion_name})`;
            } else {
                priceAtOrder = menuItem.price;
            }

            totalOrderPrice += priceAtOrder * item.quantity;
            createdOrderItems.push({ ...item, price_at_order: priceAtOrder, name_at_order: nameAtOrder });
        }

        const { rows: [order] } = await client.query(
            'INSERT INTO orders (user_id, total_price, status, comment, created_by_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at, status, comment, created_by_admin',
            [userId, totalOrderPrice, ORDER_STATUS.PENDING, comment, createdByAdmin]
        );

        const orderItemsQueries = createdOrderItems.map(item => {
            return client.query(
                'INSERT INTO order_items (order_id, menu_item_id, proportion_name, quantity, price_at_order, name_at_order) VALUES ($1, $2, $3, $4, $5, $6)',
                [order.id, item.menu_item_id, item.proportion_name, item.quantity, item.price_at_order, item.name_at_order]
            );
        });

        await Promise.all(orderItemsQueries);
        await client.query('COMMIT');

        // Create notification for the user if order was placed by admin on their behalf
        if (createdByAdmin && createdByAdmin !== userId) {
            try {
                const message = `An order of ₹${totalOrderPrice.toFixed(2)} has been placed on your behalf. You can cancel or dispute within 24 hours.`;
                await notificationService.createNotification(userId, order.id, 'admin_order', message);
            } catch (notifError) {
                console.error('Failed to create notification for admin order:', notifError);
                // Don't fail the order creation if notification fails
            }
        }

        return { ...order, total_price: totalOrderPrice, items: createdOrderItems };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getOrderById = async (orderId, user) => {
    const params = [orderId];
    let userClause = '';
    if (user.role !== 'admin' && user.role !== 'superadmin') {
        userClause = 'AND o.user_id = $2';
        params.push(user.userId);
    }

    const query = `
        SELECT 
            o.*,
            u.name as user_name,
            u.username as username,
            COALESCE(
                (
                    SELECT json_agg(oi.*)
                    FROM order_items oi WHERE oi.order_id = o.id
                ), '[]'::json
            ) as items,
            (
                SELECT json_build_object('id', f.id, 'rating', f.rating, 'comment', f.comment)
                FROM feedback f WHERE f.order_id = o.id
                LIMIT 1
            ) as feedback
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1 ${userClause}
    `;

    const { rows: [order] } = await db.query(query, params);

    if (!order) {
        throw new Error('Order not found or access denied.');
    }

    return parseOrder(order);
};

const getOrdersByUserId = async (userId, page, limit, startDate, endDate) => {
    const offset = (page - 1) * limit;
    const params = [userId];
    // Filter out future scheduled orders:
    // Show if (NOT scheduled) OR (scheduled AND date <= today)
    let whereClause = 'WHERE user_id = $1 AND (is_scheduled = false OR scheduled_for_date <= CURRENT_DATE)';
    let paramIndex = 2;

    if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        // Add 1 day to end date to include the entire end date (as inputs are usually YYYY-MM-DD)
        // Or assume endDate includes time. Let's assume input is YYYY-MM-DD and we want up to end of that day.
        // Actually, easiest is just simple comparison if input strings are standard.
        // But for "End Date", if user picks "2023-10-25", they expect orders on 25th to be included.
        // So effectively < 2023-10-26 00:00:00 OR <= 2023-10-25 23:59:59.
        // I will compare DATE(created_at) or simply assume the controller passes a full timestamp or we cast here.
        // Simplest: `AND created_at <= $param` and let controller/frontend handle exact timing, 
        // OR better: `AND created_at::date <= $param::date` for intuitive matching.
        whereClause += ` AND created_at::date <= $${paramIndex}::date`;
        params.push(endDate);
        paramIndex++;
    }

    // Need to clean up params logic for LIMIT/OFFSET which must comes last in SQL but variables depend on order.
    // Easier to construct the full query first.

    const totalQuery = `SELECT COUNT(*) FROM orders ${whereClause}`;
    // Params for count query are just the filter params (userId, start, end)
    const totalResult = await db.query(totalQuery, params);
    const total = parseInt(totalResult.rows[0].count, 10);

    const ordersQuery = `
        SELECT 
            o.*,
            u.name as user_name,
            u.username as username,
            COALESCE((
                SELECT json_agg(oi.*) 
                FROM order_items oi WHERE oi.order_id = o.id
            ), '[]'::json) as items,
            (
                SELECT json_build_object('id', f.id, 'rating', f.rating, 'comment', f.comment)
                FROM feedback f WHERE f.order_id = o.id
                LIMIT 1
            ) as feedback
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    // Add pagination params to the end
    const queryParams = [...params, limit, offset];

    const { rows: orders } = await db.query(ordersQuery, queryParams);

    return { orders: orders.map(parseOrder), total };
};

const getAllOrders = async (page = 1, limit = 10, status = null) => {
    const offset = (page - 1) * limit;
    const params = [limit, offset];

    let whereClause = 'WHERE (o.is_scheduled = false OR o.scheduled_for_date <= CURRENT_DATE)';

    if (status && status !== 'All') {
        whereClause += ` AND o.status = $3`;
        params.push(status);
    }

    const totalQuery = `SELECT COUNT(*) FROM orders o ${whereClause}`;
    const totalResult = await db.query(totalQuery, status && status !== 'All' ? [status] : []);
    const total = parseInt(totalResult.rows[0].count, 10);

    const ordersQuery = `
        SELECT 
            o.*, 
            u.name as user_name,
            u.username as username,
            COALESCE((
                SELECT json_agg(oi.*) 
                FROM order_items oi WHERE oi.order_id = o.id
            ), '[]'::json) as items,
            (
                SELECT json_build_object('id', f.id, 'rating', f.rating, 'comment', f.comment)
                FROM feedback f WHERE f.order_id = o.id
                LIMIT 1
            ) as feedback
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT $1 OFFSET $2;
    `;
    const { rows: orders } = await db.query(ordersQuery, params);

    return { orders: orders.map(parseOrder), total };
};

const updateOrderStatus = async (orderId, status) => {
    if (!Object.values(ORDER_STATUS).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
    }
    const { rows: [updatedOrder] } = await db.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [status, orderId]
    );
    if (!updatedOrder) {
        throw new Error('Order not found.');
    }
    return parseOrder(updatedOrder);
};

const cancelOrder = async (orderId, user) => {
    const { rows: [order] } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);

    if (!order) {
        throw new Error('Order not found.');
    }

    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const isAdminCreatedOrder = order.created_by_admin && order.created_by_admin !== order.user_id;

    if (!isAdmin && order.user_id !== user.id) {
        throw new Error('You are not authorized to cancel this order.');
    }

    // For admin-created orders: user (non-admin) can cancel within 24 hours
    if (isAdminCreatedOrder && !isAdmin) {
        const orderCreationTime = new Date(order.created_at).getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceInHours = (currentTime - orderCreationTime) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 24) {
            throw new Error('Cancellation window has expired. Admin-created orders can only be cancelled within 24 hours.');
        }
        // Allow cancellation for admin orders within 24h regardless of status (except settled/cancelled)
    } else if (!isAdmin) {
        // Regular order: 60 second window
        if (order.status !== ORDER_STATUS.PENDING && order.status !== ORDER_STATUS.CONFIRMED) {
            throw new Error(`Order cannot be cancelled. Status is '${order.status}'.`);
        }

        const orderCreationTime = new Date(order.created_at).getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceInSeconds = (currentTime - orderCreationTime) / 1000;

        if (timeDifferenceInSeconds > 60) {
            throw new Error('Cancellation window has expired. Orders can only be cancelled within 60 seconds of creation.');
        }
    }

    if ([ORDER_STATUS.SETTLED, ORDER_STATUS.CANCELLED].includes(order.status)) {
        throw new Error(`Order is already ${order.status} and cannot be cancelled.`);
    }

    const { rows: [updatedOrder] } = await db.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [ORDER_STATUS.CANCELLED, orderId]
    );

    return parseOrder(updatedOrder);
};

const disputeOrder = async (orderId, userId) => {
    const { rows: [order] } = await db.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);

    if (!order) {
        throw new Error('Order not found or you are not authorized to dispute this order.');
    }

    if (![ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED].includes(order.status)) {
        throw new Error(`Orders with status '${order.status}' cannot be disputed.`);
    }

    // For admin-created orders: user can only dispute within 24 hours
    if (order.created_by_admin && order.created_by_admin !== userId) {
        const orderCreationTime = new Date(order.created_at).getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceInHours = (currentTime - orderCreationTime) / (1000 * 60 * 60);

        if (timeDifferenceInHours > 24) {
            throw new Error('Dispute window has expired. Admin-created orders can only be disputed within 24 hours.');
        }
    }

    const { rows: [updatedOrder] } = await db.query(
        'UPDATE orders SET disputed = TRUE WHERE id = $1 RETURNING *',
        [orderId]
    );

    return parseOrder(updatedOrder);
};

const addFeedbackToOrder = async (orderId, userId, rating, comment) => {
    if (rating === undefined || rating === null || rating === 0) {
        throw new Error('Rating is required.');
    }

    const { rows: [order] } = await db.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);

    if (!order) {
        throw new Error('Order not found or you are not authorized to add feedback.');
    }

    if (order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.SETTLED) {
        throw new Error('Feedback can only be added to delivered or settled orders.');
    }

    const { rows: [existingFeedback] } = await db.query('SELECT * FROM feedback WHERE order_id = $1', [orderId]);
    if (existingFeedback) {
        throw new Error('Feedback has already been submitted for this order.');
    }

    const { rows: [newFeedback] } = await db.query(
        'INSERT INTO feedback (order_id, rating, comment) VALUES ($1, $2, $3) RETURNING *',
        [orderId, rating, comment]
    );
    return newFeedback;
};

const settleUserOrders = async (userId) => {
    const { rowCount } = await db.query(
        `UPDATE orders SET status = $1 WHERE user_id = $2 AND status = $3`,
        [ORDER_STATUS.SETTLED, userId, ORDER_STATUS.DELIVERED]
    );
    return { settled_count: rowCount };
};

/**
 * Get aggregated item summary for a specific date
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
const getDailyItemSummary = async (date) => {
    // If no date provided, default to today
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { rows } = await db.query(
        `SELECT 
            oi.name_at_order,
            oi.proportion_name,
            oi.price_at_order,
            SUM(CASE WHEN o.status IN ('${ORDER_STATUS.PENDING}', '${ORDER_STATUS.CONFIRMED}') THEN oi.quantity ELSE 0 END) as pending_qty,
            SUM(CASE WHEN o.status = '${ORDER_STATUS.DELIVERED}' THEN oi.quantity ELSE 0 END) as delivered_qty,
            SUM(CASE WHEN o.status = '${ORDER_STATUS.SETTLED}' THEN oi.quantity ELSE 0 END) as settled_qty,
            SUM(oi.quantity) as total_quantity,
            SUM(CASE WHEN o.status = '${ORDER_STATUS.SETTLED}' THEN oi.quantity * oi.price_at_order ELSE 0 END) as paid_amount,
            SUM(CASE WHEN o.status IN ('${ORDER_STATUS.DELIVERED}', '${ORDER_STATUS.SETTLED}') THEN oi.quantity * oi.price_at_order ELSE 0 END) as sale_amount
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE 
            (
                (o.is_scheduled = true AND o.scheduled_for_date = $1)
                OR 
                (o.is_scheduled = false AND DATE(o.created_at) = $1)
            )
            AND o.status NOT IN ('${ORDER_STATUS.CANCELLED}')
         GROUP BY oi.name_at_order, oi.proportion_name, oi.price_at_order
         ORDER BY oi.name_at_order`,
        [targetDate]
    );

    return rows;
};

module.exports = {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    disputeOrder,
    addFeedbackToOrder,
    settleUserOrders,
    getDailyItemSummary
};