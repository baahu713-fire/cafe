import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdersForUser, cancelOrder } from '../services/orderService';
import { getFeedbackForUser } from '../services/feedbackService';
import { CANCELLATION_WINDOW_MS } from '../services/mockDatabase';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Snackbar
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const OrderHistoryPage = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState({});
    const navigate = useNavigate();

    const fetchOrderAndFeedbackData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const orderData = await getOrdersForUser(user.id);
            const feedbackData = await getFeedbackForUser(user.id);
            setOrders(orderData);
            setFeedback(feedbackData);
        } catch (err) {
            console.error("Detailed error fetching order history:", err);
            setError(`Failed to load order history: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            fetchOrderAndFeedbackData();
        }
    }, [user, navigate, fetchOrderAndFeedbackData]);

    useEffect(() => {
        const timers = {};
        orders.forEach(order => {
            if (order.status === 'Pending') {
                const intervalId = setInterval(() => {
                    const timeSinceOrder = new Date() - new Date(order.createdAt);
                    const remainingTime = CANCELLATION_WINDOW_MS - timeSinceOrder;
                    if (remainingTime > 0) {
                        setCountdown(prev => ({ ...prev, [order.id]: Math.ceil(remainingTime / 1000) }));
                    } else {
                        setCountdown(prev => ({ ...prev, [order.id]: 0 }));
                        clearInterval(intervalId);
                    }
                }, 1000);
                timers[order.id] = intervalId;
            }
        });

        return () => {
            Object.values(timers).forEach(clearInterval);
        };
    }, [orders]);


    const handleCancelOrder = async (orderId) => {
        try {
            await cancelOrder(orderId, user.id);
            setSuccess("Order cancelled successfully!");
            fetchOrderAndFeedbackData(); // Refresh the orders
        } catch (err) {
            setError(err.message || "Failed to cancel order.");
        }
    };

    const handleLeaveFeedback = (orderId) => {
        navigate(`/feedback/${orderId}`);
    };
    
    const isFeedbackSubmitted = (orderId) => {
        return feedback.some(f => f.orderId === orderId && f.submittedAt);
    }

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>My Orders</Typography>
            {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} message={success} />}
            {orders.length === 0 ? (
                <Typography>You haven't placed any orders yet.</Typography>
            ) : (
                orders.map(order => (
                    <Accordion key={order.id} defaultExpanded sx={{ mb: 2, borderRadius: '16px', '&.Mui-expanded': { mb: 2 } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ml: 2 }}>
                                <Typography variant="h6">Order #{order.id} - {new Date(order.createdAt).toLocaleDateString()}</Typography>
                                <Chip label={order.status} color={
                                    order.status === 'Delivered' || order.status === 'Settled' ? 'success' :
                                    order.status === 'Cancelled' ? 'error' : 'default'
                                } />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead><TableRow><TableCell>Item</TableCell><TableCell>Quantity</TableCell><TableCell>Price</TableCell></TableRow></TableHead>
                                    <TableBody>
                                        {order.items.map((item, index) => (
                                            <TableRow key={index}><TableCell>{item.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>₹{item.price.toFixed(2)}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', pt: 2, pr: 1 }}>
                                <Typography variant="subtitle1" sx={{ mr: 4, fontWeight: 'bold' }}>Total: ₹{order.total.toFixed(2)}</Typography>
                                {(order.status === 'Delivered' || order.status === 'Settled') && (
                                     <Button variant="contained" onClick={() => handleLeaveFeedback(order.id)} disabled={isFeedbackSubmitted(order.id)}>
                                         {isFeedbackSubmitted(order.id) ? 'Feedback Submitted' : 'Leave Feedback'}
                                     </Button>
                                )}
                                {order.status === 'Pending' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Button 
                                            variant="outlined" 
                                            color="error" 
                                            onClick={() => handleCancelOrder(order.id)} 
                                            disabled={countdown[order.id] === 0}
                                            sx={{ mr: 2 }}
                                        >
                                            Cancel Order
                                        </Button>
                                        {countdown[order.id] > 0 && (
                                            <Typography variant="caption" color="text.secondary">
                                                Time left: {countdown[order.id]}s
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Container>
    );
};

export default OrderHistoryPage;
