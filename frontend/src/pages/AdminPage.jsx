import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import DailySummaryPage from './admin/DailySummaryPage';
import AdminBillsPage from './admin/AdminBillsPage';
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
  const location = useLocation();
  const navigate = useNavigate();

  const tabPaths = [
    '/admin/orders',
    '/admin/items',
    '/admin/daily-summary',
    '/admin/settlement',
    '/admin/bills',
    '/admin/users',
    '/admin/cmc'
  ];

  // Determine initial tab from URL
  const getTabFromPath = (path) => {
    // Default to /admin/orders if just /admin
    if (path === '/admin' || path === '/admin/') return 0;

    const index = tabPaths.findIndex(p => path.startsWith(p));
    return index !== -1 ? index : 0;
  };

  const [value, setValue] = useState(getTabFromPath(location.pathname));

  useEffect(() => {
    setValue(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Redirect if user is not an admin or superadmin
  if (!user || (!(user.isAdmin || user.isSuperAdmin))) {
    return <Navigate to="/" />;
  }

  const handleChange = (event, newValue) => {
    navigate(tabPaths[newValue]);
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
            <Tab label="Daily Consumption" />
            <Tab label="Settlement User Bills" />
            <Tab label="Generate Bills" />
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
          <DailySummaryPage />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <SettlementUserBills />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <AdminBillsPage />
        </TabPanel>
        {isSuperAdmin && (
          <TabPanel value={value} index={5}>
            <ManageUsers />
          </TabPanel>
        )}
        {isSuperAdmin && (
          <TabPanel value={value} index={6}>
            <CMCManagement />
          </TabPanel>
        )}
      </Box>
    </Container>
  );
};

export default AdminPage;

