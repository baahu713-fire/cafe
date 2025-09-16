import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../services/orderService';
import { submitFeedback } from '../services/feedbackService';
import FeedbackForm from '../components/FeedbackForm';
import { ORDER_STATUS } from '../constants/orderStatus';
import { useCart } from '../hooks/useCart';
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
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  Rating,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

const OrderAccordion = ({ order, onFeedbackSubmit, onCancelOrder, onReorder }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const isCancellable = 
    (order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.CONFIRMED) &&
    (new Date() - new Date(order.created_at) < 60000); // 60 seconds

  const canLeaveFeedback = order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.SETTLED;
  const canReorder = order.status !== ORDER_STATUS.CANCELLED;

  return (
    <Accordion sx={{ mb: 2, borderRadius: '12px', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Grid container alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
            <Grid item xs={12} sm={2}><Typography sx={{ fontWeight: 'bold' }}>#{order.id}</Typography></Grid>
            <Grid item xs={12} sm={3}><Typography variant="body2">{new Date(order.created_at).toLocaleString()}</Typography></Grid>
            <Grid item xs={6} sm={2}><StatusChip status={order.status} /></Grid>
            <Grid item xs={6} sm={2}><Typography sx={{ fontWeight: 'bold' }}>₹{parseFloat(order.total_price).toFixed(2)}</Typography></Grid>
            <Grid item xs={12} sm={3}>
                {order.feedback ? (
                    <Rating value={order.feedback.rating} readOnly size="small" />
                ) : canLeaveFeedback ? (
                    <Chip label="Feedback Needed" color="info" size="small" variant="outlined" />
                ) : null}
            </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'grey.50', p: 3 }}>
        <Typography variant="h6" gutterBottom>Order Items</Typography>
        <List disablePadding sx={{ mb: 2 }}>
          {Array.isArray(order.items) && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <ListItem key={item.id || index} disableGutters sx={{ py: 0.5 }}>
                <ListItemText
                  primary={`${item.name_at_order} (x${item.quantity})`}
                  secondary={`Price: ₹${(item.price_at_order * item.quantity).toFixed(2)}`}
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" sx={{ fontStyle: 'italic', ml: 2 }}>
              Item details are not available for this order.
            </Typography>
          )}
        </List>
        <Divider sx={{ my: 2 }} />

        {order.comment && (
            <Box mb={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Your Comment:</Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{order.comment}"</Typography>
            </Box>
        )}

        <Grid container justifyContent="flex-end" alignItems="center">
            {isCancellable && (
                <Button size="small" color="error" onClick={() => onCancelOrder(order.id)} sx={{ mr: 1 }}>
                    Cancel Order
                </Button>
            )}
            {canReorder && (
                <Button size="small" variant="outlined" color="primary" onClick={() => onReorder(order)}>
                    Reorder
                </Button>
            )}
        </Grid>

        {canLeaveFeedback && (
          <Box mt={2}>
            {order.feedback ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '8px' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Your Feedback</Typography>
                <Rating value={order.feedback.rating} readOnly />
                {order.feedback.comment && <Typography variant="body2" sx={{ mt: 1 }}>{order.feedback.comment}</Typography>}
              </Paper>
            ) : (
                <Box textAlign="right">
                    <Button size="small" onClick={() => setShowFeedbackForm(!showFeedbackForm)}>
                        {showFeedbackForm ? 'Cancel' : 'Leave Feedback'}
                    </Button>
                </Box>
            )}

            <Collapse in={showFeedbackForm} timeout="auto" unmountOnExit>
              <FeedbackForm
                orderId={order.id}
                onSubmit={async (orderId, rating, comment) => {
                  try {
                    await onFeedbackSubmit(orderId, rating, comment);
                    setShowFeedbackForm(false);
                  } catch (error) {
                    throw error;
                  }
                }}
              />
            </Collapse>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

const MyOrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const fetchOrders = useCallback(async (currentPage) => {
    setLoading(true);
    try {
      const { orders: newOrders, total: totalOrders } = await getMyOrders(currentPage, 5);
      setOrders(prev => currentPage === 1 ? newOrders : [...prev, ...newOrders]);
      setTotal(totalOrders);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/login');
      } else {
        setError(err.message || 'Failed to fetch orders.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchOrders(nextPage);
  };

  useEffect(() => {
    const interval = setInterval(() => {
        setOrders(prevOrders => [...prevOrders]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFeedbackSubmit = async (orderId, rating, comment) => {
    try {
        await submitFeedback(orderId, { rating, comment });
        fetchOrders(1);
    } catch (err) {
        throw err;
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
        try {
            await cancelOrder(orderId);
            fetchOrders(1);
        } catch (err) {
            setError(err.message || 'Failed to cancel the order.');
        }
    }
  };

  const handleReorder = async (order) => {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
        setError("This order has no items available to reorder.");
        return;
    }

    try {
      for (const item of order.items) {
        const reorderItem = {
          id: item.menu_item_id, // Correctly use menu_item_id
          name: item.name_at_order,
          price: parseFloat(item.price_at_order),
        };
        await addToCart(reorderItem, item.quantity);
      }
      navigate('/cart');
    } catch (err) {
      console.error("Reorder failed:", err);
      setError('Failed to add items to cart. Please try again.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const search = searchTerm.toLowerCase();
    return (
        order.id.toString().includes(search) ||
        order.status.toLowerCase().includes(search) ||
        (order.comment && order.comment.toLowerCase().includes(search)) ||
        new Date(order.created_at).toLocaleDateString().includes(search) ||
        (order.feedback && order.feedback.rating.toString().includes(search)) ||
        (order.feedback && order.feedback.comment && order.feedback.comment.toLowerCase().includes(search))
    );
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                My Orders
            </Typography>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by ID, Status, Comments, Date, or Rating..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                    sx: { borderRadius: '8px' }
                }}
            />
        </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {filteredOrders.length > 0 && (
          filteredOrders.map(order => (
            <OrderAccordion 
              key={order.id} 
              order={order} 
              onFeedbackSubmit={handleFeedbackSubmit} 
              onCancelOrder={handleCancelOrder} 
              onReorder={handleReorder} 
            />
          ))
      )}

      {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      )}

      {!loading && orders.length === 0 && !searchTerm && (
        <Paper sx={{ textAlign: 'center', p: 4, borderRadius: '16px' }}>
          <Typography variant="h6">You haven't placed any orders yet.</Typography>
          <Button variant="contained" component={Link} to="/" sx={{ mt: 2 }}>
            Start Shopping
          </Button>
        </Paper>
      )}

      {!loading && orders.length < total && !searchTerm && (
        <Box textAlign="center" sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleLoadMore} disabled={loading}>
                Load More Orders
            </Button>
        </Box>
      )}

      {!loading && searchTerm && filteredOrders.length === 0 && (
          <Paper sx={{ textAlign: 'center', p: 4, borderRadius: '16px' }}>
              <Typography variant="h6">No orders match your search.</Typography>
          </Paper>
      )}

    </Container>
  );
};

export default MyOrdersPage;
