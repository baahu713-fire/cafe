import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { placeOrder } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const CartPage = () => {
  const { user } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (!user) {
      alert('You must be logged in to place an order.');
      navigate('/login');
      return;
    }
    try {
      await placeOrder(user.id, cartItems);
      alert('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (error) {
      alert(`Failed to place order: ${error.message}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Your Shopping Cart
      </Typography>
      {cartItems.length === 0 ? (
        <Alert severity="info">Your cart is empty. <Button color="inherit" size="small" onClick={() => navigate('/menu')}>Go Shopping</Button></Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cartItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell component="th" scope="row">{item.name}</TableCell>
                  <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                      inputProps={{ min: 1, style: { textAlign: 'center', width: '50px' } }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => removeFromCart(item.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right"><Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total</Typography></TableCell>
                <TableCell align="right"><Typography variant="h6" sx={{ fontWeight: 'bold' }}>₹{getCartTotal().toFixed(2)}</Typography></TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {cartItems.length > 0 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
           <Button variant="outlined" color="error" onClick={clearCart}>Clear Cart</Button>
           <Button variant="contained" size="large" onClick={handlePlaceOrder}>Place Order</Button>
        </Box>
      )}
    </Container>
  );
};

export default CartPage;
