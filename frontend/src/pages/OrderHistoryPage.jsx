import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Button
} from '@mui/material';
import { getOrdersForUser } from '../services/orderService';
import { Link } from 'react-router-dom';

const OrderHistoryPage = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const userOrders = await getOrdersForUser();
                setOrders(userOrders);
            } catch (err) {
                setError(err.message || 'Failed to fetch orders.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom align="center">Your Order History</Typography>
            {orders.length === 0 ? (
                <Typography align="center">You have no orders yet.</Typography>
            ) : (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Order ID</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Feedback</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>{order.id}</TableCell>
                                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>₹{order.total_price.toFixed(2)}</TableCell>
                                        <TableCell>{order.status}</TableCell>
                                        <TableCell>
                                            {order.status === 'Delivered' && (
                                                <Button 
                                                    component={Link} 
                                                    to={`/feedback/${order.id}`}
                                                    variant="outlined"
                                                >
                                                    Leave Feedback
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Container>
    );
};

export default OrderHistoryPage;
