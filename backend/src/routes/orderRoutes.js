const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All order routes require a user to be logged in
router.use(authMiddleware);

// Route for a user to create a new order
router.post('/', orderController.createOrder);

// Route for a user to get their own order by ID (service layer handles authorization)
// Admins can also use this to get any order
router.get('/:id', orderController.getOrderById);

// Admin-only route to update the status of an order
router.patch('/:id/status', adminMiddleware, orderController.updateOrderStatus);

module.exports = router;
