import api from './api';

/**
 * Get unread notifications for the current user
 * @returns {Promise<{notifications: Array, unreadCount: number}>}
 */
export const getUnreadNotifications = async () => {
    const response = await api.get('/notifications');
    return response.data;
};

/**
 * Get just the unread notification count
 * @returns {Promise<{unreadCount: number}>}
 */
export const getUnreadCount = async () => {
    const response = await api.get('/notifications/count');
    return response.data;
};

/**
 * Mark a single notification as read
 * @param {number} notificationId - ID of the notification to mark as read
 */
export const markAsRead = async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
};
