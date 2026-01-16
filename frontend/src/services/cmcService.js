import api from './api';

/**
 * Fetch all CMC members
 * @returns {Promise<Array>} Array of CMC member objects
 */
export const getCmcMembers = async () => {
    const response = await api.get('/cmc');
    return response.data;
};

/**
 * Fetch a single CMC member by ID
 * @param {number} id - Member ID
 * @returns {Promise<Object>} CMC member object
 */
export const getCmcMemberById = async (id) => {
    const response = await api.get(`/cmc/${id}`);
    return response.data;
};

/**
 * Create a new CMC member (Admin only)
 * @param {FormData} formData - Member data with optional photo
 * @returns {Promise<Object>} Created member object
 */
export const createCmcMember = async (formData) => {
    const response = await api.post('/cmc', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Update a CMC member (Admin only)
 * @param {number} id - Member ID
 * @param {FormData} formData - Updated member data with optional photo
 * @returns {Promise<Object>} Updated member object
 */
export const updateCmcMember = async (id, formData) => {
    const response = await api.put(`/cmc/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Delete a CMC member (Admin only)
 * @param {number} id - Member ID
 * @returns {Promise<Object>} Success message
 */
export const deleteCmcMember = async (id) => {
    const response = await api.delete(`/cmc/${id}`);
    return response.data;
};
