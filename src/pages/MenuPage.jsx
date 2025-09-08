import React, { useState, useMemo } from 'react';
import useMenu from '../hooks/useMenu';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../hooks/useCart.jsx';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { AVAILABILITY_OPTIONS } from '../constants/categories';

const MenuPage = () => {
  const { menuItems, loading, error } = useMenu();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [proportionDialogOpen, setProportionDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedProportion, setSelectedProportion] = useState(null);
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  const handleCategoryChange = (event, newCategory) => {
    if (newCategory !== null) {
      setSelectedCategory(newCategory);
    }
  };

  const handleOpenProportionDialog = (item) => {
    setSelectedItem(item);
    if (item.proportions && item.proportions.length > 0) {
      setSelectedProportion(item.proportions[0].name);
    }
    setProportionDialogOpen(true);
  };

  const handleCloseProportionDialog = () => {
    setProportionDialogOpen(false);
    setSelectedItem(null);
    setSelectedProportion(null);
  };

  const handleAddToCart = (item, proportionName = null) => {
    let itemToAdd = { ...item };
    if (proportionName) {
      const proportion = item.proportions.find((p) => p.name === proportionName);
      if (proportion) {
        itemToAdd = {
          ...itemToAdd,
          price: proportion.price,
          name: `${item.name} (${proportion.name})`,
          id: `${item.id}-${proportion.name}`,
        };
      }
    } else if (item.proportions && item.proportions.length === 1) {
      const proportion = item.proportions[0];
      itemToAdd = {
        ...itemToAdd,
        price: proportion.price,
        id: `${item.id}-${proportion.name}`,
      };
    }
    addToCart(itemToAdd);
    handleCloseProportionDialog();
  };

  const handleDialogAddToCart = () => {
    if (selectedItem && selectedProportion) {
      handleAddToCart(selectedItem, selectedProportion);
    }
  };

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    const lowercasedCategory = selectedCategory.toLowerCase();

    // Filter by search term first
    const searchedItems = menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If 'all' is selected, no more filtering is needed
    if (lowercasedCategory === 'all') {
      return searchedItems;
    }

    // Filter by the selected category
    return searchedItems.filter((item) => {
      let availability = [];
      if (Array.isArray(item.availability)) {
        availability = item.availability;
      } else if (typeof item.availability === 'string' && item.availability) {
        availability = [item.availability];
      }
      return availability.some((cat) => cat.toLowerCase() === lowercasedCategory);
    });
  }, [menuItems, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
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
          {AVAILABILITY_OPTIONS.map((category) => (
            <ToggleButton key={category} value={category.toLowerCase()} aria-label={category} sx={{ textTransform: 'capitalize' }}>
              {category}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={4}>
        {filteredMenuItems.map((item) => {
          const isFavorited = favorites.some((fav) => fav.id === item.id);
          const displayPrice = item.proportions && item.proportions.length > 0 ? item.proportions[0].price : item.price;

          return (
            <Grid item key={item.id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: 3 }}>
                <CardMedia component="img" height="240" image={item.image} alt={item.name} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: '4.5em' }}>
                    {item.description}
                  </Typography>
                  <Typography variant="h6" color="text.primary" sx={{ mt: 1 }}>
                    ₹{displayPrice.toFixed(2)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <IconButton onClick={() => toggleFavorite(item)} color="error">
                    {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() =>
                      item.proportions && item.proportions.length > 1
                        ? handleOpenProportionDialog(item)
                        : handleAddToCart(item, item.proportions?.[0]?.name)
                    }
                  >
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={proportionDialogOpen} onClose={handleCloseProportionDialog}>
        <DialogTitle>Select a Proportion</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset">
            <RadioGroup
              aria-label="proportion"
              name="proportion"
              value={selectedProportion}
              onChange={(e) => setSelectedProportion(e.target.value)}
            >
              {selectedItem?.proportions?.map((p) => (
                <FormControlLabel key={p.name} value={p.name} control={<Radio />} label={`${p.name} - ₹${p.price.toFixed(2)}`} />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProportionDialog}>Cancel</Button>
          <Button onClick={handleDialogAddToCart} variant="contained">
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MenuPage;
