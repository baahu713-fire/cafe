import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getFeedbackEligibleOrders, submitFeedback } from '../services/feedbackService';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Rating,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

const FeedbackPage = ({ user }) => {
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchEligibleOrders = async () => {
      try {
        setLoading(true);
        const orders = await getFeedbackEligibleOrders(user.id);
        setEligibleOrders(orders);
        // Pre-select order if coming from the My Orders page
        const orderIdFromParams = searchParams.get('orderId');
        if (orderIdFromParams && orders.some(o => o.id.toString() === orderIdFromParams)) {
          setSelectedOrder(orderIdFromParams);
        }
      } catch (err) {
        setError(err.message || 'Failed to load orders for feedback.');
      } finally {
        setLoading(false);
      }
    };
    fetchEligibleOrders();
  }, [user, navigate, searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (rating === 0) {
        setError('Please select a star rating.');
        return;
    }
    try {
        await submitFeedback({ 
            orderId: selectedOrder, 
            userId: user.id, 
            rating, 
            comment 
        });
        setSuccess('Thank you for your feedback! You will be redirected shortly.');
        setTimeout(() => navigate('/my-orders'), 3000);
    } catch (err) {
        setError(err.message || 'Failed to submit feedback.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: '16px' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
          Submit Feedback
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : success ? (
            <Alert severity="success">{success}</Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
                <InputLabel id="order-select-label">Select an Order</InputLabel>
                <Select
                    labelId="order-select-label"
                    value={selectedOrder}
                    label="Select an Order"
                    onChange={(e) => setSelectedOrder(e.target.value)}
                    required
                >
                    {eligibleOrders.length === 0 && <MenuItem disabled>No eligible orders found</MenuItem>}
                    {eligibleOrders.map(order => (
                        <MenuItem key={order.id} value={order.id}>
                            Order #{order.id} - {new Date(order.createdAt).toLocaleDateString()}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
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
              margin="normal"
              fullWidth
              multiline
              rows={4}
              label="Optional Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => navigate('/my-orders')}>
                    Back to Orders
                </Button>
                <Button type="submit" variant="contained" disabled={!selectedOrder || loading}>
                    Submit
                </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default FeedbackPage;
