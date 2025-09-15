import api from './api';

// Helper to adapt a single order from backend to frontend format
const adaptOrderToFrontend = (order) => ({
    ...order,
    items: order.order_items || [],
});

// Helper to adapt multiple orders
const adaptOrdersToFrontend = (orders) => orders.map(adaptOrderToFrontend);

export const getMyOrders = async () => {
    const response = await api.get('/orders/my-orders');
    return adaptOrdersToFrontend(response.data);
};

export const getAllOrders = async () => {
    const response = await api.get('/orders');
    return adaptOrdersToFrontend(response.data);
};

export const updateOrderStatus = async (orderId, newStatus) => {
    const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
    return adaptOrderToFrontend(response.data);
};

export const settleAllUserOrders = async (userId) => {
    const response = await api.post(`/users/${userId}/settle`, {});
    return response.data;
};

export const placeOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return adaptOrderToFrontend(response.data);
};

export const cancelOrder = async (orderId) => {
    const response = await api.patch(`/orders/${orderId}/cancel`, {});
    return adaptOrderToFrontend(response.data);
};
