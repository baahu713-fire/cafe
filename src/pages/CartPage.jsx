import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
    TextField,
    Snackbar,
    FormControl,
    Autocomplete
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCart } from '../hooks/useCart.jsx';
import { getAllUsers } from '../services/userService';

const CartPage = ({ user }) => {
    const [comments, setComments] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const navigate = useNavigate();
    const {
        cart,
        updateQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        isPlacingOrder,
        orderError,
        orderSuccess,
        setOrderSuccess,
        setOrderError
    } = useCart();

    useEffect(() => {
        if (user?.isAdmin) {
            const fetchUsers = async () => {
                const allUsers = await getAllUsers();
                setUsers(allUsers);
            };
            fetchUsers();
        }
    }, [user]);

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        await placeOrder(comments, selectedUserId);
    };

    useEffect(() => {
        if (orderSuccess) {
            const timer = setTimeout(() => {
                setOrderSuccess(false);
                if (user?.isAdmin) {
                    navigate('/admin');
                } else {
                    navigate('/orders');
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [orderSuccess, navigate, setOrderSuccess, user]);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Your Cart
            </Typography>
            {orderError && <Alert severity="error" sx={{ mb: 2 }}>{orderError}</Alert>}
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
                                                <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                    <RemoveCircleOutlineIcon />
                                                </IconButton>
                                                <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                                                <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
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

                    {user?.isAdmin && (
                        <Box sx={{ mt: 3 }}>
                            <FormControl fullWidth>
                                <Autocomplete
                                    options={users}
                                    getOptionLabel={(option) => option.email}
                                    onChange={(event, newValue) => {
                                        setSelectedUserId(newValue ? newValue.id : null);
                                        if (orderError && newValue) {
                                          setOrderError(null);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Search and select a user to order for"
                                            variant="outlined"
                                            error={!!orderError}
                                            helperText={orderError}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Box>
                    )}

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
                                disabled={!user || isPlacingOrder}
                            >
                                {isPlacingOrder ? 'Processing...' : 'Proceed to Checkout'}
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
            <Snackbar
                open={orderSuccess}
                autoHideDuration={3000}
                onClose={() => setOrderSuccess(false)}
                message="Order placed successfully! Redirecting..."
            />
        </Container>
    );
};

export default CartPage;
