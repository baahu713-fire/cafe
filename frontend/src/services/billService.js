import api from './api';

/**
 * Get bill summary for a user within a date range.
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number} userId - Optional user ID (admin only)
 * @returns {Promise<Object>} Bill summary data
 */
export const getBillSummary = async (startDate, endDate, userId = null) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (userId) {
        params.append('userId', userId);
    }
    const response = await api.get(`/bills/summary?${params.toString()}`);
    return response.data;
};

export default {
    getBillSummary
};
