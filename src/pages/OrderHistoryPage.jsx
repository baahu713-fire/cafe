import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdersForUser } from '../services/orderService';
import { getFeedbackForUser } from '../services/feedbackService';
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
    AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const OrderHistoryPage = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

    const handleLeaveFeedback = (orderId) => {
        navigate(`/feedback/${orderId}`);
    };
    
    const isFeedbackSubmitted = (orderId) => {
        // Check against the feedback state which should be correctly populated
        return feedback.some(f => f.orderId === orderId && f.submittedAt);
    }

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Container><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>My Orders</Typography>
            {orders.length === 0 ? (
                <Typography>You haven't placed any orders yet.</Typography>
            ) : (
                orders.map(order => (
                    <Accordion key={order.id} defaultExpanded sx={{ mb: 2, borderRadius: '16px', '&.Mui-expanded': { mb: 2 } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ml: 2 }}>
                                <Typography variant="h6">Order #{order.id} - {new Date(order.createdAt).toLocaleDateString()}</Typography>
                                <Chip label={order.status} color={order.status === 'Delivered' || order.status === 'Settled' ? 'success' : 'default'} />
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
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Container>
    );
};

export default OrderHistoryPage;
