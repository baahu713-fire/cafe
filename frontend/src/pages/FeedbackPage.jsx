import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    Rating,
    CircularProgress,
    Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { submitFeedback } from '../services/feedbackService'; // Assuming you have a feedback service

const FeedbackPage = ({ user }) => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await submitFeedback({ 
                order_id: orderId, 
                user_id: user.id, 
                rating, 
                comment 
            });
            setSuccess(true);
            setTimeout(() => navigate('/orders'), 2000); // Redirect after 2 seconds
        } catch (err) {
            setError(err.message || 'Failed to submit feedback.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
                <Alert severity="success">Thank you for your feedback!</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom align="center">Leave Feedback</Typography>
                <Typography align="center" gutterBottom>Order ID: {orderId}</Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Rating
                            name="rating"
                            value={rating}
                            onChange={(event, newValue) => {
                                setRating(newValue);
                            }}
                            size="large"
                        />
                    </Box>
                    <TextField
                        label="Comment"
                        multiline
                        rows={4}
                        fullWidth
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        variant="outlined"
                        required
                    />
                    <Box sx={{ mt: 3, position: 'relative' }}>
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
            </Paper>
        </Container>
    );
};

export default FeedbackPage;
