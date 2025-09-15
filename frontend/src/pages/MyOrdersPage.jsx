import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../services/orderService'; 
import { submitFeedback } from '../services/feedbackService';
import FeedbackForm from '../components/FeedbackForm';
import { ORDER_STATUS } from '../constants/orderStatus';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  Rating
} from '@mui/material';

const StatusChip = ({ status }) => {
  let color = 'default';
  switch (status) {
    case ORDER_STATUS.PENDING:
      color = 'warning';
      break;
    case ORDER_STATUS.CONFIRMED:
      color = 'info';
      break;
    case ORDER_STATUS.DELIVERED:
        color = 'primary';
        break;
    case ORDER_STATUS.SETTLED:
      color = 'success';
      break;
    case ORDER_STATUS.CANCELLED:
      color = 'error';
      break;
    default:
      color = 'default';
  }
  return <Chip label={status} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const OrderCard = ({ order, onFeedbackSubmit, onCancelOrder }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  return (
    <Card sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Grid container justifyContent="space-between" alignItems="flex-start">
          <Grid item>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Order #{order.id}</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(order.created_at).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item>
            <StatusChip status={order.status} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <List disablePadding>
          {Array.isArray(order.items) && order.items.map((item, index) => (
            <ListItem key={item.id || index} disableGutters sx={{ py: 0.5 }}>
              <ListItemText
                primary={`${item.name_at_order} (x${item.quantity})`}
                secondary={`Price: ₹${(item.price_at_order * item.quantity).toFixed(2)}`}
              />
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" align="right" sx={{ fontWeight: 'bold' }}>
          Total: ₹{parseFloat(order.total_price).toFixed(2)}
        </Typography>

        {order.comment && (
            <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 2 }}>
                Comment: {order.comment}
            </Typography>
        )}

        <CardActions sx={{ justifyContent: 'flex-end', p: 0, pt: 2 }}>
            {(order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.CONFIRMED) && (
                <Button size="small" color="error" onClick={() => onCancelOrder(order.id)}>
                    Cancel Order
                </Button>
            )}
        </CardActions>

        {(order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.SETTLED) && (
          <Box mt={2}>
            {order.feedback ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '8px' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Your Feedback</Typography>
                <Rating value={order.feedback.rating} readOnly />
                {order.feedback.comment && <Typography variant="body2" sx={{ mt: 1 }}>{order.feedback.comment}</Typography>}
              </Paper>
            ) : (
              <CardActions sx={{ justifyContent: 'flex-end', p: 0, pt: 1 }}>
                <Button size="small" onClick={() => setShowFeedbackForm(!showFeedbackForm)}>
                  {showFeedbackForm ? 'Cancel' : 'Leave Feedback'}
                </Button>
              </CardActions>
            )}

            <Collapse in={showFeedbackForm} timeout="auto" unmountOnExit>
              <FeedbackForm
                orderId={order.id}
                onSubmit={async (orderId, rating, comment) => {
                  try {
                    await onFeedbackSubmit(orderId, rating, comment);
                    setShowFeedbackForm(false);
                  } catch (error) {
                    // Re-throw the error so the FeedbackForm can catch it and display the error message.
                    throw error;
                  }
                }}
              />
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const userOrders = await getMyOrders();
      setOrders(userOrders);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFeedbackSubmit = async (orderId, rating, comment) => {
    console.log(`MyOrdersPage: Submitting feedback for order ${orderId}`, { rating, comment });
    try {
        await submitFeedback(orderId, { rating, comment });
        fetchOrders(); // Refresh on success
    } catch (err) {
        // Re-throw the error so the form can display it
        throw err;
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
        try {
            await cancelOrder(orderId);
            fetchOrders(); // Refresh the orders list
        } catch (err) {
            setError(err.message || 'Failed to cancel the order.');
        }
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
        My Orders
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : orders.length === 0 ? (
        <Paper sx={{ textAlign: 'center', p: 4, borderRadius: '16px' }}>
          <Typography variant="h6">You haven't placed any orders yet.</Typography>
          <Button variant="contained" component={Link} to="/" sx={{ mt: 2 }}>
            Start Shopping
          </Button>
        </Paper>
      ) : (
        orders.map(order => <OrderCard key={order.id} order={order} onFeedbackSubmit={handleFeedbackSubmit} onCancelOrder={handleCancelOrder} />)
      )}
    </Container>
  );
};

export default MyOrdersPage;
