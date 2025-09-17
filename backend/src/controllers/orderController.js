const orderService = require('../services/orderService');
const ORDER_STATUS = require('../constants/orderStatus');

const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const order = await orderService.createOrder(req.body, userId);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    try {
        const result = await orderService.getAllOrders(page, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to retrieve all orders.' });
    }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5; 
    const result = await orderService.getOrdersByUserId(userId, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to retrieve orders.' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const user = req.user;
    const order = await orderService.getOrderById(req.params.id, user);
    res.json(order);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !Object.values(ORDER_STATUS).includes(status)) {
        return res.status(400).json({ message: 'Invalid or missing status.' });
    }
    const updatedOrder = await orderService.updateOrderStatus(req.params.id, status);
    res.json(updatedOrder);
  } catch (error) {
    if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const user = req.user; // The full user object from authMiddleware
        const updatedOrder = await orderService.cancelOrder(orderId, user);
        res.json(updatedOrder);
    } catch (error) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('not authorized') || error.message.includes('not allowed')) {
            statusCode = 403;
        } else if (error.message.includes('already')) {
            statusCode = 400;
        }
        res.status(statusCode).json({ message: error.message });
    }
};

const addFeedback = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const { rating, comment } = req.body;

    const numericRating = Number(rating);

    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      console.log(rating);
      console.log(numericRating);
        return res.status(400).json({ message: 'Rating is required and must be a number between 1 and 5.' });
    }

    try {
        const feedback = await orderService.addFeedbackToOrder(orderId, userId, numericRating, comment);
        res.status(201).json(feedback);
    } catch (error) {
        let statusCode = 500;
        if (error.message.includes('not found') || error.message.includes('not authorized')) {
            statusCode = 404;
        } else if (error.message.includes('already been submitted')) {
            statusCode = 409; 
        } else if (error.message.includes('can only be added to delivered')) {
            statusCode = 400;
        }

        res.status(statusCode).json({ message: error.message || 'Failed to submit feedback.' });
    }
};

const settleUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await orderService.settleUserOrders(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to settle orders.' });
    }
};

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  addFeedback,
  settleUserOrders,
};
