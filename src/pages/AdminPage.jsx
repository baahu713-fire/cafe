import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers } from '../services/userService';
import { getOrdersForUser, updateOrderStatus } from '../services/orderService';
import { getAllFeedback } from '../services/feedbackService';
import MenuManagement from '../components/admin/MenuManagement'; // Import the extracted component
import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem, // Rename to avoid conflict with our component
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Rating,
  Divider,
} from '@mui/material';

const statusOptions = ['Pending', 'Delivered', 'Cancelled', 'Settled'];

const AdminPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Role-based access control
  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  // Initial data fetch for users and all feedback
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [allUsers, allFeedback] = await Promise.all([
          getAllUsers(),
          getAllFeedback()
        ]);
        setUsers(allUsers);
        setFeedback(allFeedback);
      } catch (err) {
        setError('Failed to load initial admin data.');
      } finally {
        setLoading(false);
      }
    };
    if (user && user.isAdmin) {
      fetchInitialData();
    }
  }, [user]);

  const handleUserChange = useCallback(async (event) => {
    const userId = event.target.value;
    setSelectedUserId(userId);
    if (!userId) {
      setOrders([]);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const userOrders = await getOrdersForUser(userId);
      setOrders(userOrders);
    } catch (err) {
      setError('Failed to fetch orders for the selected user.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      const userOrders = await getOrdersForUser(selectedUserId);
      setOrders(userOrders);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  if (!user || !user.isAdmin) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Admin Dashboard
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Menu Management Section */}
      <MenuManagement user={user} />

      <Divider sx={{ my: 6 }} />

      {/* Order Management Section */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Order Management</Typography>
      <Paper sx={{ p: 3, mb: 4, borderRadius: '16px' }}>
        <FormControl fullWidth>
          <InputLabel id="user-select-label">Select a User to View Their Orders</InputLabel>
          <Select
            labelId="user-select-label"
            value={selectedUserId}
            label="Select a User to View Their Orders"
            onChange={handleUserChange}
          >
            <MuiMenuItem value=""><em>None</em></MuiMenuItem>
            {users.map((u) => <MuiMenuItem key={u.id} value={u.id}>{u.email}</MuiMenuItem>)}
          </Select>
        </FormControl>
      </Paper>

      {loading && selectedUserId && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {selectedUserId && orders.length > 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead><TableRow><TableCell>Order ID</TableCell><TableCell>Date</TableCell><TableCell>Items</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</TableCell>
                  <TableCell>₹{order.total.toFixed(2)}</TableCell>
                  <TableCell><Chip label={order.status} size="small" /></TableCell>
                  <TableCell>
                     <Select defaultValue={order.status} size="small" onChange={(e) => handleStatusChange(order.id, e.target.value)}>
                        {statusOptions.map(s => <MuiMenuItem key={s} value={s}>{s}</MuiMenuItem>)}
                     </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {selectedUserId && !loading && orders.length === 0 && <Typography sx={{ mt: 2, textAlign: 'center' }}>This user has no orders.</Typography>}

      <Divider sx={{ my: 6 }} />

      {/* Feedback Review Section */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>All User Feedback</Typography>
      {loading && feedback.length === 0 && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {feedback.length > 0 ? (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead><TableRow><TableCell>Order ID</TableCell><TableCell>User</TableCell><TableCell>Rating</TableCell><TableCell>Comment</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
            <TableBody>
              {feedback.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.orderId}</TableCell>
                  <TableCell>{f.userEmail}</TableCell>
                  <TableCell><Rating value={f.rating} readOnly size="small" /></TableCell>
                  <TableCell>{f.comment}</TableCell>
                  <TableCell>{new Date(f.submittedAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : !loading && <Typography sx={{ mt: 2, textAlign: 'center' }}>No feedback has been submitted yet.</Typography>}
    </Container>
  );
};

export default AdminPage;
