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

// Add a response interceptor to handle global 401 errors
api.interceptors.response.use(
    // If the response is successful, just return it
    (response) => response,
    // If there's an error, handle it
    (error) => {
        // Check if the error is a 401 Unauthorized
        if (error.response && error.response.status === 401) {
            console.log('Session expired. Logging out.');
            
            // Perform the core logout actions directly to avoid circular dependencies
            localStorage.removeItem('user');
            
            // Reload the page. The routing logic will see that the user is no longer
            // authenticated and automatically redirect to the login page.
            window.location.reload();
        }
        
        // For any other errors, just reject the promise so the calling code can handle it
        return Promise.reject(error);
    }
);

export default api;
