import React, { useState } from 'react';
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
    Button,
    IconButton,
    TextField,
    CircularProgress,
    Alert,
    Autocomplete
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import useActiveUsers from '../hooks/useActiveUsers';
import { useAuth } from '../contexts/AuthContext';

const CartPage = () => {
    const { user } = useAuth();
    const {
        cart,
        updateQuantity,
        removeFromCart,
        totalPrice,
        itemCount,
        placeOrder,
        isPlacingOrder,
        orderError,
        orderSuccess
    } = useCart();

    const [comment, setComment] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const { activeUsers: users } = useActiveUsers(user);
    const navigate = useNavigate();
    const location = useLocation();

    if (orderSuccess) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>Thank you for your order!</Typography>
                <Typography>Your order has been placed successfully.</Typography>
                <Button variant="contained" color="primary" sx={{ mt: 4 }} href="/menu">
                    Continue Shopping
                </Button>
            </Container>
        );
    }

    const handleCheckout = () => {
        if (!user) {
            navigate('/login', { state: { from: location } });
        } else {
            if (user.isAdmin && !selectedUser) {
                alert('Please select a user to place the order for.');
                return;
            }
            placeOrder(comment, selectedUser ? selectedUser.id : null);
        }
    };
    
    const getPrice = (item) => {
        const price = item.proportion?.price ?? item.price;
        const numericPrice = parseFloat(price);
        return isNaN(numericPrice) ? 0 : numericPrice;
    };

    const renderCheckoutButton = () => {
        if (isPlacingOrder) {
            return <CircularProgress size={24} />;
        }
        return user ? 'Place Order' : 'Login to Place Order';
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom align="center">Your Cart</Typography>
            {cart.length === 0 ? (
                <Typography align="center">Your cart is empty.</Typography>
            ) : (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell align="center">Quantity</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="center">Remove</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cart.map(item => {
                                    const itemPrice = getPrice(item);
                                    const totalItemPrice = itemPrice * item.quantity;

                                    return (
                                        <TableRow key={`${item.id}-${item.proportion?.name}`}>
                                            <TableCell component="th" scope="row">
                                                {item.name}{item.proportion ? ` - ${item.proportion.name}` : ''}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1, item.proportion?.name)}>
                                                        <Remove />
                                                    </IconButton>
                                                    <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                                                    <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1, item.proportion?.name)}>
                                                        <Add />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">₹{itemPrice.toFixed(2)}</TableCell>
                                            <TableCell align="right">₹{totalItemPrice.toFixed(2)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton color="error" onClick={() => removeFromCart(item.id, item.proportion?.name)}>
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ mt: 4, textAlign: 'right' }}>
                        {user && user.isAdmin && (
                            <Autocomplete
                                options={users}
                                getOptionLabel={(option) => option.username}
                                onChange={(event, newValue) => {
                                    setSelectedUser(newValue);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Place Order For"
                                        variant="outlined"
                                    />
                                )}
                                sx={{ my: 2 }}
                            />
                        )}
                        <Typography variant="h5">Subtotal ({itemCount} items): ₹{totalPrice.toFixed(2)}</Typography>
                        <TextField
                            label="Add a comment to your order..."
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            sx={{ my: 2 }}
                        />
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large" 
                            onClick={handleCheckout}
                            disabled={isPlacingOrder}
                        >
                            {renderCheckoutButton()}
                        </Button>
                        {orderError && user && <Alert severity="error" sx={{ mt: 2 }}>{orderError}</Alert>}
                    </Box>
                </Paper>
            )}
        </Container>
    );
};

export default CartPage;
