import api from './api';

/**
 * Fetches all users from the backend.
 * Requires admin privileges.
 * @returns {Promise<Object>} An object containing the list of users and the total count.
 */
export const getAllUsers = async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/users', {
        params: { page, limit, search },
    });

    const { users, total } = response.data;

    const adaptedUsers = users.map(user => ({
        ...user,
        isAdmin: user.role === 'admin',
    }));

    return { users: adaptedUsers, total };
};
