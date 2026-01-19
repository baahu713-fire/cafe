import api from './api';

/**
 * Fetch current time slot status from backend
 * @returns {Promise<Object>} Time slot status for all categories
 */
export const getTimeSlotStatus = async () => {
    const response = await api.get('/time-slots');
    return response.data;
};

/**
 * Check if a specific category is available for ordering
 * @param {string} category - 'breakfast', 'lunch', or 'snack'
 * @returns {Promise<Object>} Availability info for the category
 */
export const checkTimeSlot = async (category) => {
    const response = await api.get(`/time-slots/check/${category}`);
    return response.data;
};
