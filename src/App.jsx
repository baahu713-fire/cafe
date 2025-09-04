import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header'; // Correctly import Header
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrdersPage from './pages/OrdersPage';
import AdminPage from './pages/AdminPage';
import CartPage from './pages/CartPage';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { deepPurple, amber } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: deepPurple[500],
    },
    secondary: {
      main: amber[500],
    },
  },
  typography: {
      fontFamily: 'Roboto, sans-serif',
  }
});

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Header /> {/* Use the Header component */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route 
                path="/orders"
                element={<PrivateRoute><OrdersPage /></PrivateRoute>}
              />
              <Route 
                path="/admin"
                element={<PrivateRoute roles={['admin', 'superadmin']}><AdminPage /></PrivateRoute>}
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
