import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getMyOrders, cancelOrder, disputeOrder } from '../services/orderService';
import { submitFeedback } from '../services/feedbackService';
import FeedbackForm from '../components/FeedbackForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { ORDER_STATUS } from '../constants/orderStatus';
import { useCart } from '../hooks/useCart';
import useMenu from '../hooks/useMenu';
import { useAuth } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

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
  InputLabel,
  Stack,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';

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
  const [, setTick] = useState(0); // Force re-render for time updates

  // Auto-update time remaining every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Calculate time since order creation
  const orderAgeMs = new Date() - new Date(order.created_at);
  const orderAgeHours = orderAgeMs / (1000 * 60 * 60);

  // For regular orders: cancellable within 60 seconds
  const isRegularCancellable =
    !order.created_by_admin &&
    (order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.CONFIRMED) &&
    orderAgeMs < 60000; // 60 seconds

  // For admin-created orders: can cancel within 24 hours (only PENDING/CONFIRMED, not DELIVERED)
  const isAdminOrder = !!order.created_by_admin;
  const adminOrderTimeRemaining = isAdminOrder ? Math.max(0, 24 - orderAgeHours) : 0;
  const adminOrderExpired = isAdminOrder && orderAgeHours >= 24;

  // Admin orders can only be cancelled if PENDING or CONFIRMED (not DELIVERED)
  const isAdminOrderCancellable =
    isAdminOrder &&
    !adminOrderExpired &&
    [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status);

  const isCancellable = isRegularCancellable || isAdminOrderCancellable;

  const canLeaveFeedback = order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.SETTLED;
  const canReorder = order.status !== ORDER_STATUS.CANCELLED;

  // Dispute: regular orders always can dispute, admin orders only within 24h (any status except CANCELLED/SETTLED)
  const regularCanDispute = !isAdminOrder && [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED].includes(order.status);
  const adminCanDispute = isAdminOrder && !adminOrderExpired && [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED].includes(order.status);
  const canDispute = (regularCanDispute || adminCanDispute) && !order.disputed;

  // Debug logging
  // console.log('Order:', order.id, 'isAdminOrder:', isAdminOrder, 'isCancellable:', isCancellable, 'canDispute:', canDispute, 'status:', order.status, 'created_by_admin:', order.created_by_admin);

  // Format remaining time for display
  const formatTimeRemaining = () => {
    if (!isAdminOrder || adminOrderExpired) return '';
    const hours = Math.floor(adminOrderTimeRemaining);
    const minutes = Math.floor((adminOrderTimeRemaining % 1) * 60);
    return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
  };

  return (
    <Accordion sx={{ mb: 2, borderRadius: '12px', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Grid container alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
          <Grid size={{ xs: 12, sm: 2 }}><Typography sx={{ fontWeight: 'bold' }}>#{order.id}</Typography></Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="body2">{new Date(order.created_at).toLocaleString('en-GB')}</Typography>
            {order.is_scheduled && (
              <Chip
                label={`Scheduled: ${new Date(order.scheduled_for_date).toLocaleDateString('en-GB')}`}
                color="info"
                size="small"
                sx={{ mt: 0.5, width: 'fit-content', fontWeight: 'bold' }}
              />
            )}
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <StatusChip status={order.status} />
            {order.disputed && <Chip label="Disputed" color="error" size="small" sx={{ ml: 1, fontWeight: 'bold' }} />}
            {isAdminOrder && (
              <Tooltip title="This order was placed on your behalf by an admin" arrow>
                <Chip
                  label="Admin Order"
                  color="secondary"
                  size="small"
                  sx={{ ml: 1, fontWeight: 'bold' }}
                />
              </Tooltip>
            )}
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}><Typography sx={{ fontWeight: 'bold' }}>₹{parseFloat(order.total_price).toFixed(2)}</Typography></Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
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

        {isAdminOrder && !adminOrderExpired && !order.disputed && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This order was placed by an admin on your behalf. You have <strong>{formatTimeRemaining()}</strong> to cancel or dispute.
          </Alert>
        )}
        {isAdminOrder && adminOrderExpired && !order.disputed && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            The 24-hour window to cancel or dispute this admin-created order has expired.
          </Alert>
        )}

        <Grid container justifyContent="flex-end" alignItems="center">
          {isCancellable && (
            <Tooltip title={isAdminOrder ? `Cancel within ${formatTimeRemaining()}` : 'Cancel within 60 seconds'} arrow>
              <Button size="small" color="error" onClick={() => onCancelOrder(order.id)} sx={{ mr: 1 }}>
                Cancel Order
              </Button>
            </Tooltip>
          )}
          {canReorder && (
            <Button size="small" variant="outlined" color="primary" onClick={() => onReorder(order)}>
              Reorder
            </Button>
          )}
          {canDispute && (
            <Tooltip title={isAdminOrder && !order.disputed ? `Dispute within ${formatTimeRemaining()}` : ''} arrow>
              <span>
                <Button size="small" color="warning" onClick={() => onDisputeOrder(order.id)} sx={{ mr: 1 }} disabled={order.disputed}>
                  {order.disputed ? 'Disputed' : 'Dispute'}
                </Button>
              </span>
            </Tooltip>
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

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { menuItems, loading: menuLoading, error: menuError } = useMenu();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'cancel',
    orderId: null,
    title: '',
    message: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async (currentPage, forceReset = false) => {
    setLoading(true);
    try {
      const startDateStr = filterStartDate ? filterStartDate.format('YYYY-MM-DD') : undefined;
      const endDateStr = filterEndDate ? filterEndDate.format('YYYY-MM-DD') : undefined;

      const { orders: newOrders, total: totalOrders } = await getMyOrders(currentPage, 5, startDateStr, endDateStr);

      if (currentPage === 1 || forceReset) {
        setOrders(newOrders);
        setPage(1);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }
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
  }, [navigate, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (user) {
      fetchOrders(1, true);
    }
  }, [fetchOrders, user]);

  // Refresh orders when navigating from notifications (via URL param or when location changes)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('refresh') === 'true' && user) {
      fetchOrders(1, true);
      // Remove the refresh param from URL
      navigate('/orders', { replace: true });
    }
  }, [location.search, user, fetchOrders, navigate]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchOrders(nextPage);
  };

  useEffect(() => {
    // Only set up auto-refresh if valid filters/search are NOT active as strict "page 1" auto refresh can vary.
    // Actually, simple polling of current list is okay if we just refresh the data.
    // But `fetchOrders` appends data if page > 1.
    // Let's keep the existing "fake" polling instruction or remove it if it was placeholder.
    // The existing code was `setOrders(prev => [...prev])` which does nothing but re-render.
    // I'll keep it as is to minimize diff noise, or remove it as it's useless. It looks useless.
    // I'll leave it out to clean up.
  }, []);

  const handleFeedbackSubmit = async (orderId, rating, comment) => {
    try {
      await submitFeedback(orderId, { rating, comment });
      await fetchOrders(1, true);
    } catch (err) {
      throw err;
    }
  };

  const handleCancelOrder = (orderId) => {
    setConfirmDialog({
      open: true,
      type: 'cancel',
      orderId,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
    });
  };

  const handleDisputeOrder = (orderId) => {
    setConfirmDialog({
      open: true,
      type: 'dispute',
      orderId,
      title: 'Dispute Order',
      message: 'Are you sure you want to dispute this order? An admin will review your dispute.',
    });
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  const handleConfirmAction = async () => {
    const { type, orderId } = confirmDialog;
    setActionLoading(true);

    try {
      if (type === 'cancel') {
        await cancelOrder(orderId);
      } else if (type === 'dispute') {
        await disputeOrder(orderId);
      }
      setConfirmDialog(prev => ({ ...prev, open: false }));
      await fetchOrders(1, true);
    } catch (err) {
      console.error(`${type} order error:`, err);
      const message = err.response?.data?.message || err.message || `Failed to ${type} the order.`;
      setError(message);
    } finally {
      setActionLoading(false);
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

  // Local filtering for search/status is fine, BUT now we have server side date filtering.
  // The local filter applies on top of backend results.
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              My Orders
            </Typography>
            {(filterStartDate || filterEndDate) && (
              <Button size="small" onClick={() => { setFilterStartDate(null); setFilterEndDate(null); }}>
                Clear Date Filter
              </Button>
            )}
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search..."
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
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filterStartDate}
                onChange={(newValue) => setFilterStartDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                maxDate={filterEndDate || dayjs()}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <DatePicker
                label="End Date"
                value={filterEndDate}
                onChange={(newValue) => setFilterEndDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                minDate={filterStartDate}
                maxDate={dayjs()}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value=""><em>All</em></MenuItem>
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

      {/* Confirmation Dialog for Cancel/Dispute */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        onConfirm={handleConfirmAction}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.type === 'cancel' ? 'Cancel Order' : 'Dispute Order'}
        cancelText="Go Back"
        loading={actionLoading}
      />
    </LocalizationProvider>
  );
};

export default MyOrdersPage;
