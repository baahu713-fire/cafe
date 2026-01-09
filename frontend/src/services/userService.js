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

export const getAllUsersForSuperAdmin = async (search = '') => {
    try {
        const response = await api.get('/users/all', { params: { search } });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateUserStatus = async (userId, isActive) => {
    try {
        const response = await api.patch(`/users/${userId}/status`, { isActive });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateUserBySuperAdmin = async (userId, formData) => {
    try {
        const response = await api.patch(`/users/${userId}/details`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const changeUserPasswordBySuperAdmin = async (userId, newPassword) => {
    try {
        const response = await api.patch(`/users/${userId}/password`, { newPassword });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateUserProfile = async (formData) => {
    try {
        const response = await api.put('/users/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getUserProfile = async () => {
    try {
        const response = await api.get('/users/profile');
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};
