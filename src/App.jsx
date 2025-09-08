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
import { CartProvider, useCart } from './hooks/useCart.jsx';
import { FavoritesProvider } from './hooks/useFavorites';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    // The cart will be cleared via the CartProvider's own logic now
  };

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
      <CartProvider user={user}>
        <FavoritesProvider user={user}>
          {/* We need a small component to get the cart context for the AppBar */}
          <AppContent user={user} onLogout={handleLogout} onLogin={handleLogin} onRegister={handleRegister} />
        </FavoritesProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

// This component now receives all the props it needs from App
const AppContent = ({ user, onLogout, onLogin, onRegister }) => {
  const { itemCount, clearCart } = useCart();
  
  // We need to clear the cart on logout
  const handleLogoutAndClearCart = () => {
    onLogout();
    clearCart();
  }

  return (
    <>
      <AppBar user={user} onLogout={handleLogoutAndClearCart} cartItemCount={itemCount} />
      <Routes>
        <Route path="/" element={<Navigate to="/menu" />} />
        <Route path="/menu" element={<MenuPage user={user} />} />
        <Route path="/cart" element={<CartPage user={user} />} />
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
        <Route path="/register" element={<RegisterPage onRegister={onRegister} />} />
        <Route path="/admin" element={<AdminPage user={user} />} />
        <Route path="/orders" element={user ? <OrderHistoryPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/favorites" element={user ? <FavoritesPage /> : <Navigate to="/login" />} />
        <Route path="/feedback/:orderId" element={user ? <FeedbackPage user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
};

export default App;
