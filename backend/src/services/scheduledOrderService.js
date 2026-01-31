const db = require('../config/database');
const ORDER_STATUS = require('../constants/orderStatus');

const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price_at_order) * item.quantity), 0);
};

/**
 * Creates a scheduled order for a user.
 * Items scheduled for a date range will be auto-created as regular orders.
 * 
 * Business rules:
 * - Only schedulable items can be scheduled
 * - Max booking: 30 days OR end of current month (whichever is earlier)
 * - Can schedule up to 1 year in advance
 * - Once scheduled, only admin/superadmin can cancel
 */

/**
 * Calculate the maximum allowed end date based on business rules
 * @param {Date} startDate - The start date of scheduling
 * @returns {Date} Maximum allowed end date (end of current year)
 */
const calculateMaxEndDate = (startDate) => {
    const start = new Date(startDate);

    // End of current year (Dec 31, 23:59:59)
    const endOfYear = new Date(start.getFullYear(), 11, 31, 23, 59, 59, 999);

    return endOfYear;
};

/**
 * Calculate the maximum date a user can schedule for (end of current year)
 * @returns {Date} Maximum schedulable date
 */
const getMaxSchedulableDate = () => {
    const today = new Date();
    // End of current year (Dec 31, 23:59:59)
    return new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
};

/**
 * Check if an item is schedulable
 * @param {number} menuItemId 
 * @returns {Promise<Object>} Menu item if schedulable
 */
const getSchedulableMenuItem = async (menuItemId) => {
    const { rows } = await db.query(
        'SELECT * FROM menu_items WHERE id = $1 AND schedulable = true AND deleted_from IS NULL',
        [menuItemId]
    );
    return rows[0] || null;
};

/**
 * Get all schedulable menu items grouped by category
 * Returns both individual items (non-categorized) and category groups
 * @returns {Promise<Object>} { categories: [...], items: [...] }
 */
const getSchedulableMenuItems = async () => {
    const { rows } = await db.query(
        `SELECT id, name, description, price, category, day_of_week, proportions 
         FROM menu_items 
         WHERE schedulable = true AND deleted_from IS NULL 
         ORDER BY category NULLS LAST, day_of_week, name`
    );

    // Group items by category AND include all items in items array
    const categoryMap = {};
    const allItems = []; // All items including those with categories

    rows.forEach(item => {
        // Snack category is special - can be ordered any working day
        const isSnack = item.category && item.category.toLowerCase() === 'snack';

        // Add all items to the items array (for individual selection)
        // For snacks, remove day_of_week so they can be ordered any working day
        if (isSnack) {
            allItems.push({ ...item, day_of_week: null });
        } else {
            allItems.push(item);
        }

        if (item.category && item.day_of_week) {
            // Item belongs to a category with day mapping - add to categories
            // (snacks included here for grouped category selection)
            if (!categoryMap[item.category]) {
                categoryMap[item.category] = {
                    category: item.category,
                    dayMappings: {},
                    prices: [],
                    items: []
                };
            }
            categoryMap[item.category].dayMappings[item.day_of_week] = {
                id: item.id,
                name: item.name,
                price: parseFloat(item.price),
                proportions: item.proportions
            };
            categoryMap[item.category].prices.push(parseFloat(item.price));
            categoryMap[item.category].items.push(item);
        }
    });

    // Calculate min/max prices for each category
    const categories = Object.values(categoryMap).map(cat => ({
        category: cat.category,
        dayMappings: cat.dayMappings,
        minPrice: Math.min(...cat.prices),
        maxPrice: Math.max(...cat.prices),
        hasPriceRange: Math.min(...cat.prices) !== Math.max(...cat.prices),
        items: cat.items
    }));

    return {
        categories,
        items: allItems
    };
};

/**
 * Create a scheduled order
 * @param {number} userId 
 * @param {Array} items - Array of { menu_item_id, quantity, proportion_name } OR { category, quantity }
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>} Created scheduled order
 */
const createScheduledOrder = async (userId, items, startDate, endDate, comment = '') => {
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            throw new Error('Start date cannot be in the past');
        }

        if (end < start) {
            throw new Error('End date must be after or equal to start date');
        }

        const maxEnd = calculateMaxEndDate(startDate);
        if (end > maxEnd) {
            throw new Error(`End date cannot exceed ${maxEnd.toISOString().split('T')[0]} (end of current year)`);
        }

        const maxSchedulable = getMaxSchedulableDate();
        if (start > maxSchedulable) {
            throw new Error('Cannot schedule beyond the current year');
        }

        // 1. Pre-fetch all necessary data
        const schedulableData = await getSchedulableMenuItems();

        // Map individual menu items for quick lookup
        const menuItemMap = new Map();
        // Since getSchedulableMenuItems returns 'items' containing all schedulable items
        schedulableData.items.forEach(item => menuItemMap.set(item.id, item));

        // 2. Parse user requests into a cleaner format
        // Separate category requests from individual item requests
        const requestedCategories = items.filter(i => i.category);
        const requestedItems = items.filter(i => !i.category);

        // Validate individual items existence
        for (const reqItem of requestedItems) {
            if (!menuItemMap.has(reqItem.menu_item_id)) {
                throw new Error(`Menu item ${reqItem.menu_item_id} is not schedulable or does not exist`);
            }
        }

        // Validate categories existence
        for (const reqCat of requestedCategories) {
            if (!schedulableData.categories.find(c => c.category === reqCat.category)) {
                throw new Error(`Category '${reqCat.category}' is not available for scheduling`);
            }
        }

        const createdOrders = [];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // 3. Iterate through each day in the range
        // Loop date
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Skip non-working days if necessary? (e.g. weekends) 
            // Currently assuming cafe operates 7 days or items define their availability.
            // If an item has NO day_of_week, it's available every day.

            const currentDayName = dayNames[d.getDay()];
            const dailyItemsToInsert = [];
            let dailyTotal = 0;

            // Process Individual Items
            for (const reqItem of requestedItems) {
                const menuItem = menuItemMap.get(reqItem.menu_item_id);

                // CHECK: Does this item belong to a specific day?
                if (menuItem.day_of_week && menuItem.day_of_week !== currentDayName) {
                    continue; // Skip Monday Special on Tuesday
                }

                let priceAtOrder = parseFloat(menuItem.price);
                let nameAtOrder = menuItem.name;
                let proportionName = reqItem.proportion_name || null;

                if (proportionName) {
                    const proportions = menuItem.proportions || [];
                    const p = proportions.find(prop => prop.name === proportionName);
                    if (!p) throw new Error(`Proportion '${proportionName}' invalid for item ${menuItem.name}`);
                    priceAtOrder = parseFloat(p.price);
                    nameAtOrder = `${menuItem.name} (${proportionName})`;
                }

                const lineTotal = priceAtOrder * reqItem.quantity;
                dailyTotal += lineTotal;

                dailyItemsToInsert.push({
                    menu_item_id: menuItem.id,
                    quantity: reqItem.quantity,
                    price_at_order: priceAtOrder,
                    name_at_order: nameAtOrder,
                    proportion_name: proportionName
                });
            }

            // Process Categories
            for (const reqCat of requestedCategories) {
                const categoryData = schedulableData.categories.find(c => c.category === reqCat.category);
                const dayMapping = categoryData.dayMappings[currentDayName];

                if (dayMapping) {
                    // This category has an item for today
                    const priceAtOrder = dayMapping.price;
                    const nameAtOrder = `${categoryData.category} (${currentDayName})`; // e.g. "Lunch (Monday)" implies the rotating item
                    const lineTotal = priceAtOrder * reqCat.quantity;
                    dailyTotal += lineTotal;

                    dailyItemsToInsert.push({
                        menu_item_id: dayMapping.id,
                        quantity: reqCat.quantity,
                        price_at_order: priceAtOrder,
                        name_at_order: nameAtOrder,
                        proportion_name: null // Category items usually don't have proportions in this simplified view, or it's built-in
                    });
                }
            }

            // If we have items for this day, create an order
            if (dailyItemsToInsert.length > 0) {
                // Formatting date as YYYY-MM-DD for DB
                const scheduledDateStr = d.toISOString().split('T')[0];

                const { rows: [newOrder] } = await client.query(
                    `INSERT INTO orders (
                        user_id, status, total_price, comment,
                        is_scheduled, scheduled_for_date, scheduled_end_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *`,
                    [
                        userId,
                        ORDER_STATUS.PENDING,
                        dailyTotal,
                        comment,
                        true,
                        scheduledDateStr,
                        scheduledDateStr // End date is same as start for daily orders
                    ]
                );

                // Insert items
                for (const item of dailyItemsToInsert) {
                    await client.query(
                        `INSERT INTO order_items (
                            order_id, menu_item_id, quantity, price_at_order, name_at_order, proportion_name
                        ) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [newOrder.id, item.menu_item_id, item.quantity, item.price_at_order, item.name_at_order, item.proportion_name]
                    );
                }

                // Add items to result object for frontend response
                newOrder.items = dailyItemsToInsert;
                createdOrders.push(newOrder);
            }
        }

        await client.query('COMMIT');

        // Return the created orders (or maybe just the first one/summary? Frontend expects an object, but we created many.)
        // The original controller returned `res.status(201).json(order)`.
        // If we change this to return an array, the frontend might break if it expects a single order object.
        // However, standard REST for "bulk create" might return list. 
        // Let's return the first one as "primary" or wrap them. 
        // Given the frontend "ScheduledOrdersPage" just refreshes the list, returning { count: N, orders: [] } or just the array is fine.
        // Let's return the array. The controller should handle it.
        return { created_count: createdOrders.length, orders: createdOrders };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get scheduled orders for a user
 * @param {number} userId 
 * @param {boolean} includeCompleted 
 * @returns {Promise<Array>}
 */
const getScheduledOrdersByUserId = async (userId, includeCompleted = false, page = 1, limit = 10, startDate, endDate) => {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE o.user_id = $1 AND o.is_scheduled = true";
    const params = [userId];
    let paramIndex = 2; // Next param index

    if (!includeCompleted) {
        whereClause += " AND o.status NOT IN ('Cancelled', 'Settled', 'Completed')";
    } else {
        whereClause += " AND o.status NOT IN ('Cancelled')";
    }

    if (startDate) {
        whereClause += ` AND o.scheduled_for_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        whereClause += ` AND o.scheduled_for_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM orders o ${whereClause}`;
    const { rows: countResult } = await db.query(countQuery, params);
    const total = parseInt(countResult[0].count, 10);

    const dataQuery = `
        SELECT 
            o.*,
            COALESCE((
                SELECT json_agg(json_build_object(
                    'id', oi.id,
                    'menu_item_id', oi.menu_item_id,
                    'quantity', oi.quantity,
                    'price_at_order', oi.price_at_order,
                    'name_at_order', oi.name_at_order,
                    'proportion_name', oi.proportion_name
                ))
                FROM order_items oi WHERE oi.order_id = o.id
            ), '[]'::json) as items
        FROM orders o
        ${whereClause}
        ORDER BY o.scheduled_for_date ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const queryParams = [...params, limit, offset];

    const { rows } = await db.query(dataQuery, queryParams);

    return { orders: rows, total };
};

const cancelScheduledOrdersBulk = async (userId, orderIds) => {
    if (!orderIds || orderIds.length === 0) return { cancelled: 0 };

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const { rowCount } = await client.query(
            `UPDATE orders 
             SET status = '${ORDER_STATUS.CANCELLED}', 
                 scheduled_cancelled_by = $1, 
                 scheduled_cancelled_at = NOW()
             WHERE id = ANY($2::int[]) 
               AND status NOT IN ('${ORDER_STATUS.CANCELLED}', '${ORDER_STATUS.SETTLED}', '${ORDER_STATUS.DELIVERED}')`,
            [userId, orderIds]
        );

        await client.query('COMMIT');
        return { cancelled: rowCount };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Get all scheduled orders (admin)
 * @param {number} page 
 * @param {number} limit 
 * @returns {Promise<Object>}
 */
const getAllScheduledOrders = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const { rows: countResult } = await db.query(
        'SELECT COUNT(*) FROM orders WHERE is_scheduled = true'
    );
    const total = parseInt(countResult[0].count, 10);

    const { rows } = await db.query(
        `SELECT 
            o.*,
            u.name as user_name,
            u.username,
            COALESCE((
                SELECT json_agg(json_build_object(
                    'id', oi.id,
                    'menu_item_id', oi.menu_item_id,
                    'quantity', oi.quantity,
                    'price_at_order', oi.price_at_order,
                    'name_at_order', oi.name_at_order,
                    'proportion_name', oi.proportion_name
                ))
                FROM order_items oi WHERE oi.order_id = o.id
            ), '[]'::json) as items
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.is_scheduled = true
        ORDER BY o.scheduled_for_date ASC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return { orders: rows, total };
};

/**
 * Cancel a scheduled order (admin only)
 * @param {number} orderId 
 * @param {number} cancelledByUserId 
 * @returns {Promise<Object>}
 */
const cancelScheduledOrder = async (orderId, cancelledByUserId) => {
    const { rows: [order] } = await db.query(
        'SELECT * FROM orders WHERE id = $1 AND is_scheduled = true',
        [orderId]
    );

    if (!order) {
        throw new Error('Scheduled order not found');
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
        throw new Error('Order is already cancelled');
    }

    const { rows: [updated] } = await db.query(
        `UPDATE orders SET 
            status = $1,
            scheduled_cancelled_by = $2,
            scheduled_cancelled_at = NOW()
        WHERE id = $3
        RETURNING *`,
        [ORDER_STATUS.CANCELLED, cancelledByUserId, orderId]
    );

    return updated;
};

/**
 * Get scheduling constraints for frontend
 */
const getSchedulingConstraints = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfYear = new Date(today.getFullYear(), 11, 31);

    return {
        minStartDate: today.toISOString().split('T')[0],
        maxStartDate: getMaxSchedulableDate().toISOString().split('T')[0],
        maxEndDate: endOfYear.toISOString().split('T')[0],
        note: 'Maximum booking duration is until end of current year'
    };
};

module.exports = {
    createScheduledOrder,
    getScheduledOrdersByUserId,
    getAllScheduledOrders,
    cancelScheduledOrder,
    cancelScheduledOrdersBulk,
    getSchedulableMenuItems,
    getSchedulingConstraints,
    calculateMaxEndDate
};
