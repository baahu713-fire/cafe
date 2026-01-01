import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { config, response } = error;

        // Check for 401 Unauthorized error
        if (response && response.status === 401 && config.url !== '/auth/me') {
            const currentPath = window.location.pathname;

            // If the 401 occurs anywhere OTHER than the login page, it's a session timeout.
            // In that case, save the current location and redirect to login.
            if (currentPath !== '/login') {
                localStorage.setItem('redirectPath', currentPath);
                window.location.href = '/login';
                
                // Resolve the promise because we've handled the error by redirecting.
                return Promise.resolve();
            }
            // If we are ALREADY on the login page, a 401 means invalid credentials.
            // We must NOT redirect. We will let the promise reject so the LoginPage
            // can catch the error and display a message to the user.
        }

        // For all other errors, or for 401s on the login page, reject the promise.
        return Promise.reject(error);
    }
);

export default api;
