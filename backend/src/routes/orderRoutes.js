const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All routes below require a user to be logged in
router.use(authMiddleware);

// POST /api/orders - Create a new order (user)
router.post('/', orderController.createOrder);

// GET /api/orders/my-orders - Get all orders for the logged-in user (user)
router.get('/my-orders', orderController.getMyOrders);

// GET /api/orders - Get all orders (admin only)
router.get('/', adminMiddleware, orderController.getAllOrders);

// GET /api/orders/:id - Get a specific order by ID (user and admin)
router.get('/:id', orderController.getOrderById);

// PATCH /api/orders/:id/status - Update the status of any order (admin only)
router.patch('/:id/status', adminMiddleware, orderController.updateOrderStatus);

// PATCH /api/orders/:id/cancel - Cancel a specific order (user-specific, service logic will check ownership)
router.patch('/:id/cancel', orderController.cancelMyOrder);

// POST /api/orders/:orderId/feedback - Submit feedback for an order (user)
router.post('/:orderId/feedback', orderController.addFeedback);


module.exports = router;
