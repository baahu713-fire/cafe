import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Rating,
    CircularProgress,
    Alert
} from '@mui/material';

const FeedbackForm = ({ orderId, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a star rating before submitting.');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            await onSubmit(orderId, rating, comment);
            setSuccess(true);
            // The parent component will handle refreshing the order list
        } catch (err) {
            setError(err.message || 'Failed to submit feedback.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return <Alert severity="success">Thank you for your feedback!</Alert>;
    }

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, p: 2, border: '1px solid #ddd', borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Rating
                    name="feedback-rating"
                    value={rating}
                    onChange={(event, newValue) => {
                        setRating(newValue);
                        if (error) setError(null); // Clear error when user interacts
                    }}
                    size="large"
                />
            </Box>
            <TextField
                label="Add a comment (optional)"
                multiline
                rows={3}
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                variant="outlined"
            />
            <Box sx={{ mt: 2, position: 'relative' }}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                >
                    Submit Feedback
                </Button>
                {loading && (
                    <CircularProgress
                        size={24}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-12px',
                            marginLeft: '-12px',
                        }}
                    />
                )}
            </Box>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );
};

export default FeedbackForm;
