import api from './api';

const register = async (formData) => {
    const response = await api.post('/auth/register', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
    });
    return response.data.user;
};

const login = async (username, password) => {
    const response = await api.post('/auth/login', 
        { username, password }, 
        { withCredentials: true }
    );
    return response.data.user;
};

const logout = async () => {
    await api.post('/auth/logout', {}, { withCredentials: true });
};

const getMe = async () => {
    try {
        const response = await api.get('/auth/me', { withCredentials: true });
        return response.data.user;
    } catch (error) {
        return null;
    }
};

const forgotPassword = async (credentials) => {
    const response = await api.post('/auth/forgot-password', credentials);
    return response.data;
};

export { register, login, logout, getMe, forgotPassword };
