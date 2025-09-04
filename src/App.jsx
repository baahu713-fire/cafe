import React, { useState, useEffect } from 'react';
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
import theme from './theme';
import AppBar from './components/AppBar';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import FavoritesPage from './pages/FavoritesPage';
import FeedbackPage from './pages/FeedbackPage';
import { login as loginService, register as registerService } from './services/authService';
import { useCart } from './hooks/useCart';
import { FavoritesProvider } from './hooks/useFavorites';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { totalCartItems, clearCart } = useCart();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogin = (email, password) => {
    const loggedInUser = loginService(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const handleRegister = (email, password) => {
    try {
      const newUser = registerService(email, password);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleLogout = () => {
    setUser(null);
    clearCart();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FavoritesProvider>
        <AppBar user={user} onLogout={handleLogout} cartItemCount={totalCartItems} />
        <Routes>
          <Route path="/" element={<Navigate to="/menu" />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage user={user} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
          <Route path="/admin" element={<AdminPage user={user} />} />
          <Route path="/orders" element={user ? <OrderHistoryPage user={user} /> : <Navigate to="/login" />} />
          <Route path="/favorites" element={user ? <FavoritesPage /> : <Navigate to="/login" />} />
          <Route path="/feedback/:orderId" element={user ? <FeedbackPage user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

export default App;
