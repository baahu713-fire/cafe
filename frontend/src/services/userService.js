import api from './api';

/**
 * Fetches all users from the backend.
 * Requires admin privileges.
 * @returns {Promise<Array>} A list of all users.
 */
export const getAllUsers = async () => {
    const response = await api.get('/users');
    // The backend already returns users without passwords, but we can double-check
    // and adapt if the frontend expects a different structure.
    return response.data.map(user => ({
        ...user,
        // The 'isAdmin' flag is added for frontend compatibility.
        isAdmin: user.role === 'admin',
    }));
};
