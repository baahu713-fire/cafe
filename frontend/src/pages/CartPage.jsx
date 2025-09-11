import React from 'react';
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
    Alert
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useCart } from '../hooks/useCart';

const CartPage = () => {
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
                                {cart.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell component="th" scope="row">
                                            {item.name}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                    <Remove />
                                                </IconButton>
                                                <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                                                <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                    <Add />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                                        <TableCell align="right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                            <IconButton color="error" onClick={() => removeFromCart(item.id)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ mt: 4, textAlign: 'right' }}>
                        <Typography variant="h5">Subtotal ({itemCount} items): ₹{totalPrice.toFixed(2)}</Typography>
                        <TextField
                            label="Add a comment to your order..."
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            sx={{ my: 2 }}
                        />
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large" 
                            onClick={() => placeOrder('No comments')} // Replace with actual comment
                            disabled={isPlacingOrder}
                        >
                            {isPlacingOrder ? <CircularProgress size={24} /> : 'Place Order'}
                        </Button>
                        {orderError && <Alert severity="error" sx={{ mt: 2 }}>{orderError}</Alert>}
                    </Box>
                </Paper>
            )}
        </Container>
    );
};

export default CartPage;
