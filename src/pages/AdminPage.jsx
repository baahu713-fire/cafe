import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box
} from '@mui/material';
import UserList from '../components/UserList';
import MenuManagement from '../components/admin/MenuManagement';

const AdminPage = ({ user }) => {
  // If the user is not an admin, redirect to the home page
  if (!user || !user.isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
        <Typography variant="body1" gutterBottom>Welcome, {user.email}!</Typography>
      </Paper>
      <MenuManagement user={user} />
      <UserList />
    </Container>
  );
};

export default AdminPage;
