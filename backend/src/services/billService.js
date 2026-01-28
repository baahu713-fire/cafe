const db = require('../config/database');
const ORDER_STATUS = require('../constants/orderStatus');

/**
 * Generate bill summary for a user within a date range.
 * Only includes SETTLED and DELIVERED orders.
 * Returns two separate totals: one for settled, one for delivered.
 * 
 * @param {number} userId - The user ID to generate bill for
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Bill summary with items breakdown and totals
 */
const generateBillSummary = async (userId, startDate, endDate) => {
    // Query orders with items grouped by status
    const query = `
        SELECT 
            o.id as order_id,
            o.status,
            o.total_price,
            o.created_at,
            o.updated_at,
            COALESCE((
                SELECT json_agg(json_build_object(
                    'id', oi.id,
                    'menu_item_id', oi.menu_item_id,
                    'quantity', oi.quantity,
                    'price_at_order', oi.price_at_order,
                    'name_at_order', oi.name_at_order,
                    'proportion_name', oi.proportion_name,
                    'item_total', (oi.quantity * oi.price_at_order)
                ))
                FROM order_items oi WHERE oi.order_id = o.id
            ), '[]'::json) as items
        FROM orders o
        WHERE o.user_id = $1
          AND o.status IN ($2, $3)
          AND DATE(o.created_at) >= $4
          AND DATE(o.created_at) <= $5
        ORDER BY o.created_at DESC
    `;

    const { rows: orders } = await db.query(query, [
        userId,
        ORDER_STATUS.SETTLED,
        ORDER_STATUS.DELIVERED,
        startDate,
        endDate
    ]);

    // Separate orders by status
    const settledOrders = orders.filter(o => o.status === ORDER_STATUS.SETTLED);
    const deliveredOrders = orders.filter(o => o.status === ORDER_STATUS.DELIVERED);

    // Calculate totals
    const settledTotal = settledOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const deliveredTotal = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const grandTotal = settledTotal + deliveredTotal;

    // Build items breakdown (aggregate across all orders)
    const itemsMap = new Map();

    for (const order of orders) {
        for (const item of order.items) {
            const key = `${item.menu_item_id}-${item.proportion_name || 'default'}`;
            if (itemsMap.has(key)) {
                const existing = itemsMap.get(key);
                existing.totalQuantity += item.quantity;
                existing.totalAmount += parseFloat(item.item_total);
            } else {
                itemsMap.set(key, {
                    menuItemId: item.menu_item_id,
                    name: item.name_at_order,
                    proportionName: item.proportion_name,
                    pricePerUnit: parseFloat(item.price_at_order),
                    totalQuantity: item.quantity,
                    totalAmount: parseFloat(item.item_total)
                });
            }
        }
    }

    const itemsBreakdown = Array.from(itemsMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
        userId,
        dateRange: {
            startDate,
            endDate
        },
        summary: {
            settledOrdersCount: settledOrders.length,
            deliveredOrdersCount: deliveredOrders.length,
            totalOrdersCount: orders.length,
            settledTotal: parseFloat(settledTotal.toFixed(2)),
            deliveredTotal: parseFloat(deliveredTotal.toFixed(2)),
            grandTotal: parseFloat(grandTotal.toFixed(2))
        },
        itemsBreakdown,
        orders: orders.map(o => ({
            orderId: o.order_id,
            status: o.status,
            totalPrice: parseFloat(o.total_price),
            createdAt: o.created_at,
            items: o.items
        }))
    };
};

/**
 * Get user basic info for bill header
 */
const getUserInfoForBill = async (userId) => {
    const { rows } = await db.query(
        'SELECT id, name, username, team_id FROM users WHERE id = $1',
        [userId]
    );
    if (rows.length === 0) {
        throw new Error('User not found');
    }
    return rows[0];
};

module.exports = {
    generateBillSummary,
    getUserInfoForBill
};
