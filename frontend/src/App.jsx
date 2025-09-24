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
import MenuPage from './pages/MenuPage.jsx';
import CartPage from './pages/CartPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute.jsx'; // Import the new component

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
      <AppNav />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/menu" />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Protected Route */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin/*" element={<AdminPage />} />
        </Route>

        {/* General User Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Route>

      </Routes>
    </ThemeProvider>
  );
}

export default App;
