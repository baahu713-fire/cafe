const orderService = require('../services/orderService');

const createOrder = async (req, res) => {
  try {
    // The user's ID is attached to the request by the authMiddleware
    const userId = req.user.userId;
    const order = await orderService.createOrder(req.body, userId);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    // Pass the entire user object from the token for role-based access checks
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
    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
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

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
};
