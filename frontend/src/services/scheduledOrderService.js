import api from './api';

/**
 * Get scheduling constraints (dates, limits)
 */
export const getSchedulingConstraints = async () => {
    const response = await api.get('/scheduled-orders/constraints');
    return response.data;
};

/**
 * Get items that can be scheduled
 */
export const getSchedulableItems = async () => {
    const response = await api.get('/scheduled-orders/schedulable-items');
    return response.data;
};

/**
 * Create a new scheduled order
 * @param {Array} items - Array of { menu_item_id, quantity, proportion_name }
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string} comment - Optional comment
 */
export const createScheduledOrder = async (items, startDate, endDate, comment = '') => {
    const response = await api.post('/scheduled-orders', {
        items,
        startDate,
        endDate,
        comment
    });
    return response.data;
};

/**
 * Get scheduled orders for the current user
 * @param {boolean} includeCompleted
 */
export const getMyScheduledOrders = async (includeCompleted = false, page = 1, limit = 10, startDate, endDate) => {
    const response = await api.get('/scheduled-orders', {
        params: { includeCompleted, page, limit, startDate, endDate }
    });
    return response.data;
};

/**
 * Get all scheduled orders (admin only)
 * @param {number} page
 * @param {number} limit
 */
export const getAllScheduledOrders = async (page = 1, limit = 10) => {
    const response = await api.get('/scheduled-orders/all', {
        params: { page, limit }
    });
    return response.data;
};

/**
 * Cancel a scheduled order (admin only)
 * @param {number} orderId
 */
export const cancelScheduledOrder = async (orderId) => {
    const response = await api.delete(`/scheduled-orders/${orderId}`);
    return response.data;
};

/**
 * Bulk cancel scheduled orders
 * @param {Array} orderIds
 */
export const bulkCancelScheduledOrders = async (orderIds) => {
    const response = await api.post('/scheduled-orders/bulk-cancel', { orderIds });
    return response.data;
};

export default {
    getSchedulingConstraints,
    getSchedulableItems,
    createScheduledOrder,
    getMyScheduledOrders,
    getAllScheduledOrders,
    cancelScheduledOrder,
    bulkCancelScheduledOrders
};
