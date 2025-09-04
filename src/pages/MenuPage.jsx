import React, { useState, useEffect } from 'react';
import { getMenu } from '../services/menuService';
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
  IconButton,
  CircularProgress,
  Box,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const items = await getMenu();
        setMenuItems(items);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
      }
      setLoading(false);
    };

    fetchMenu();
  }, []);

  const handleCategoryChange = (event, newCategory) => {
    if (newCategory !== null) {
      setSelectedCategory(newCategory);
    }
  };

  const filteredMenuItems = menuItems
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(item => 
      selectedCategory === 'all' || item.availability.includes(selectedCategory)
    );

    const categories = ['all', ...new Set(menuItems.flatMap(item => item.availability).filter(cat => cat !== 'all'))];


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 4 }}>
        Our Menu
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, gap: 2 }}>
        <TextField
          label="Search Menu"
          variant="outlined"
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '100%', maxWidth: 400 }}
        />
        <ToggleButtonGroup
          value={selectedCategory}
          exclusive
          onChange={handleCategoryChange}
          aria-label="menu categories"
          sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {categories.map(category => (
            <ToggleButton key={category} value={category} aria-label={category} sx={{ textTransform: 'capitalize' }}>
              {category}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={4}>
        {filteredMenuItems.map((item) => {
          const isFavorited = favorites.some(fav => fav.id === item.id);
          return (
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
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: '4.5em' }}>
                    {item.description}
                  </Typography>
                  <Typography variant="h6" color="text.primary" sx={{ mt: 1 }}>
                    ${item.price.toFixed(2)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <IconButton onClick={() => toggleFavorite(item)} color="error">
                    {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                  <Button size="small" variant="contained" onClick={() => addToCart(item)}>
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default MenuPage;
