import api from './api';

const register = async (formData) => {
    const response = await api.post('/auth/register', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    if (response.data.token && response.data.user) {
        const userPayload = {
            ...response.data.user,
            isAdmin: response.data.user.role === 'admin',
            token: response.data.token,
        };
        localStorage.setItem('user', JSON.stringify(userPayload));
        return userPayload;
    }
    throw new Error('Registration failed: Invalid response from server.');
};

const login = async (email, password) => {
    const response = await api.post('/auth/login', {
        email,
        password,
    });

    if (response.data.token && response.data.user) {
        const userPayload = {
            ...response.data.user,
            isAdmin: response.data.user.role === 'admin',
            token: response.data.token,
        };
        localStorage.setItem('user', JSON.stringify(userPayload));
        return userPayload;
    }
    throw new Error('Login failed: Invalid response from server.');
};

const logout = () => {
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        return null;
    }
};

export { register, login, logout, getCurrentUser };
