import React, { useState, useEffect, useCallback } from 'react';
import { getMyOrders } from '../services/orderService';
import { submitFeedback } from '../services/feedbackService';
import {
    Container,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Box,
    Chip,
    Grid,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    Paper,
    Rating
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import FeedbackForm from '../components/FeedbackForm';

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrders = useCallback(async () => {
        try {
            const userOrders = await getMyOrders();
            setOrders(userOrders);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch orders.');
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchOrders().finally(() => setLoading(false));
    }, [fetchOrders]);

    const handleFeedbackSubmit = async (orderId, rating, comment) => {
        try {
            // Correctly call the service with the right arguments
            await submitFeedback(orderId, { rating, comment });
            // On success, refresh the orders to show the new feedback
            await fetchOrders();
        } catch (err) {
            // Re-throw the error so the FeedbackForm can catch it and display the specific message.
            throw err;
        }
    };

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Settled':
                return 'success';
            case 'Pending':
                return 'warning';
            case 'Cancelled':
                return 'error';
            case 'Confirmed':
                return 'info';
            default:
                return 'default';
        }
    };

    const filteredOrders = orders.filter(order => {
        const search = searchTerm.toLowerCase();
        return (
            order.id.toString().includes(search) ||
            order.status.toLowerCase().includes(search) ||
            (order.comment && order.comment.toLowerCase().includes(search)) ||
            new Date(order.created_at).toLocaleDateString().includes(search) ||
            (order.feedback && order.feedback.rating.toString().includes(search))
        );
    });

    if (loading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Container>;
    }

    if (error && orders.length === 0) {
        return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    My Orders
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by Order ID, Status, Date, or Rating..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '8px' }
                    }}
                />
            </Paper>

            {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

            {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                    <Accordion key={order.id} sx={{ mb: 2, borderRadius: '12px', '&:before': { display: 'none' } }} >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} >
                            <Grid container alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
                                <Grid size={{ xs: 12, sm: 2 }}><Typography sx={{ fontWeight: 'bold' }}>#{order.id}</Typography></Grid>
                                <Grid size={{ xs: 12, sm: 3 }}><Typography variant="body2">{new Date(order.created_at).toLocaleString()}</Typography></Grid>
                                <Grid size={{ xs: 6, sm: 2 }}><Chip label={order.status} color={getStatusChipColor(order.status)} size="small" /></Grid>
                                <Grid size={{ xs: 6, sm: 2 }}><Typography sx={{ fontWeight: 'bold' }}>₹{parseFloat(order.total_price).toFixed(2)}</Typography></Grid>
                                <Grid size={{ xs: 12, sm: 3 }}>
                                    {order.feedback ? (
                                        <Rating value={order.feedback.rating} readOnly />
                                    ) : (order.status === 'Delivered' || order.status === 'Settled') ? (
                                        <Chip label="Feedback Needed" color="info" size="small" variant="outlined" />
                                    ) : null}
                                </Grid>
                            </Grid>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'grey.50', p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" gutterBottom>Order Items</Typography>
                                    <List disablePadding>
                                        {(order.items || []).map(item => (
                                            <ListItem key={item.id} disableGutters dense>
                                                <ListItemText
                                                    primary={`${item.name_at_order}`}
                                                    secondary={`Qty: ${item.quantity} @ ₹${parseFloat(item.price_at_order).toFixed(2)}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                    {order.comment && (
                                        <Box mt={2}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Your Comment:</Typography>
                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{order.comment}"</Typography>
                                        </Box>
                                    )}
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" gutterBottom>Feedback</Typography>
                                    {order.feedback ? (
                                        <Box>
                                            <Rating value={order.feedback.rating} readOnly />
                                            <Typography variant="body2" sx={{ mt: 1 }}>{order.feedback.comment}</Typography>
                                        </Box>
                                    ) : (order.status === 'Delivered' || order.status === 'Settled') ? (
                                        <FeedbackForm orderId={order.id} onSubmit={handleFeedbackSubmit} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            You can leave feedback once this order has been delivered.
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                ))
            ) : (
                <Typography sx={{ mt: 4, textAlign: 'center' }} color="text.secondary">
                    {searchTerm ? 'No orders match your search criteria.' : 'You have no orders yet.'}
                </Typography>
            )}
        </Container>
    );
};

export default OrderHistoryPage;
