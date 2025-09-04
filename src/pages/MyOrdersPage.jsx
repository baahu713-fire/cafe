import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getOrdersForUser, cancelOrder } from '../services/orderService';
import { CANCELLATION_WINDOW_MS } from '../services/mockDatabase';
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
  Divider
} from '@mui/material';

const StatusChip = ({ status }) => {
  let color = 'default';
  if (status === 'Pending') color = 'warning';
  if (status === 'Completed' || status === 'Delivered') color = 'success';
  if (status === 'Cancelled') color = 'error';
  if (status === 'Settled') color = 'info';
  return <Chip label={status} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const OrderCard = ({ order, onCancel }) => {
  const [canCancel, setCanCancel] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (order.status === 'Pending') {
      const interval = setInterval(() => {
        const timeSinceOrder = new Date() - new Date(order.createdAt);
        const remaining = CANCELLATION_WINDOW_MS - timeSinceOrder;
        if (remaining > 0) {
          setCanCancel(true);
          setTimeLeft(Math.round(remaining / 1000));
        } else {
          setCanCancel(false);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order]);

  return (
    <Card sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Grid container justifyContent="space-between" alignItems="flex-start">
          <Grid item>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Order #{order.id}</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(order.createdAt).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item>
            <StatusChip status={order.status} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <List disablePadding>
          {order.items.map(item => (
            <ListItem key={item.id} disableGutters sx={{ py: 0.5 }}>
              <ListItemText 
                primary={`${item.name} (x${item.quantity})`} 
                secondary={`Price: ₹${(item.price * item.quantity).toFixed(2)}`}
              />
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" align="right" sx={{ fontWeight: 'bold' }}>
          Total: ₹{order.total.toFixed(2)}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        {canCancel && (
          <Button size="small" color="error" onClick={() => onCancel(order.id)}>
            Cancel Order ({timeLeft}s)
          </Button>
        )}
        {(order.status === 'Delivered' || order.status === 'Settled') && (
           <Button size="small" component={Link} to={`/feedback?orderId=${order.id}`}>
            Submit Feedback
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const MyOrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const userOrders = await getOrdersForUser(user.id);
      setOrders(userOrders);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(orderId, user.id);
      // Refresh the orders list to show the updated status
      fetchOrders();
    } catch (err) {
      alert(err.message);
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
        <Alert severity="error">{error}</Alert>
      ) : orders.length === 0 ? (
        <Paper sx={{ textAlign: 'center', p: 4, borderRadius: '16px' }}>
          <Typography variant="h6">You haven't placed any orders yet.</Typography>
          <Button variant="contained" component={Link} to="/" sx={{ mt: 2 }}>
            Start Shopping
          </Button>
        </Paper>
      ) : (
        orders.map(order => <OrderCard key={order.id} order={order} onCancel={handleCancelOrder} />)
      )}
    </Container>
  );
};

export default MyOrdersPage;
