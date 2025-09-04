import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { placeOrder } from '../services/orderService';
import {
    Container,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Box,
    Alert,
    Link,
    TextField
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCart } from '../hooks/useCart';

const CartPage = ({ user }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [comments, setComments] = useState('');
    const navigate = useNavigate();
    const { cart, updateCart, removeFromCart, clearCart } = useCart();

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        if (!user) {
            setError('You must be logged in to place an order.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await placeOrder(user.id, cart, comments);
            clearCart(); // This should now work as expected.
            navigate('/orders'); // Redirect to order history.
        } catch (err) {
            setError('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Your Cart
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {cart.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6">Your cart is empty.</Typography>
                    <Button component={RouterLink} to="/menu" variant="contained" sx={{ mt: 2 }}>
                        Continue Shopping
                    </Button>
                </Paper>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                    <TableCell align="center">Quantity</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="center">Remove</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cart.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell component="th" scope="row">{item.name}</TableCell>
                                        <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconButton size="small" onClick={() => updateCart(item, item.quantity - 1)}>
                                                    <RemoveCircleOutlineIcon />
                                                </IconButton>
                                                <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                                                <IconButton size="small" onClick={() => updateCart(item, item.quantity + 1)}>
                                                    <AddCircleOutlineIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                            <IconButton color="error" onClick={() => removeFromCart(item.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ mt: 3 }}>
                        <TextField
                            fullWidth
                            label="Optional: Add a comment to your order"
                            multiline
                            rows={3}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            variant="outlined"
                        />
                    </Box>
                    <Box sx={{ mt: 3, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'grey.100', borderRadius: '16px' }}>
                        <Button 
                            variant="outlined" 
                            color="error"
                            onClick={() => clearCart()}
                         >
                            Reset
                         </Button>
                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Total: ₹{cartTotal.toFixed(2)}
                            </Typography>
                            <Button 
                                variant="contained" 
                                size="large" 
                                sx={{ ml: 3 }} 
                                onClick={handleCheckout}
                                disabled={!user || loading}
                            >
                                {loading ? 'Processing...' : 'Proceed to Checkout'}
                            </Button>
                         </Box>
                    </Box>
                    {!user && 
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Please <Link component={RouterLink} to="/login">login</Link> to proceed with your order.
                        </Alert>
                    }
                </>
            )}
        </Container>
    );
};

export default CartPage;
