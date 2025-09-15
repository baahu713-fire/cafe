import api from './api';

export const submitFeedback = async (orderId, feedbackData) => {
    try {
        const response = await api.post(`/orders/${orderId}/feedback`, feedbackData);
        return response.data;
    } catch (error) {
        // Axios wraps the error response in error.response
        if (error.response && error.response.data && error.response.data.message) {
            // Re-throw an error with the specific message from the backend
            throw new Error(error.response.data.message);
        }
        // Fallback for network errors or other unexpected issues
        throw new Error('Failed to submit feedback. Please try again.');
    }
};
