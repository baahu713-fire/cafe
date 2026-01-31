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
    // User requested "Grand Total" to reflect "Delivered but not settled" (Outstanding)
    const grandTotal = deliveredTotal;

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

/**
 * Generate bill summary for ALL users within a date range.
 * Only includes SETTLED and DELIVERED orders.
 * 
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number|null} userId - Optional specific user ID to filter
 * @returns {Object} Bill summary for all users
 */
const generateAllUsersBillSummary = async (startDate, endDate, userId = null) => {
    let query = `
        SELECT 
            u.id as user_id,
            u.username,
            u.name,
            t.name as team_name,
            COUNT(CASE WHEN o.status = $1 THEN 1 END) as settled_count,
            COUNT(CASE WHEN o.status = $2 THEN 1 END) as delivered_count,
            COUNT(o.id) as total_orders,
            COALESCE(SUM(CASE WHEN o.status = $1 THEN o.total_price ELSE 0 END), 0) as settled_total,
            COALESCE(SUM(CASE WHEN o.status = $2 THEN o.total_price ELSE 0 END), 0) as outstanding
        FROM users u
        LEFT JOIN teams t ON u.team_id = t.id
        LEFT JOIN orders o ON o.user_id = u.id 
            AND o.status IN ($1, $2)
            AND DATE(o.created_at) >= $3
            AND DATE(o.created_at) <= $4
    `;

    const params = [ORDER_STATUS.SETTLED, ORDER_STATUS.DELIVERED, startDate, endDate];

    if (userId) {
        query += ` WHERE u.id = $5`;
        params.push(userId);
    }

    query += `
        GROUP BY u.id, u.username, u.name, t.name
        HAVING COUNT(o.id) > 0 OR $5::int IS NOT NULL
        ORDER BY u.username
    `;

    // If no userId filter, we need to modify the HAVING clause
    if (!userId) {
        query = `
            SELECT 
                u.id as user_id,
                u.username,
                u.name,
                t.name as team_name,
                COUNT(CASE WHEN o.status = $1 THEN 1 END) as settled_count,
                COUNT(CASE WHEN o.status = $2 THEN 1 END) as delivered_count,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(CASE WHEN o.status = $1 THEN o.total_price ELSE 0 END), 0) as settled_total,
                COALESCE(SUM(CASE WHEN o.status = $2 THEN o.total_price ELSE 0 END), 0) as outstanding
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            LEFT JOIN orders o ON o.user_id = u.id 
                AND o.status IN ($1, $2)
                AND DATE(o.created_at) >= $3
                AND DATE(o.created_at) <= $4
            GROUP BY u.id, u.username, u.name, t.name
            HAVING COUNT(o.id) > 0
            ORDER BY outstanding DESC, u.username
        `;
    }

    const { rows } = await db.query(query, params);

    // Calculate grand totals
    const grandSettledTotal = rows.reduce((sum, r) => sum + parseFloat(r.settled_total || 0), 0);
    const grandOutstanding = rows.reduce((sum, r) => sum + parseFloat(r.outstanding || 0), 0);
    const totalOrders = rows.reduce((sum, r) => sum + parseInt(r.total_orders || 0), 0);

    return {
        dateRange: { startDate, endDate },
        users: rows.map(r => ({
            userId: r.user_id,
            username: r.username,
            name: r.name,
            teamName: r.team_name || 'No Team',
            settledCount: parseInt(r.settled_count),
            deliveredCount: parseInt(r.delivered_count),
            totalOrders: parseInt(r.total_orders),
            settledTotal: parseFloat(parseFloat(r.settled_total).toFixed(2)),
            outstanding: parseFloat(parseFloat(r.outstanding).toFixed(2))
        })),
        grandTotals: {
            totalUsers: rows.length,
            totalOrders,
            settledTotal: parseFloat(grandSettledTotal.toFixed(2)),
            outstanding: parseFloat(grandOutstanding.toFixed(2))
        }
    };
};

/**
 * Generate CSV content for bills
 * @param {string} startDate
 * @param {string} endDate
 * @param {number|null} userId
 * @returns {string} CSV content
 */
const generateBillsCSV = async (startDate, endDate, userId = null) => {
    const billData = await generateAllUsersBillSummary(startDate, endDate, userId);

    // CSV Header
    const headers = ['Username', 'Name', 'Team', 'Total Orders', 'Settled Orders', 'Delivered Orders', 'Settled Total (₹)', 'Outstanding (₹)'];

    // CSV Rows
    const rows = billData.users.map(u => [
        u.username,
        u.name || '',
        u.teamName,
        u.totalOrders,
        u.settledCount,
        u.deliveredCount,
        u.settledTotal.toFixed(2),
        u.outstanding.toFixed(2)
    ]);

    // Add totals row
    rows.push([]);
    rows.push([
        'TOTAL',
        '',
        '',
        billData.grandTotals.totalOrders,
        '',
        '',
        billData.grandTotals.settledTotal.toFixed(2),
        billData.grandTotals.outstanding.toFixed(2)
    ]);

    // Build CSV string
    const csvContent = [
        `Bill Report: ${startDate} to ${endDate}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
};

module.exports = {
    generateBillSummary,
    getUserInfoForBill,
    generateAllUsersBillSummary,
    generateBillsCSV
};
