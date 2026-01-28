import React from 'react';
import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
} from '@mui/material';
import theme from './theme.js';
import AppNav from './components/AppBar.jsx';
import Footer from './components/Footer.jsx';
import MenuPage from './pages/MenuPage.jsx';
import DailySpecialsPage from './pages/DailySpecialsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import BillSummaryPage from './pages/BillSummaryPage.jsx';
import ScheduledOrdersPage from './pages/ScheduledOrdersPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppNav />
        <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/menu" />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/daily-specials" element={<DailySpecialsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Admin Protected Route */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin/*" element={<AdminPage />} />
            </Route>

            {/* General User Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/orders" element={<MyOrdersPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/bill-summary" element={<BillSummaryPage />} />
              <Route path="/scheduled-orders" element={<ScheduledOrdersPage />} />
            </Route>

          </Routes>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
