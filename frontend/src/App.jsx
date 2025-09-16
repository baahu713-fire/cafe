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
import theme from './theme.js';
import AppBar from './components/AppBar.jsx';
import MenuPage from './pages/MenuPage.jsx';
import CartPage from './pages/CartPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
// Import the new auth service methods
import { login, register, logout, getCurrentUser } from './services/authService.js';
import CartProvider, { useCart } from './hooks/useCart.jsx';
import { FavoritesProvider } from './hooks/useFavorites.jsx';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use the new service function to get the current user
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const loggedInUser = await login(email, password);
      setUser(loggedInUser);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const handleRegister = async (userData) => {
    try {
      const newUser = await register(userData);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const handleLogout = () => {
    logout(); // Clear user data from localStorage
    setUser(null);
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
          <AppContent user={user} onLogout={handleLogout} onLogin={handleLogin} onRegister={handleRegister} />
        </FavoritesProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

const AppContent = ({ user, onLogout, onLogin, onRegister }) => {
  const { itemCount, clearCart } = useCart();
  
  const handleLogoutAndClearCart = () => {
    onLogout();
    clearCart(); // This will now correctly clear the cart on logout
  }

  return (
    <>
      <AppBar user={user} onLogout={handleLogoutAndClearCart} cartItemCount={itemCount} />
      <Routes>
        <Route path="/" element={<Navigate to="/menu" />} />
        <Route path="/menu" element={<MenuPage user={user} />} />
        <Route path="/cart" element={<CartPage user={user} />} />
        {/* Pass the async handlers to the login and register pages */}
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
        <Route path="/register" element={<RegisterPage onRegister={onRegister} />} />
        
        {/* Protected Routes */}
        <Route 
          path="/admin" 
          element={user?.isAdmin ? <AdminPage user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/orders" 
          // element={user ? <OrderHistoryPage user={user} /> : <Navigate to="/login" />} 
          element={user ? <MyOrdersPage user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/favorites" 
          element={user ? <FavoritesPage /> : <Navigate to="/login" />} 
        />
      </Routes>
    </>
  );
};

export default App;
