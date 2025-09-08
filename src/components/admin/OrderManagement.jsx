import React, { useState, useEffect, useMemo } from 'react';
import { getAllOrders, updateOrderStatus, settleOrder, cancelOrder } from '../../services/orderService';
import { getAllUsers } from '../../services/userService'; 
import { CANCELLATION_WINDOW_MS } from '../../services/mockDatabase';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Select, MenuItem, Button, Typography, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField
} from '@mui/material';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSettleDialog, setOpenSettleDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [countdown, setCountdown] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, usersData] = await Promise.all([
          getAllOrders(),
          getAllUsers(),
        ]);
        setOrders(ordersData);
        const usersMap = usersData.reduce((acc, user) => {
          acc[user.id] = user.email;
          return acc;
        }, {});
        setUsers(usersMap);
        setError(null);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timers = {};
    orders.forEach(order => {
        if (order.status === 'Pending') {
            const intervalId = setInterval(() => {
                const timeSinceOrder = new Date() - new Date(order.createdAt);
                const remainingTime = CANCELLATION_WINDOW_MS - timeSinceOrder;
                if (remainingTime > 0) {
                    setCountdown(prev => ({ ...prev, [order.id]: Math.ceil(remainingTime / 1000) }));
                } else {
                    setCountdown(prev => ({ ...prev, [order.id]: 0 }));
                    clearInterval(intervalId);
                }
            }, 1000);
            timers[order.id] = intervalId;
        }
    });

    return () => {
        Object.values(timers).forEach(clearInterval);
    };
}, [orders]);

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
        const updatedOrder = await settleOrder(selectedOrderId);
        setOrders(prevOrders =>
          prevOrders.map(o => (o.id === selectedOrderId ? updatedOrder : o))
        );
      } catch (err) {
        console.error("Failed to settle order:", err);
        alert(err.message);
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
        alert(err.message);
      } finally {
        handleCloseCancelDialog();
      }
    }
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const userEmail = users[order.userId] || '';
        const searchTermLower = searchTerm.toLowerCase();
        return (
          order.id.toString().includes(searchTermLower) ||
          userEmail.toLowerCase().includes(searchTermLower) ||
          order.status.toLowerCase().includes(searchTermLower)
        );
      })
      .filter(order => {
        if (!filterDate) return true;
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === filterDate;
      });
  }, [orders, users, searchTerm, filterDate]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Manage All Orders</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search by ID, Email, or Status"
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
      </Box>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Ordered By</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow hover key={order.id}>
                <TableCell component="th" scope="row">#{order.id}</TableCell>
                <TableCell>{users[order.userId] || 'Unknown User'}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={order.status === 'Delivered' || order.status === 'Settled' || order.status === 'Cancelled'}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="Delivered">Delivered</MenuItem>
                    <MenuItem value="Settled" disabled>Settled</MenuItem>
                    <MenuItem value="Cancelled" disabled>Cancelled</MenuItem>
                  </Select>
                </TableCell>
                <TableCell align="right">
                  {order.status === 'Pending' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Button
                              variant="contained"
                              color="error"
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() => handleOpenCancelDialog(order.id)}
                              disabled={countdown[order.id] === 0}
                          >
                              Cancel
                          </Button>
                          {countdown[order.id] > 0 && (
                            <Typography variant="caption" color="text.secondary">
                                {countdown[order.id]}s
                            </Typography>
                          )}
                      </Box>
                  )}
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => handleOpenSettleDialog(order.id)}
                    disabled={order.status !== 'Delivered'}
                  >
                    Settle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openSettleDialog}
        onClose={handleCloseSettleDialog}
      >
        <DialogTitle>Settle Order Bill?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark order #{selectedOrderId} as settled? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettleDialog}>Cancel</Button>
          <Button onClick={handleSettleOrder} color="primary" autoFocus>
            Confirm Settle
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
      >
        <DialogTitle>Cancel Order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel order #{selectedOrderId}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Back</Button>
          <Button onClick={handleCancelOrder} color="error" autoFocus>
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default OrderManagement;
