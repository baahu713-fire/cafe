import axios from 'axios';

// Create an axios instance
const api = axios.create({
    baseURL: '/api', // The base URL for the backend API
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token in headers for every request
api.interceptors.request.use(
    (config) => {
        // Get user data from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        
        // If the user and token exist, add the Authorization header
        if (user && user.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        
        return config;
    },
    (error) => {
        // Handle request error
        return Promise.reject(error);
    }
);

export default api;
