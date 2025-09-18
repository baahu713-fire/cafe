const db = require('../config/database');
const ORDER_STATUS = require('../constants/orderStatus');

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

const createOrder = async (orderData, userId) => {
    const { items, comment } = orderData;
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

        for (const item of items) {
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
            'INSERT INTO orders (user_id, total_price, status, comment) VALUES ($1, $2, $3, $4) RETURNING id, created_at, status, comment',
            [userId, totalOrderPrice, ORDER_STATUS.PENDING, comment]
        );

        const orderItemsQueries = createdOrderItems.map(item => {
            return client.query(
                'INSERT INTO order_items (order_id, menu_item_id, proportion_name, quantity, price_at_order, name_at_order) VALUES ($1, $2, $3, $4, $5, $6)',
                [order.id, item.menu_item_id, item.proportion_name, item.quantity, item.price_at_order, item.name_at_order]
            );
        });

        await Promise.all(orderItemsQueries);
        await client.query('COMMIT');

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
    if (user.role !== 'admin') {
        userClause = 'AND o.user_id = $2';
        params.push(user.userId);
    }

    const query = `
        SELECT 
            o.*,
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
        WHERE o.id = $1 ${userClause}
    `;

    const { rows: [order] } = await db.query(query, params);
    
    if (!order) {
        throw new Error('Order not found or access denied.');
    }

    return parseOrder(order);
};

const getOrdersByUserId = async (userId, page, limit) => {
    const offset = (page - 1) * limit;

    const totalQuery = 'SELECT COUNT(*) FROM orders WHERE user_id = $1';
    const totalResult = await db.query(totalQuery, [userId]);
    const total = parseInt(totalResult.rows[0].count, 10);

    const ordersQuery = `
        SELECT 
            o.*,
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
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3;
    `;
    const { rows: orders } = await db.query(ordersQuery, [userId, limit, offset]);

    return { orders: orders.map(parseOrder), total };
};

const getAllOrders = async (page, limit) => {
    const offset = (page - 1) * limit;

    const totalQuery = 'SELECT COUNT(*) FROM orders';
    const totalResult = await db.query(totalQuery);
    const total = parseInt(totalResult.rows[0].count, 10);

    const ordersQuery = `
        SELECT 
            o.*, 
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
        ORDER BY o.created_at DESC
        LIMIT $1 OFFSET $2;
    `;
    const { rows: orders } = await db.query(ordersQuery, [limit, offset]);

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

    // Admins can cancel any order, otherwise, the user must own the order.
    if (user.role !== 'admin' && order.user_id !== user.userId) {
        throw new Error('You are not authorized to cancel this order.');
    }

    // Regular users can only cancel orders that are PENDING.
    if (user.role !== 'admin' && order.status !== ORDER_STATUS.PENDING) {
        throw new Error(`Order cannot be cancelled. Status is '${order.status}'.`);
    }

    // Nobody can cancel an order that is already settled or cancelled.
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
};