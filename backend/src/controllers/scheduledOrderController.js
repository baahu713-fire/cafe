const scheduledOrderService = require('../services/scheduledOrderService');

/**
 * POST /api/scheduled-orders
 * Create a new scheduled order
 */
const createScheduledOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { items, startDate, endDate, comment } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Items are required' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const order = await scheduledOrderService.createScheduledOrder(
            userId,
            items,
            startDate,
            endDate,
            comment
        );

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating scheduled order:', error);
        res.status(400).json({ message: error.message });
    }
};

/**
 * GET /api/scheduled-orders
 * Get scheduled orders for the current user
 */
const getMyScheduledOrders = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const includeCompleted = req.query.includeCompleted === 'true';

        const orders = await scheduledOrderService.getScheduledOrdersByUserId(userId, includeCompleted);

        res.json(orders);
    } catch (error) {
        console.error('Error fetching scheduled orders:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/scheduled-orders/all
 * Get all scheduled orders (admin only)
 */
const getAllScheduledOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await scheduledOrderService.getAllScheduledOrders(page, limit);

        res.json(result);
    } catch (error) {
        console.error('Error fetching all scheduled orders:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * DELETE /api/scheduled-orders/:id
 * Cancel a scheduled order (admin only)
 */
const cancelScheduledOrder = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const cancelledByUserId = req.session.user.id;

        const order = await scheduledOrderService.cancelScheduledOrder(orderId, cancelledByUserId);

        res.json(order);
    } catch (error) {
        console.error('Error cancelling scheduled order:', error);
        res.status(400).json({ message: error.message });
    }
};

/**
 * GET /api/scheduled-orders/schedulable-items
 * Get items that can be scheduled
 */
const getSchedulableItems = async (req, res) => {
    try {
        const items = await scheduledOrderService.getSchedulableMenuItems();
        res.json(items);
    } catch (error) {
        console.error('Error fetching schedulable items:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/scheduled-orders/constraints
 * Get scheduling constraints (dates, limits)
 */
const getSchedulingConstraints = async (req, res) => {
    try {
        const constraints = scheduledOrderService.getSchedulingConstraints();
        res.json(constraints);
    } catch (error) {
        console.error('Error fetching constraints:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createScheduledOrder,
    getMyScheduledOrders,
    getAllScheduledOrders,
    cancelScheduledOrder,
    getSchedulableItems,
    getSchedulingConstraints
};
