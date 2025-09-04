import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircle from '@mui/icons-material/AccountCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';

const AppNav = ({ user, onLogout, cartItemCount }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderUserMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id="primary-search-account-menu"
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      {user ? (
        <div>
          <MenuItem component={RouterLink} to="/orders" onClick={handleMenuClose}>My Orders</MenuItem>
          {user.isAdmin && (
            <MenuItem component={RouterLink} to="/admin" onClick={handleMenuClose}>Admin Dashboard</MenuItem>
          )}
          <MenuItem onClick={() => { onLogout(); handleMenuClose(); }}>Logout</MenuItem>
        </div>
      ) : (
        <div>
          <MenuItem component={RouterLink} to="/login" onClick={handleMenuClose}>Login</MenuItem>
          <MenuItem component={RouterLink} to="/register" onClick={handleMenuClose}>Register</MenuItem>
        </div>
      )}
    </Menu>
  );

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          CyberCafe
        </Typography>
        <Button color="inherit" component={RouterLink} to="/menu">
          Menu
        </Button>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <IconButton component={RouterLink} to="/favorites" color="inherit">
            <FavoriteIcon />
          </IconButton>
          <IconButton component={RouterLink} to="/cart" color="inherit">
            <Badge badgeContent={cartItemCount} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            aria-label="show more"
            aria-controls="primary-search-account-menu-mobile"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
      {renderUserMenu}
    </AppBar>
  );
};

export default AppNav;
