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

/**
 * Get bill summary for all users within a date range (Admin only)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number|null} userId - Optional specific user ID
 * @returns {Promise<Object>} Bills data for all users
 */
export const getAllUsersBills = async (startDate, endDate, userId = null) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (userId) {
        params.append('userId', userId);
    }
    const response = await api.get(`/bills/all-users?${params.toString()}`);
    return response.data;
};

/**
 * Download bills as CSV (Admin only)
 * @param {string} startDate
 * @param {string} endDate
 * @param {number|null} userId
 */
export const downloadBillsCSV = async (startDate, endDate, userId = null) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (userId) {
        params.append('userId', userId);
    }

    const response = await api.get(`/bills/export-csv?${params.toString()}`, {
        responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bills_${startDate}_to_${endDate}${userId ? `_user_${userId}` : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export default {
    getBillSummary,
    getAllUsersBills,
    downloadBillsCSV
};
