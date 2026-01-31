const db = require('../config/database');

/**
 * Create a notification for a user
 * @param {number} userId - User to notify
 * @param {number} orderId - Associated order ID
 * @param {string} type - Notification type (e.g., 'admin_order')
 * @param {string} message - Notification message
 */
const createNotification = async (userId, orderId, type, message) => {
    const query = `
    INSERT INTO notifications (user_id, order_id, type, message)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
    const { rows } = await db.pool.query(query, [userId, orderId, type, message]);
    return rows[0];
};

/**
 * Get unread notifications for a user with order details
 * @param {number} userId - User ID
 */
const getUnreadNotifications = async (userId) => {
    const query = `
    SELECT 
      n.id,
      n.order_id,
      n.type,
      n.message,
      n.is_read,
      n.created_at,
      o.total_price,
      o.status as order_status,
      o.created_at as order_created_at,
      o.created_by_admin
    FROM notifications n
    LEFT JOIN orders o ON n.order_id = o.id
    WHERE n.user_id = $1 AND n.is_read = false
    ORDER BY n.created_at DESC
  `;
    const { rows } = await db.pool.query(query, [userId]);
    return rows;
};

/**
 * Get notification count for a user
 * @param {number} userId - User ID
 */
const getUnreadCount = async (userId) => {
    const query = `
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = $1 AND is_read = false
  `;
    const { rows } = await db.pool.query(query, [userId]);
    return parseInt(rows[0].count, 10);
};

/**
 * Mark a specific notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for authorization)
 */
const markAsRead = async (notificationId, userId) => {
    const query = `
    UPDATE notifications
    SET is_read = true
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
    const { rows } = await db.pool.query(query, [notificationId, userId]);
    if (rows.length === 0) {
        throw new Error('Notification not found or not authorized');
    }
    return rows[0];
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - User ID
 */
const markAllAsRead = async (userId) => {
    const query = `
    UPDATE notifications
    SET is_read = true
    WHERE user_id = $1 AND is_read = false
    RETURNING *
  `;
    const { rows } = await db.pool.query(query, [userId]);
    return { markedCount: rows.length };
};

module.exports = {
    createNotification,
    getUnreadNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
