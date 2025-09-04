import React from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../hooks/useCart';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Box,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';

const FavoritesPage = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 4 }}>
        My Favorites
      </Typography>
      {favorites.length === 0 ? (
        <Box textAlign="center">
          <Alert severity="info" sx={{ justifyContent: 'center' }}>You haven't added any favorites yet!</Alert>
          <Button component={Link} to="/menu" variant="contained" sx={{ mt: 2 }}>
            Browse Menu
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {favorites.map((item) => (
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
                    ${item.price.toFixed(2)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Button size="small" variant="outlined" onClick={() => toggleFavorite(item)}>
                    Remove
                  </Button>
                  <Button size="small" variant="contained" onClick={() => addToCart(item)}>
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default FavoritesPage;
