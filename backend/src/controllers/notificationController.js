const notificationService = require('../services/notificationService');

/**
 * Get unread notifications for the logged-in user
 */
const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const notifications = await notificationService.getUnreadNotifications(userId);
        const count = await notificationService.getUnreadCount(userId);
        res.json({ notifications, unreadCount: count });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch notifications.' });
    }
};

/**
 * Get just the unread count for badge display
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const count = await notificationService.getUnreadCount(userId);
        res.json({ unreadCount: count });
    } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch notification count.' });
    }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id, userId);
        res.json(notification);
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('not authorized')) {
            return res.status(404).json({ message: error.message });
        }
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: error.message || 'Failed to mark notification as read.' });
    }
};

/**
 * Mark all notifications as read for the logged-in user
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const result = await notificationService.markAllAsRead(userId);
        res.json(result);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: error.message || 'Failed to mark all notifications as read.' });
    }
};

module.exports = {
    getUnreadNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
