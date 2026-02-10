import api from './api';

/**
 * Generate weekend holidays for a given year
 * @param {number} year
 */
export const generateYearCalendar = async (year) => {
    const response = await api.post(`/calendar/generate/${year}`);
    return response.data;
};

/**
 * Get holidays for a year, optionally filtered by month
 * @param {number} year
 * @param {number} [month] - 1-12
 */
export const getHolidays = async (year, month) => {
    const params = { year };
    if (month) params.month = month;
    const response = await api.get('/calendar/holidays', { params });
    return response.data;
};

/**
 * Get holidays for a year (public, for any authenticated user)
 * @param {number} year
 * @param {number} [month] - 1-12
 */
export const getPublicHolidays = async (year, month) => {
    const params = { year };
    if (month) params.month = month;
    const response = await api.get('/calendar/holidays/public', { params });
    return response.data;
};

/**
 * Add a single holiday
 * @param {Object} holidayData - { holiday_date, name, description }
 */
export const addHoliday = async (holidayData) => {
    const response = await api.post('/calendar/holidays', holidayData);
    return response.data;
};

/**
 * Bulk add holidays
 * @param {Array} holidays - Array of { holiday_date, name, description }
 * @param {number} year
 */
export const bulkAddHolidays = async (holidays, year) => {
    const response = await api.post('/calendar/holidays/bulk', { holidays, year });
    return response.data;
};

/**
 * Update a holiday
 * @param {number} id
 * @param {Object} data - { name, description, holiday_date }
 */
export const updateHoliday = async (id, data) => {
    const response = await api.put(`/calendar/holidays/${id}`, data);
    return response.data;
};

/**
 * Delete a holiday
 * @param {number} id
 */
export const deleteHoliday = async (id) => {
    const response = await api.delete(`/calendar/holidays/${id}`);
    return response.data;
};

/**
 * Delete all holidays for a year
 * @param {number} year
 */
export const deleteHolidaysByYear = async (year) => {
    const response = await api.delete(`/calendar/holidays/year/${year}`);
    return response.data;
};

export default {
    generateYearCalendar,
    getHolidays,
    addHoliday,
    bulkAddHolidays,
    updateHoliday,
    deleteHoliday,
    deleteHolidaysByYear
};
