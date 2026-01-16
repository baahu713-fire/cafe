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
import SettlementUserBills from '../components/admin/SettlementUserBills';
import ManageUsers from '../components/admin/ManageUsers';
import CMCManagement from '../components/admin/CMCManagement';
import { useAuth } from '../contexts/AuthContext';

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

const AdminPage = () => {
  const { user } = useAuth();
  const [value, setValue] = useState(0);

  // Redirect if user is not an admin or superadmin
  if (!user || (!(user.isAdmin || user.isSuperAdmin))) {
    return <Navigate to="/" />;
  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const isAdmin = user.isAdmin;
  const isSuperAdmin = user.isSuperAdmin;

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
            <Tab label="Settlement User Bills" />
            {isSuperAdmin && <Tab label="Manage Users" />}
            {isSuperAdmin && <Tab label="Manage CMC" />}
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <OrderManagement />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <MenuManagement />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <SettlementUserBills />
        </TabPanel>
        {isSuperAdmin && (
          <TabPanel value={value} index={3}>
            <ManageUsers />
          </TabPanel>
        )}
        {isSuperAdmin && (
          <TabPanel value={value} index={4}>
            <CMCManagement />
          </TabPanel>
        )}
      </Box>
    </Container>
  );
};

export default AdminPage;

