import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers } from '../../services/userService';
import { settleAllUserOrders } from '../../services/orderService';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Typography, Box, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, TablePagination, TextField
} from '@mui/material';
import { debounce } from 'lodash';
import HoverAvatar from '../HoverAvatar';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSettleDialog, setOpenSettleDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async (search = '') => {
    try {
      setLoading(true);
      const { users: fetchedUsers, total } = await getAllUsers(page + 1, rowsPerPage, search);
      setUsers(fetchedUsers);
      setTotalUsers(total);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 300), [page, rowsPerPage]);

  useEffect(() => {
    debouncedFetchUsers(searchTerm);
    return () => {
      debouncedFetchUsers.cancel();
    };
  }, [searchTerm, debouncedFetchUsers]);

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
        await settleAllUserOrders(selectedUserId);
        await fetchUsers(searchTerm); // Refetch users to update the data
      } catch (err) {
        console.error("Failed to settle user's orders:", err);
        alert(err.response?.data?.message || err.message);
      } finally {
        handleCloseSettleDialog();
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
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
      <Typography variant="h5" gutterBottom>Manage User Settlements</Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Search by username"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </Box>
      <TableContainer>
        <Table stickyHeader aria-label="user management table">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Delivered Orders</TableCell>
              <TableCell>Total Order Value</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow hover key={user.id}>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HoverAvatar
                      src={`/api/users/${user.id}/photo`}
                      alt={user.name || user.username}
                      name={user.name || user.username}
                      size={32}
                      sx={{ mr: 2 }}
                    />
                    {user.username}
                  </Box>
                </TableCell>
                <TableCell>{user.order_count}</TableCell>
                <TableCell>₹{parseFloat(user.total_order_price || 0).toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleOpenSettleDialog(user.id)}
                    disabled={user.order_count === 0}
                  >
                    Settle All
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
        count={totalUsers}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

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
