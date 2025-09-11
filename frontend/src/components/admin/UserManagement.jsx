import React, { useState, useEffect, useMemo } from 'react';
import { getAllUsers } from '../../services/userService';
import { getAllOrders, settleAllUserOrders } from '../../services/orderService';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, Typography, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField
} from '@mui/material';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSettleDialog, setOpenSettleDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, ordersData] = await Promise.all([
        getAllUsers(),
        getAllOrders(),
      ]);
      setUsers(usersData);
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const userOrderStats = useMemo(() => {
    if (!users.length || !orders.length) return {};

    const stats = {};
    users.forEach(user => {
      const userOrders = orders.filter(o => o.user_id === user.id);
      stats[user.id] = {
        delivered: userOrders.filter(o => o.status === 'Delivered').length,
        settled: userOrders.filter(o => o.status === 'Settled').length,
      };
    });
    return stats;
  }, [users, orders]);

  const handleOpenSettleDialog = (userId) => {
    setSelectedUserId(userId);
    setOpenSettleDialog(true);
  };

  const handleCloseSettleDialog = () => {
    setOpenSettleDialog(false);
    setSelectedUserId(null);
  };

  const handleSettleAll = async () => {
    if (selectedUserId) {
      try {
        // Use the new service function to settle all orders for the user
        await settleAllUserOrders(selectedUserId);
        // Refetch all data to get the latest status
        await fetchData();
      } catch (err) {
        console.error("Failed to settle user's orders:", err);
        alert(err.response?.data?.message || err.message);
      } finally {
        handleCloseSettleDialog();
      }
    }
  };

  const filteredUsers = useMemo(() => {
      return users.filter(user => 
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [users, searchTerm]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Manage User Settlements</Typography>
      <TextField 
          label="Search by Email"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
      />
      <TableContainer>
        <Table stickyHeader aria-label="user management table">
          <TableHead>
            <TableRow>
              <TableCell>User Email</TableCell>
              <TableCell>Delivered Orders</TableCell>
              <TableCell>Settled Orders</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow hover key={user.id}>
                <TableCell component="th" scope="row">{user.email}</TableCell>
                <TableCell>{userOrderStats[user.id]?.delivered || 0}</TableCell>
                <TableCell>{userOrderStats[user.id]?.settled || 0}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleOpenSettleDialog(user.id)}
                    disabled={userOrderStats[user.id]?.delivered === 0}
                  >
                    Settle All
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
        <DialogTitle>Settle All Delivered Orders?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to settle all delivered orders for this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettleDialog}>Cancel</Button>
          <Button onClick={handleSettleAll} color="primary" autoFocus>
            Confirm Settle All
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserManagement;
