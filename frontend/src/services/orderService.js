import api from './api';

// Helper to adapt a single order from backend to frontend format
const adaptOrderToFrontend = (order) => ({
    ...order,
    items: order.items || [],
});

// Helper to adapt multiple orders
const adaptOrdersToFrontend = (orders) => orders.map(adaptOrderToFrontend);

export const placeOrder = async (orderData) => {
    const response = await api.post('/orders', orderData);
    return adaptOrderToFrontend(response.data);
};

export const getMyOrders = async (page = 1, limit = 5) => {
    const response = await api.get('/orders/my-orders', {
        params: { page, limit }
    });
    // Assuming backend returns { orders: [...], total: ... }
    return {
        orders: adaptOrdersToFrontend(response.data.orders),
        total: response.data.total,
    };
};

export const getAllOrders = async (page = 1, limit = 10) => {
    const response = await api.get('/orders', {
        params: { page, limit }
    });
    return {
        orders: adaptOrdersToFrontend(response.data.orders),
        total: response.data.total,
    };
};

export const updateOrderStatus = async (orderId, newStatus) => {
    const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
    return adaptOrderToFrontend(response.data);
};

export const settleAllUserOrders = async (userId) => {
    const response = await api.post(`/orders/settle-user/${userId}`, {});
    return response.data;
};

export const cancelOrder = async (orderId) => {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return adaptOrderToFrontend(response.data);
};

export const disputeOrder = async (orderId) => {
    const response = await api.post(`/orders/${orderId}/dispute`);
    return adaptOrderToFrontend(response.data);
};