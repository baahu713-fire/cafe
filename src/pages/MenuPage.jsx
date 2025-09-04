import React, { useState, useEffect, useContext } from 'react';
import { getMenu } from '../services/menuService';
import { CartContext } from '../contexts/CartContext';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  Snackbar
} from '@mui/material';

const MenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useContext(CartContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuData = await getMenu();
        setMenu(menuData);
      } catch (err) {
        setError('Failed to load menu. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleAddToCart = (item) => {
    addToCart(item);
    setSnackbarMessage(`${item.name} added to cart!`);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 4 }}>
        Our Menu
      </Typography>
      <Grid container spacing={4}>
        {menu.map((item) => (
          <Grid item key={item.id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: 3 }}>
              <CardMedia
                component="img"
                height="240"
                image={item.image}
                alt={item.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  {item.name}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  ₹{item.price.toFixed(2)}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                <Button 
                  size="large" 
                  variant="contained" 
                  onClick={() => handleAddToCart(item)}
                  fullWidth
                >
                  Add to Cart
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default MenuPage;
