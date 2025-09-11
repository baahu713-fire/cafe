import api from './api';

export const submitFeedback = async (feedbackData) => {
    try {
        const response = await api.post('/feedback', feedbackData);
        return response.data;
    } catch (error) {
        console.error('Error submitting feedback:', error.response || error.message);
        throw error.response?.data || new Error('Feedback submission failed');
    }
};
