const express = require('express');
const router = express.Router();
const scheduledOrderController = require('../controllers/scheduledOrderController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/scheduled-orders/constraints
 * @desc    Get scheduling constraints (dates, limits)
 * @access  Authenticated
 */
router.get('/constraints', authMiddleware, scheduledOrderController.getSchedulingConstraints);

/**
 * @route   GET /api/scheduled-orders/schedulable-items
 * @desc    Get items that can be scheduled
 * @access  Authenticated
 */
router.get('/schedulable-items', authMiddleware, scheduledOrderController.getSchedulableItems);

/**
 * @route   GET /api/scheduled-orders/all
 * @desc    Get all scheduled orders (admin only)
 * @access  Admin
 */
router.get('/all', authMiddleware, admin, scheduledOrderController.getAllScheduledOrders);

/**
 * @route   GET /api/scheduled-orders
 * @desc    Get scheduled orders for the current user
 * @access  Authenticated
 */
router.get('/', authMiddleware, scheduledOrderController.getMyScheduledOrders);

/**
 * @route   POST /api/scheduled-orders
 * @desc    Create a new scheduled order
 * @access  Authenticated
 */
router.post('/', authMiddleware, scheduledOrderController.createScheduledOrder);


/**
 * @route   POST /api/scheduled-orders/bulk-cancel
 * @desc    Bulk cancel scheduled orders
 * @access  Authenticated
 */
router.post('/bulk-cancel', authMiddleware, scheduledOrderController.cancelBulkScheduledOrders);

/**
 * @route   DELETE /api/scheduled-orders/:id
 * @desc    Cancel a scheduled order (admin only)
 * @access  Admin
 */
router.delete('/:id', authMiddleware, admin, scheduledOrderController.cancelScheduledOrder);

module.exports = router;
