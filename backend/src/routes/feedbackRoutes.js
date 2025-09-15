const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All feedback routes require a user to be logged in
router.use(authMiddleware);

// @desc    Submit feedback for an order
// @route   POST /api/orders/:orderId/feedback
// @access  Private
router.post('/:orderId/feedback', orderController.addFeedback);

module.exports = router;
