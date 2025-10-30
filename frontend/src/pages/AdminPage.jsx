import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import MenuManagement from '../components/admin/MenuManagement';
import OrderManagement from '../components/admin/OrderManagement';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminPage = () => { // Remove user prop
  const { user } = useAuth(); // Get user from AuthContext
  const [value, setValue] = useState(0);

  if (!user || !user.isAdmin) {
    return <Navigate to="/" />;
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
        <Typography variant="body1" gutterBottom>Welcome, {user.username}!</Typography>
      </Paper>
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="admin dashboard tabs" centered>
            <Tab label="Manage Orders" />
            <Tab label="Manage Items" />
            <Tab label="Manage Users" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <OrderManagement />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <MenuManagement />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <UserManagement />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default AdminPage;
