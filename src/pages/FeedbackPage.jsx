import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitFeedback } from '../services/feedbackService';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Rating,
    Box,
    Alert,
} from '@mui/material';

const FeedbackPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (rating === 0) {
            setError('Please provide a rating.');
            return;
        }

        try {
            await submitFeedback(parseInt(orderId), rating, comment);
            setSuccess('Thank you for your feedback!');
            setTimeout(() => navigate('/orders'), 2000); // Redirect after 2s
        } catch (err) {
            setError('Failed to submit feedback. Please try again.');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Leave Feedback
                </Typography>
                <Typography gutterBottom>
                    How was your order (ID: {orderId})?
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                        fullWidth
                        multiline
                        rows={4}
                        label="Leave a comment (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        margin="normal"
                    />
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                    <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth 
                        sx={{ mt: 2, fontWeight: 'bold' }}
                        disabled={!!success} // Disable after successful submission
                    >
                        Submit Feedback
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};

export default FeedbackPage;
