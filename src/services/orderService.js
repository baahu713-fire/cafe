// src/services/orderService.js
import db from './mockDatabase';

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
  return db.orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const cancelOrder = async (orderId, userId) => {
  const orderIndex = db.orders.findIndex(o => o.id === orderId && o.userId === userId);
  if (orderIndex === -1) {
    throw new Error("Order not found or you don't have permission to cancel it.");
  }
  const order = db.orders[orderIndex];
  const timeSinceOrder = new Date() - new Date(order.createdAt);
  if (timeSinceOrder > db.CANCELLATION_WINDOW_MS) {
    throw new Error("Cancellation window has passed.");
  }
  db.orders.splice(orderIndex, 1);
  return { message: "Order cancelled successfully" };
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
