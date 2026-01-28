const db = require('../config/database');
const ORDER_STATUS = require('../constants/orderStatus');

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

        // Get schedulable items/categories for lookup
        const schedulableData = await getSchedulableMenuItems();

        // Validate items and calculate total
        let totalPrice = 0;
        const validatedItems = [];
        const categorySelections = []; // Track category selections for expanding later

        for (const item of items) {
            if (item.category) {
                // Category-based selection
                const categoryData = schedulableData.categories.find(c => c.category === item.category);
                if (!categoryData) {
                    throw new Error(`Category '${item.category}' is not available for scheduling`);
                }

                // Store category selection for expansion after order creation
                categorySelections.push({
                    category: item.category,
                    quantity: item.quantity,
                    dayMappings: categoryData.dayMappings
                });

                // Calculate estimated total based on days in range
                // This will be recalculated precisely during order item creation
                const dayCount = Object.keys(categoryData.dayMappings).length;
                const avgPrice = (categoryData.minPrice + categoryData.maxPrice) / 2;
                totalPrice += avgPrice * item.quantity; // Approximate for now

            } else {
                // Individual item selection
                const menuItem = await getSchedulableMenuItem(item.menu_item_id);
                if (!menuItem) {
                    throw new Error(`Menu item ${item.menu_item_id} is not schedulable or does not exist`);
                }

                let priceAtOrder = parseFloat(menuItem.price);
                let nameAtOrder = menuItem.name;

                if (item.proportion_name) {
                    const proportions = menuItem.proportions || [];
                    const proportion = proportions.find(p => p.name === item.proportion_name);
                    if (!proportion) {
                        throw new Error(`Proportion '${item.proportion_name}' not found for ${menuItem.name}`);
                    }
                    priceAtOrder = parseFloat(proportion.price);
                    nameAtOrder = `${menuItem.name} (${item.proportion_name})`;
                }

                const itemTotal = priceAtOrder * item.quantity;
                totalPrice += itemTotal;

                validatedItems.push({
                    menu_item_id: item.menu_item_id,
                    quantity: item.quantity,
                    proportion_name: item.proportion_name,
                    price_at_order: priceAtOrder,
                    name_at_order: nameAtOrder,
                    category: null
                });
            }
        }

        // Create the scheduled order first (with approximate total)
        const { rows: [order] } = await client.query(
            `INSERT INTO orders (
                user_id, status, total_price, comment,
                is_scheduled, scheduled_for_date, scheduled_end_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [userId, ORDER_STATUS.PENDING, totalPrice, comment, true, startDate, endDate]
        );

        // Insert regular order items
        for (const item of validatedItems) {
            await client.query(
                `INSERT INTO order_items (
                    order_id, menu_item_id, quantity, price_at_order, name_at_order, proportion_name
                ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [order.id, item.menu_item_id, item.quantity, item.price_at_order, item.name_at_order, item.proportion_name]
            );
        }

        // Expand category selections into day-specific items
        // For each category, insert a special entry with category info
        // The actual delivery will be determined based on the delivery date
        let actualCategoryTotal = 0;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        for (const catSelection of categorySelections) {
            // For category orders, we store the items that will be delivered
            // We need to figure out which days fall within the date range
            const currentDate = new Date(start);
            while (currentDate <= end) {
                const dayName = dayNames[currentDate.getDay()];
                const dayMapping = catSelection.dayMappings[dayName];

                if (dayMapping) {
                    // This day has a menu item for this category
                    const priceAtOrder = dayMapping.price;
                    const nameAtOrder = `${catSelection.category} (${dayName})`;
                    actualCategoryTotal += priceAtOrder * catSelection.quantity;

                    validatedItems.push({
                        menu_item_id: dayMapping.id,
                        quantity: catSelection.quantity,
                        proportion_name: null,
                        price_at_order: priceAtOrder,
                        name_at_order: nameAtOrder,
                        category: catSelection.category,
                        delivery_date: currentDate.toISOString().split('T')[0]
                    });

                    await client.query(
                        `INSERT INTO order_items (
                            order_id, menu_item_id, quantity, price_at_order, name_at_order, proportion_name
                        ) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [order.id, dayMapping.id, catSelection.quantity, priceAtOrder, nameAtOrder, null]
                    );
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // Update order total with actual category-based pricing
        if (categorySelections.length > 0) {
            const actualTotal = validatedItems.reduce((sum, item) => sum + (item.price_at_order * item.quantity), 0);
            await client.query(
                'UPDATE orders SET total_price = $1 WHERE id = $2',
                [actualTotal, order.id]
            );
            order.total_price = actualTotal;
        }

        await client.query('COMMIT');

        return {
            ...order,
            items: validatedItems
        };

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
const getScheduledOrdersByUserId = async (userId, includeCompleted = false) => {
    let statusFilter = "AND o.status NOT IN ('Cancelled')";
    if (!includeCompleted) {
        statusFilter = "AND o.status NOT IN ('Cancelled', 'Settled', 'Completed')";
    }

    const { rows } = await db.query(
        `SELECT 
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
        WHERE o.user_id = $1 AND o.is_scheduled = true ${statusFilter}
        ORDER BY o.scheduled_for_date ASC`,
        [userId]
    );

    return rows;
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
    getSchedulableMenuItems,
    getSchedulingConstraints,
    calculateMaxEndDate
};
