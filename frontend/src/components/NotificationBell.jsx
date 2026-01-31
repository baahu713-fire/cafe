import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    Button,
    CircularProgress,
    ListItemText,
    ListItemIcon,
    Tooltip,
    Fade,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getUnreadNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

const POLLING_INTERVAL = 60000; // Poll every 60 seconds

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const open = Boolean(anchorEl);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            const data = await getUnreadNotifications();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            // Don't spam error messages, just log once
            if (err.response?.status !== 429) {
                setError('Failed to load notifications');
            }
        }
    }, [user]);

    // Initial fetch and polling
    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Set up polling for real-time updates
        const interval = setInterval(fetchNotifications, POLLING_INTERVAL);

        return () => clearInterval(interval);
    }, [user, fetchNotifications]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        // Don't refresh on every click to avoid rate limits
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Mark as read
            await markAsRead(notification.id);

            // Update local state
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Close menu and navigate to orders with refresh flag
            handleClose();
            navigate('/orders?refresh=true');
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await markAllAsRead();
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate time remaining for dispute (24 hours from order creation)
    const getTimeRemaining = (orderCreatedAt) => {
        if (!orderCreatedAt) return null;

        const createdTime = new Date(orderCreatedAt).getTime();
        const expiryTime = createdTime + (24 * 60 * 60 * 1000); // 24 hours
        const now = Date.now();
        const remaining = expiryTime - now;

        if (remaining <= 0) return 'Expired';

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        }
        return `${minutes}m remaining`;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    // Don't render if no user
    if (!user) return null;

    return (
        <>
            <Tooltip title="Notifications" arrow>
                <IconButton
                    color="inherit"
                    onClick={handleClick}
                    aria-label={`${unreadCount} unread notifications`}
                    aria-controls={open ? 'notification-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    sx={{
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                            transform: 'scale(1.1)',
                        },
                    }}
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        max={99}
                        sx={{
                            '& .MuiBadge-badge': {
                                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                    '0%': { transform: 'scale(1)' },
                                    '50%': { transform: 'scale(1.1)' },
                                    '100%': { transform: 'scale(1)' },
                                },
                            },
                        }}
                    >
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                id="notification-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
                PaperProps={{
                    elevation: 8,
                    sx: {
                        width: 360,
                        maxHeight: 480,
                        borderRadius: 2,
                        overflow: 'hidden',
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Notifications
                        </Typography>
                        {unreadCount > 0 && (
                            <Button
                                size="small"
                                onClick={handleMarkAllAsRead}
                                disabled={loading}
                                sx={{
                                    color: 'white',
                                    textTransform: 'none',
                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                                }}
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
                            >
                                Mark all read
                            </Button>
                        )}
                    </Box>
                </Box>

                <Divider />

                {/* Notifications List */}
                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            No new notifications
                        </Typography>
                    </Box>
                ) : (
                    notifications.map((notification) => (
                        <MenuItem
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            sx={{
                                py: 2,
                                px: 2,
                                borderLeft: '3px solid',
                                borderColor: 'primary.main',
                                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                '&:hover': {
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <ListItemIcon>
                                <ShoppingBagIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {notification.message}
                                    </Typography>
                                }
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTimeIcon sx={{ fontSize: 14 }} />
                                            {formatTime(notification.created_at)}
                                        </Typography>
                                        {notification.order_created_at && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mt: 0.5,
                                                    color: getTimeRemaining(notification.order_created_at) === 'Expired' ? 'error.main' : 'warning.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                ⏰ {getTimeRemaining(notification.order_created_at)} to dispute
                                            </Typography>
                                        )}
                                    </Box>
                                }
                            />
                        </MenuItem>
                    ))
                )}

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ p: 1.5, textAlign: 'center' }}>
                            <Button
                                size="small"
                                onClick={() => {
                                    handleClose();
                                    navigate('/orders?refresh=true');
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                View All Orders
                            </Button>
                        </Box>
                    </>
                )}
            </Menu>
        </>
    );
};

export default NotificationBell;
