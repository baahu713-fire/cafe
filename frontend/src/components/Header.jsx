import React, { useState, useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box, Badge, Avatar } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../contexts/AuthContext';
import { CartContext } from '../contexts/CartContext';
import getImageUrl from '../utils/getImageUrl';

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const { getCartItemCount } = useContext(CartContext);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };
  
  const handleNavigate = (path) => {
      navigate(path);
      handleClose();
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
          The Coffee House
        </Typography>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            <Button color="inherit" component={Link} to="/">Home</Button>
            <Button color="inherit" component={Link} to="/menu">Menu</Button>
            {user && <Button color="inherit" component={Link} to="/orders">My Orders</Button>}
        </Box>

        <Box sx={{ flexGrow: 0 }}>
            <IconButton color="inherit" component={Link} to="/cart">
                <Badge badgeContent={getCartItemCount()} color="secondary">
                    <ShoppingCartIcon />
                </Badge>
            </IconButton>
          {user ? (
            <>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar src={getImageUrl(user.photo_url)} alt={user.name || user.username} sx={{ width: 32, height: 32 }}>
                  {!user.photo_url && <AccountCircle />}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: '45px' }}
              >
                {user.isAdmin && (
                  <MenuItem onClick={() => handleNavigate('/admin')}>
                    Admin Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={() => handleNavigate('/orders')}>
                    My Orders
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login" startIcon={<LoginIcon />}>
                Login
              </Button>
              <Button variant="contained" component={Link} to="/register" sx={{ ml: 1, backgroundColor: 'secondary.main' }} startIcon={<PersonAddIcon />}>
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
