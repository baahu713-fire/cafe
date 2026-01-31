const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/notifications - Get unread notifications with count
router.get('/', notificationController.getUnreadNotifications);

// GET /api/notifications/count - Get just the unread count
router.get('/count', notificationController.getUnreadCount);

// PATCH /api/notifications/:id/read - Mark a single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
