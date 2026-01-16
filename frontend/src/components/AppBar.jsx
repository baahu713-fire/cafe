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
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircle from '@mui/icons-material/AccountCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';

const AppNav = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMoreAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id="primary-search-account-menu"
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>Profile</MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id="primary-search-account-menu-mobile"
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(mobileMoreAnchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem component={RouterLink} to="/menu" onClick={handleMenuClose}>Menu</MenuItem>
      <MenuItem component={RouterLink} to="/daily-specials" onClick={handleMenuClose}>Daily Specials</MenuItem>
      <MenuItem component={RouterLink} to="/contact" onClick={handleMenuClose}>Contact CMC</MenuItem>
      {user && !user.isAdmin && (
        <MenuItem component={RouterLink} to="/orders" onClick={handleMenuClose}>My Orders</MenuItem>
      )}
      {user && user.isAdmin && (
        <MenuItem component={RouterLink} to="/admin" onClick={handleMenuClose}>Admin Dashboard</MenuItem>
      )}
      <MenuItem component={RouterLink} to="/favorites" onClick={handleMenuClose}>
        <IconButton size="large" aria-label="favorites" color="inherit">
          <FavoriteIcon />
        </IconButton>
        <p>Favorites</p>
      </MenuItem>
      <MenuItem component={RouterLink} to="/cart" onClick={handleMenuClose}>
        <IconButton size="large" aria-label="shopping cart" color="inherit">
          <Badge badgeContent={itemCount} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
        <p>Cart</p>
      </MenuItem>
      {user ? (
        <MenuItem onClick={handleProfileMenuOpen}>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            color="inherit"
          >
            {user.photo ? (
              <Avatar src={`/api/users/${user.id}/photo`} alt={user.username} />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          <p>Profile</p>
        </MenuItem>
      ) : (
        [
          <MenuItem key="login" component={RouterLink} to="/login" onClick={handleMenuClose}>Login</MenuItem>,
          <MenuItem key="register" component={RouterLink} to="/register" onClick={handleMenuClose}>Register</MenuItem>
        ]
      )}
    </Menu>
  );


  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: 'none' }}>
        <Toolbar>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 700 }}>
            The Cafe Central
          </Typography>

          {isMobile ? (
            <>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton
                size="large"
                aria-label="show more"
                aria-controls="primary-search-account-menu-mobile"
                aria-haspopup="true"
                onClick={handleMobileMenuOpen}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Box sx={{ flexGrow: 1, display: 'flex', ml: 2 }}>
                <Button color="inherit" component={RouterLink} to="/menu">
                  Menu
                </Button>
                <Button color="inherit" component={RouterLink} to="/daily-specials">
                  Daily Specials
                </Button>
                <Button color="inherit" component={RouterLink} to="/contact">
                  Contact CMC
                </Button>
                {user && !user.isAdmin && (
                  <Button color="inherit" component={RouterLink} to="/orders">
                    My Orders
                  </Button>
                )}
                {user && user.isAdmin && (
                  <Button color="inherit" component={RouterLink} to="/admin">
                    Admin Dashboard
                  </Button>
                )}
              </Box>

              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>Logged in as: {user.username}</Typography>
                  <IconButton component={RouterLink} to="/favorites" color="inherit">
                    <FavoriteIcon />
                  </IconButton>
                  <IconButton component={RouterLink} to="/cart" color="inherit">
                    <Badge badgeContent={itemCount} color="primary">
                      <ShoppingCartIcon />
                    </Badge>
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={handleProfileMenuOpen}
                    color="inherit"
                    sx={{ ml: 1 }}
                  >
                    {user.photo ? (
                      <Avatar src={`/api/users/${user.id}/photo`} alt={user.username} />
                    ) : (
                      <AccountCircle />
                    )}
                  </IconButton>
                </Box>
              ) : (
                <>
                  <IconButton component={RouterLink} to="/favorites" color="inherit">
                    <FavoriteIcon />
                  </IconButton>
                  <IconButton component={RouterLink} to="/cart" color="inherit">
                    <Badge badgeContent={itemCount} color="primary">
                      <ShoppingCartIcon />
                    </Badge>
                  </IconButton>
                  <Button color="inherit" component={RouterLink} to="/login">Login</Button>
                  <Button variant="contained" component={RouterLink} to="/register">Register</Button>
                </>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>
      {renderMenu}
      {renderMobileMenu}
    </>
  );
};

export default AppNav;
