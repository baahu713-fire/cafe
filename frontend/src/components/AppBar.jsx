import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import ReceiptIcon from '@mui/icons-material/Receipt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';
import HoverAvatar from './HoverAvatar';
import NotificationBell from './NotificationBell';

const AppNav = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
  const [adminAnchorEl, setAdminAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleAdminMenuOpen = (event) => {
    setAdminAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMoreAnchorEl(null);
    setAdminAnchorEl(null);
  };

  const handleAdminNavigate = (path) => {
    navigate(path);
    handleMenuClose();
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
      <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>
        <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Profile
      </MenuItem>
      <MenuItem component={RouterLink} to="/bill-summary" onClick={handleMenuClose}>
        <ReceiptIcon sx={{ mr: 1, fontSize: 20 }} /> Bill Summary
      </MenuItem>
      <MenuItem component={RouterLink} to="/scheduled-orders" onClick={handleMenuClose}>
        <ScheduleIcon sx={{ mr: 1, fontSize: 20 }} /> Scheduled Orders
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Logout
      </MenuItem>
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
      {user && (
        <MenuItem component={RouterLink} to="/bill-summary" onClick={handleMenuClose}>
          <ReceiptIcon sx={{ mr: 1, fontSize: 20 }} /> Bill Summary
        </MenuItem>
      )}
      {user && (
        <MenuItem component={RouterLink} to="/scheduled-orders" onClick={handleMenuClose}>
          <ScheduleIcon sx={{ mr: 1, fontSize: 20 }} /> Scheduled Orders
        </MenuItem>
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
              <HoverAvatar
                src={`/api/users/${user.id}/photo`}
                alt={user.username}
                name={user.name || user.username}
                size={40}
              />
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
                {user && (user.isAdmin || user.isSuperAdmin) && (
                  <>
                    <Button
                      color="inherit"
                      onClick={handleAdminMenuOpen}
                      endIcon={<ExpandMoreIcon />}
                    >
                      Admin Dashboard
                    </Button>
                    <Menu
                      anchorEl={adminAnchorEl}
                      open={Boolean(adminAnchorEl)}
                      onClose={handleMenuClose}
                    >
                      <MenuItem onClick={() => handleAdminNavigate('/admin/orders')}>Manage Orders</MenuItem>
                      <MenuItem onClick={() => handleAdminNavigate('/admin/items')}>Manage Items</MenuItem>
                      <MenuItem onClick={() => handleAdminNavigate('/admin/daily-summary')}>Daily Consumption</MenuItem>
                      <MenuItem onClick={() => handleAdminNavigate('/admin/settlement')}>Settlement User Bills</MenuItem>
                      <MenuItem onClick={() => handleAdminNavigate('/admin/bills')}>Generate Bills</MenuItem>
                      {user.isSuperAdmin && (
                        <MenuItem onClick={() => handleAdminNavigate('/admin/users')}>Manage Users</MenuItem>
                      )}
                      {user.isSuperAdmin && (
                        <MenuItem onClick={() => handleAdminNavigate('/admin/cmc')}>Manage CMC</MenuItem>
                      )}
                    </Menu>
                  </>
                )}
              </Box>

              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>Logged in as: {user.username}</Typography>
                  <NotificationBell />
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
                      <HoverAvatar
                        src={`/api/users/${user.id}/photo`}
                        alt={user.username}
                        name={user.name || user.username}
                        size={40}
                        enlargedSize={150}
                      />
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
