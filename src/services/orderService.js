// src/services/orderService.js
import db, { CANCELLATION_WINDOW_MS } from './mockDatabase';

export const placeOrder = async (userId, cart, comments) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: db.nextOrderId++,
    userId,
    items: cart,
    total,
    comments,
    status: 'Pending', // Initial status
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  return order;
};

export const getOrdersForUser = async (userId) => {
  // In a real app, you'd fetch this from a database.
  return [...db.orders].filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getAllOrders = async () => {
  // In a real app, you'd fetch this from a database.
  // For admins, we return a new sorted array to ensure state updates
  return [...db.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const cancelOrder = async (orderId) => {
  const orderIndex = db.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error("Order not found.");
  }
  const order = db.orders[orderIndex];

  const timeSinceOrder = new Date() - new Date(order.createdAt);
  if (timeSinceOrder > CANCELLATION_WINDOW_MS) {
      throw new Error("Cancellation window has passed.");
  }

  order.status = 'Cancelled';
  return order;
};

export const updateOrderStatus = async (orderId, newStatus) => {
    const order = db.orders.find(o => o.id === orderId);
    if (!order) {
        throw new Error('Order not found');
    }
    order.status = newStatus;

    // If status is 'Delivered' or 'Settled', create feedback entry if it doesn't exist
    if (newStatus === 'Delivered' || newStatus === 'Settled') {
        const feedbackExists = db.feedback.some(f => f.orderId === orderId);
        if (!feedbackExists) {
            const user = db.users.find(u => u.id === order.userId);
            db.feedback.push({
                id: db.feedback.length + 1,
                orderId: order.id,
                userId: order.userId,
                userEmail: user ? user.email : 'N/A',
                rating: 0, // Not yet rated
                comment: '',
                submittedAt: null,
            });
        }
    }
    return order;
};

export const settleOrder = async (orderId) => {
  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.status !== 'Delivered') {
    throw new Error('Only delivered orders can be settled.');
  }
  order.status = 'Settled';
  return order;
};

export const settleUserOrders = async (userId) => {
  const userOrders = db.orders.filter(o => o.userId === userId && o.status === 'Delivered');
  if (userOrders.length === 0) {
    throw new Error('No delivered orders to settle for this user.');
  }
  userOrders.forEach(order => {
    order.status = 'Settled';
  });
  return userOrders;
};
