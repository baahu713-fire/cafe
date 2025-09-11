import api from './api';

/**
 * Registers a new user.
 * @param {object} userData - The user's registration data.
 * @param {string} userData.name - The user's name.
 * @param {string} userData.email - The user's email.
 * @param {string} userData.password - The user's password.
 * @returns {Promise<object>} The user object and token from the backend.
 */
const register = async (userData) => {
    const { name, email, password } = userData;
    // For now, we'll default new users to team_id 1. This can be expanded later.
    const response = await api.post('/auth/register', {
        name,
        email,
        password,
        team_id: 1,
    });

    if (response.data.token && response.data.user) {
        // Adapt the backend response to the frontend's expected user object structure.
        // Add an 'isAdmin' flag for compatibility with existing components.
        const userPayload = {
            ...response.data.user,
            isAdmin: response.data.user.role === 'admin',
            token: response.data.token,
        };
        localStorage.setItem('user', JSON.stringify(userPayload));
        return userPayload;
    }
    // Throw an error if the response is not what we expect
    throw new Error('Registration failed: Invalid response from server.');
};

/**
 * Logs a user in.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} The user object and token from the backend.
 */
const login = async (email, password) => {
    const response = await api.post('/auth/login', {
        email,
        password,
    });

    if (response.data.token && response.data.user) {
        // Adapt the backend response to include the 'isAdmin' flag and the token.
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

/**
 * Logs the current user out by removing their data from localStorage.
 */
const logout = () => {
    localStorage.removeItem('user');
};

/**
 * Retrieves the current user's data from localStorage.
 * @returns {object|null} The parsed user object or null if not found.
 */
const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        return null;
    }
};

export { register, login, logout, getCurrentUser };
