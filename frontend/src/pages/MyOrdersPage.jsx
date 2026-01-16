import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyOrders, cancelOrder, disputeOrder } from '../services/orderService';
import { submitFeedback } from '../services/feedbackService';
import FeedbackForm from '../components/FeedbackForm';
import { ORDER_STATUS } from '../constants/orderStatus';
import { useCart } from '../hooks/useCart';
import useMenu from '../hooks/useMenu';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

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
  Select,
  MenuItem,
  FormControl,
  InputLabel
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

const OrderAccordion = ({ order, onFeedbackSubmit, onCancelOrder, onDisputeOrder, onReorder }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const isCancellable =
    (order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.CONFIRMED) &&
    (new Date() - new Date(order.created_at) < 60000); // 60 seconds

  const canLeaveFeedback = order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.SETTLED;
  const canReorder = order.status !== ORDER_STATUS.CANCELLED;
  const canDispute = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED].includes(order.status);

  return (
    <Accordion sx={{ mb: 2, borderRadius: '12px', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Grid container alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
          <Grid size={{ xs: 12, sm: 2 }} style={{ width: '10vw' }}><Typography sx={{ fontWeight: 'bold' }}>#{order.id}</Typography></Grid>
          <Grid size={{ xs: 12, sm: 3 }} style={{ width: '10vw' }}><Typography variant="body2">{new Date(order.created_at).toLocaleString()}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 2 }} style={{ width: '10vw' }}>
            <StatusChip status={order.status} />
            {order.disputed && <Chip label="Disputed" color="error" size="small" sx={{ ml: 1, fontWeight: 'bold' }} />}
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }} style={{ width: '10vw' }}><Typography sx={{ fontWeight: 'bold' }}>₹{parseFloat(order.total_price).toFixed(2)}</Typography></Grid>
          <Grid size={{ xs: 12, sm: 3 }} style={{ width: '10vw' }}>
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
          {canDispute && (
            <Button size="small" color="warning" onClick={() => onDisputeOrder(order.id)} sx={{ mr: 1 }} disabled={order.disputed}>
              {order.disputed ? 'Disputed' : 'Dispute'}
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

const MyOrdersPage = () => { // Remove user prop
  const { user } = useAuth(); // Get user from AuthContext
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { menuItems, loading: menuLoading, error: menuError } = useMenu();

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
    if (user) { // Only fetch orders if there is a user
      fetchOrders(1);
    }
  }, [fetchOrders, user]);

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

  const handleDisputeOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to dispute this order?')) {
      try {
        await disputeOrder(orderId);
        fetchOrders(1);
      } catch (err) {
        setError(err.message || 'Failed to dispute the order.');
      }
    }
  };

  const handleReorder = async (order) => {
    if (menuLoading) {
      setError("Menu data is loading, please wait a moment before reordering.");
      return;
    }

    if (menuError) {
      setError("Could not load menu data. Please try again later.");
      return;
    }

    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
      setError("This order has no items available to reorder.");
      return;
    }

    const unavailableItems = [];
    let itemsAdded = 0;

    try {
      for (const orderedItem of order.items) {
        const currentMenuItem = menuItems.find(menuItem => menuItem.id === orderedItem.menu_item_id);

        if (currentMenuItem && currentMenuItem.available) {
          const itemForCart = {
            ...currentMenuItem,
            price: parseFloat(currentMenuItem.price),
          };

          if (orderedItem.proportion_name && orderedItem.proportion_name !== 'Standard') {
            const currentProportion = currentMenuItem.proportions?.find(p => p.name === orderedItem.proportion_name);

            if (currentProportion) {
              itemForCart.proportion = {
                ...currentProportion,
                price: parseFloat(currentProportion.price)
              };
            } else {
              unavailableItems.push(`${orderedItem.name_at_order} (${orderedItem.proportion_name})`);
              continue;
            }
          }

          await addToCart(itemForCart, orderedItem.quantity);
          itemsAdded++;

        } else {
          unavailableItems.push(orderedItem.name_at_order);
        }
      }

      if (unavailableItems.length > 0) {
        setError(`Some items are unavailable and were not added to your cart: ${unavailableItems.join(', ')}.`);
      }

      if (itemsAdded > 0) {
        navigate('/cart');
      } else {
        setError("None of the items from this order are currently available.");
      }

    } catch (err) {
      console.error("Reorder failed:", err);
      setError('An unexpected error occurred while adding items to the cart. Please try again.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const search = searchTerm.toLowerCase();
    const statusMatch = statusFilter ? order.status === statusFilter : true;
    const searchMatch = (
      order.id.toString().includes(search) ||
      order.status.toLowerCase().includes(search) ||
      (order.comment && order.comment.toLowerCase().includes(search)) ||
      new Date(order.created_at).toLocaleDateString().includes(search) ||
      (order.feedback && order.feedback.rating.toString().includes(search)) ||
      (order.feedback && order.feedback.comment && order.feedback.comment.toLowerCase().includes(search))
    );
    return statusMatch && searchMatch;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          My Orders
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
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
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} style={{ width: '10vw' }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                {Object.values(ORDER_STATUS).map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {filteredOrders.length > 0 && (
        filteredOrders.map(order => (
          <OrderAccordion
            key={order.id}
            order={order}
            onFeedbackSubmit={handleFeedbackSubmit}
            onCancelOrder={handleCancelOrder}
            onDisputeOrder={handleDisputeOrder}
            onReorder={handleReorder}
          />
        ))
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      )}

      {!loading && orders.length === 0 && !searchTerm && !statusFilter && (
        <Paper sx={{ textAlign: 'center', p: 4, borderRadius: '16px' }}>
          <Typography variant="h6">You haven't placed any orders yet.</Typography>
          <Button variant="contained" component={Link} to="/" sx={{ mt: 2 }}>
            Start Shopping
          </Button>
        </Paper>
      )}

      {!loading && orders.length < total && !searchTerm && !statusFilter && (
        <Box textAlign="center" sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleLoadMore} disabled={loading}>
            Load More Orders
          </Button>
        </Box>
      )}

      {!loading && (searchTerm || statusFilter) && filteredOrders.length === 0 && (
        <Paper sx={{ textAlign: 'center', p: 4, borderRadius: '16px' }}>
          <Typography variant="h6">No orders match your search.</Typography>
        </Paper>
      )}

    </Container>
  );
};

export default MyOrdersPage;
