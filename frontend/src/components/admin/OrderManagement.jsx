import React, { useState, useEffect, useMemo } from 'react';
import { getAllOrders, updateOrderStatus, cancelOrder } from '../../services/orderService';
import { ORDER_STATUS } from '../../constants/orderStatus';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, Button, Typography, Box, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, TextField, TablePagination, Chip
} from '@mui/material';
import HoverAvatar from '../HoverAvatar';

const OrderDetailsDialog = ({ order, open, onClose }) => {
  if (!order) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Order #{order.id} Details</DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6">Items</Typography>
        <TableContainer component={Paper} sx={{ my: 2 }} >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price at Order</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name_at_order}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">₹{parseFloat(item.price_at_order).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {order.comment && (
          <Box mt={2}>
            <Typography variant="h6">Comment</Typography>
            <Paper elevation={1} sx={{ p: 2, mt: 1, backgroundColor: '#f9f9f9' }}>
              <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                {order.comment}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSettleDialog, setOpenSettleDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { orders: fetchedOrders, total } = await getAllOrders(page + 1, rowsPerPage);
      setOrders(fetchedOrders);
      setTotalOrders(total);
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(o => (o.id === orderId ? updatedOrder : o))
      );
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert('Failed to update order status.');
    }
  };

  const handleOpenSettleDialog = (orderId) => {
    setSelectedOrderId(orderId);
    setOpenSettleDialog(true);
  };

  const handleCloseSettleDialog = () => {
    setOpenSettleDialog(false);
    setSelectedOrderId(null);
  };

  const handleOpenCancelDialog = (orderId) => {
    setSelectedOrderId(orderId);
    setOpenCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
    setSelectedOrderId(null);
  };

  const handleSettleOrder = async () => {
    if (selectedOrderId) {
      try {
        const updatedOrder = await updateOrderStatus(selectedOrderId, ORDER_STATUS.SETTLED);
        setOrders(prevOrders =>
          prevOrders.map(o => (o.id === selectedOrderId ? updatedOrder : o))
        );
      } catch (err) {
        console.error("Failed to settle order:", err);
        alert(err.response?.data?.message || err.message);
      } finally {
        handleCloseSettleDialog();
      }
    }
  };

  const handleCancelOrder = async () => {
    if (selectedOrderId) {
      try {
        const updatedOrder = await cancelOrder(selectedOrderId);
        setOrders(prevOrders =>
          prevOrders.map(o => (o.id === selectedOrderId ? updatedOrder : o))
        );
      } catch (err) {
        console.error("Failed to cancel order:", err);
        alert(err.response?.data?.message || 'Failed to cancel order.');
      } finally {
        handleCloseCancelDialog();
      }
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrderDetails(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrderDetails(null);
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const searchTermLower = searchTerm.toLowerCase();
        const userNameMatch = order.user_name && order.user_name.toLowerCase().includes(searchTermLower);
        const usernameMatch = order.username && order.username.toLowerCase().includes(searchTermLower);
        return (
          order.id.toString().includes(searchTermLower) ||
          userNameMatch ||
          usernameMatch ||
          order.status.toLowerCase().includes(searchTermLower)
        );
      })
      .filter(order => {
        if (!filterDate) return true;
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        return orderDate === filterDate;
      });
  }, [orders, searchTerm, filterDate]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Manage All Orders</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="Search by ID, User, or Status"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
        <TextField
          label="Filter by Date"
          type="date"
          variant="outlined"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <Button onClick={() => setFilterDate('')} variant="outlined">Clear</Button>
      </Box>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Total Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Disputed</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow hover key={order.id}>
                <TableCell component="th" scope="row">#{order.id}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HoverAvatar
                      src={`/api/users/${order.user_id}/photo`}
                      alt={order.user_name}
                      name={order.user_name}
                      size={32}
                      sx={{ mr: 2 }}
                    />
                    <div>
                      <Typography variant="body2">{order.user_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{order.username}</Typography>
                    </div>
                  </Box>
                </TableCell>
                <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                <TableCell>₹{parseFloat(order.total_price).toFixed(2)}</TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={[ORDER_STATUS.SETTLED, ORDER_STATUS.CANCELLED].includes(order.status)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    {Object.values(ORDER_STATUS).map(status => (
                      <MenuItem key={status} value={status}
                        disabled={[ORDER_STATUS.SETTLED, ORDER_STATUS.CANCELLED].includes(status) && order.status !== status}
                      >
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  {order.disputed && <Chip label="Disputed" color="error" />}
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewDetails(order)}
                    sx={{ mr: 1 }}
                  >
                    View Details
                  </Button>
                  {[ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status) && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleOpenCancelDialog(order.id)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => handleOpenSettleDialog(order.id)}
                    disabled={order.status !== ORDER_STATUS.DELIVERED}
                  >
                    Settle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalOrders}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <OrderDetailsDialog order={selectedOrderDetails} open={!!selectedOrderDetails} onClose={handleCloseDetails} />

      <Dialog open={openSettleDialog} onClose={handleCloseSettleDialog}>
        <DialogTitle>Settle Order Bill?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark order #{selectedOrderId} as settled? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettleDialog}>Cancel</Button>
          <Button onClick={handleSettleOrder} color="primary" autoFocus>Confirm Settle</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCancelDialog} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel order #{selectedOrderId}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Back</Button>
          <Button onClick={handleCancelOrder} color="error" autoFocus>Confirm Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default OrderManagement;
