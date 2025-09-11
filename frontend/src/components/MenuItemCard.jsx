import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton
} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../hooks/useFavorites';

const MenuItemCard = ({ item }) => {
    const { addToCart } = useCart();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const [selectedProportion, setSelectedProportion] = useState(item.proportions[0]);

    const handleAddToCart = () => {
        addToCart({ ...item, proportion: selectedProportion });
    };

    const handleProportionChange = (e) => {
        const newProportionName = e.target.value;
        const newProportion = item.proportions.find(p => p.name === newProportionName);
        setSelectedProportion(newProportion);
    };

    const handleToggleFavorite = () => {
        if (isFavorite(item.id)) {
            removeFavorite(item.id);
        } else {
            addFavorite(item);
        }
    };

    return (
        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="140"
                    image={item.image || 'https://via.placeholder.com/150'}
                    alt={item.name}
                />
                <IconButton 
                    onClick={handleToggleFavorite} 
                    sx={{ position: 'absolute', top: 8, right: 8, color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    {isFavorite(item.id) ? <Favorite color="error" /> : <FavoriteBorder />}
                </IconButton>
            </Box>
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                    {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {item.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Availability: {item.availability.join(', ')}
                </Typography>
            </CardContent>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {item.proportions.length > 1 ? (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Proportion</InputLabel>
                        <Select value={selectedProportion.name} onChange={handleProportionChange} label="Proportion">
                            {item.proportions.map(p => (
                                <MenuItem key={p.name} value={p.name}>
                                    {p.name} - ₹{p.price.toFixed(2)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        ₹{selectedProportion.price.toFixed(2)}
                    </Typography>
                )}
                <Button variant="contained" onClick={handleAddToCart}>Add to Cart</Button>
            </Box>
        </Card>
    );
};

export default MenuItemCard;
