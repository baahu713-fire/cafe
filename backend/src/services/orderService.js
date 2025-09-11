const db = require('../config/database');

const createOrder = async (orderData, userId) => {
    const { items, delivery_address } = orderData;
    let totalOrderPrice = 0;
    const createdOrderItems = [];

    // Use a database transaction to ensure atomicity
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Fetch all required menu items at once to validate and get details
        const itemIds = items.map(item => item.menu_item_id);
        const { rows: menuItems } = await client.query('SELECT * FROM menu_items WHERE id = ANY($1::int[]) AND available = TRUE AND deleted_from IS NULL', [itemIds]);

        if (menuItems.length !== itemIds.length) {
            throw new Error('One or more menu items are invalid, unavailable, or could not be found.');
        }

        const menuItemMap = new Map(menuItems.map(item => [item.id, item]));

        // Step 2: Process each item, calculate its price, and prepare for insertion
        for (const item of items) {
            const menuItem = menuItemMap.get(item.menu_item_id);
            let priceAtOrder = menuItem.price;
            let nameAtOrder = menuItem.name;

            // Handle proportions if specified
            if (item.proportion_name) {
                if (!menuItem.proportions || !menuItem.proportions[item.proportion_name]) {
                    throw new Error(`Proportion '${item.proportion_name}' is not available for menu item '${menuItem.name}'.`);
                }
                priceAtOrder = menuItem.proportions[item.proportion_name];
                nameAtOrder = `${menuItem.name} (${item.proportion_name})`;
            }

            totalOrderPrice += priceAtOrder * item.quantity;
            createdOrderItems.push({ ...item, price_at_order: priceAtOrder, name_at_order: nameAtOrder });
        }

        // Step 3: Insert the main order record
        const { rows: [order] } = await client.query(
            'INSERT INTO orders (user_id, total_price, delivery_address, status) VALUES ($1, $2, $3, $4) RETURNING id, created_at, status',
            [userId, totalOrderPrice, delivery_address, 'Pending']
        );

        // Step 4: Insert all order items
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
    // Users can only access their own orders. Admins can access any.
    let query = 'SELECT * FROM orders WHERE id = $1';
    const params = [orderId];

    if (user.role !== 'admin') {
        query += ' AND user_id = $2';
        params.push(user.userId);
    }

    const { rows: [order] } = await db.query(query, params);
    if (!order) {
        throw new Error('Order not found or access denied.');
    }

    // Fetch the associated order items
    const { rows: items } = await db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

    return { ...order, items };
};

const updateOrderStatus = async (orderId, status) => {
    // This should be restricted to admins
    const { rows: [updatedOrder] } = await db.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [status, orderId]
    );
    if (!updatedOrder) {
        throw new Error('Order not found.');
    }
    return updatedOrder;
};

module.exports = {
    createOrder,
    getOrderById,
    updateOrderStatus,
};
