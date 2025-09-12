import React, { useState, useEffect } from 'react';
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
    Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import FeedbackForm from '../components/FeedbackForm'; // Assuming you have this component
import StarRating from '../components/StarRating'; // To display ratings

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const userOrders = await getMyOrders();
            setOrders(userOrders);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleFeedbackSubmit = async (orderId, rating, comment) => {
        try {
            await submitFeedback({ orderId, rating, comment });
            // Refresh orders to show the new feedback
            fetchOrders();
        } catch (err) {
            alert('Failed to submit feedback. Please try again.'); // Simple alert for now
        }
    };

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'Delivered':
                return 'success';
            case 'Pending':
                return 'warning';
            case 'Cancelled':
                return 'error';
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

    if (error) {
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
                    placeholder="Search by Order ID, Status, Comment, Date, or Rating..."
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

            {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                    <Accordion key={order.id} sx={{ mb: 2, borderRadius: '12px', '&:before': { display: 'none' } }} >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} >
                            <Grid container alignItems="center" spacing={2}>
                                <Grid item xs={12} sm={2}><Typography sx={{ fontWeight: 'bold' }}>#{order.id}</Typography></Grid>
                                <Grid item xs={12} sm={3}><Typography variant="body2">{new Date(order.created_at).toLocaleString()}</Typography></Grid>
                                <Grid item xs={6} sm={2}><Chip label={order.status} color={getStatusChipColor(order.status)} size="small" /></Grid>
                                <Grid item xs={6} sm={2}><Typography sx={{ fontWeight: 'bold' }}>${order.total_price.toFixed(2)}</Typography></Grid>
                                <Grid item xs={12} sm={3}>
                                    {order.feedback ? (
                                        <StarRating value={order.feedback.rating} readOnly />
                                    ) : order.status === 'Delivered' ? (
                                        <Chip label="Feedback Needed" color="info" size="small" variant="outlined" />
                                    ) : null}
                                </Grid>
                            </Grid>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'grey.50', p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>Order Items</Typography>
                                    <List disablePadding>
                                        {order.items.map(item => (
                                            <ListItem key={item.id} disableGutters dense>
                                                <ListItemText 
                                                    primary={`${item.name_at_order}`}
                                                    secondary={`Qty: ${item.quantity} @ $${parseFloat(item.price_at_order).toFixed(2)}`}
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
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>Feedback</Typography>
                                    {order.feedback ? (
                                        <Box>
                                            <StarRating value={order.feedback.rating} readOnly />
                                            <Typography variant="body2" sx={{ mt: 1 }}>{order.feedback.comment}</Typography>
                                        </Box>
                                    ) : order.status === 'Delivered' ? (
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
