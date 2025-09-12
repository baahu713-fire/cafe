import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Box,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    RadioGroup,
    FormControl,
    FormControlLabel
} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../hooks/useFavorites';

const ProportionSelectionDialog = ({ open, onClose, item, onAddToCart }) => {
    if (!item.proportions || item.proportions.length === 0) {
        return null;
    }

    const [selected, setSelected] = useState(item.proportions[0]);

    const handleChange = (e) => {
        const newProportion = item.proportions.find(p => p.name === e.target.value);
        if (newProportion) {
            setSelected(newProportion);
        }
    };

    const handleConfirm = () => {
        onAddToCart(selected);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Select a size for {item.name}</DialogTitle>
            <DialogContent>
                <FormControl component="fieldset" sx={{ mt: 1 }}>
                    <RadioGroup
                        name="proportion-radio-group"
                        value={selected.name}
                        onChange={handleChange}
                    >
                        {item.proportions.map((p) => (
                            <FormControlLabel
                                key={p.name}
                                value={p.name}
                                control={<Radio />}
                                label={`${p.name} - ₹${parseFloat(p.price).toFixed(2)}`}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleConfirm}>Add to Cart</Button>
            </DialogActions>
        </Dialog>
    );
};

const MenuItemCard = ({ item }) => {
    const { addToCart } = useCart();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleToggleFavorite = () => {
        if (isFavorite(item.id)) {
            removeFavorite(item.id);
        } else {
            addFavorite(item);
        }
    };
    
    const handleAddToCartClick = () => {
        const hasProportions = item.proportions && item.proportions.length > 0;

        if (hasProportions) {
            setIsDialogOpen(true);
        } else {
            const numericPrice = parseFloat(item.price);
            addToCart({ 
                ...item, 
                price: numericPrice,
                proportion: { name: 'Standard', price: numericPrice } 
            });
        }
    };

    const handleConfirmProportion = (proportion) => {
        const numericPrice = parseFloat(item.price);
        const numericProportionPrice = parseFloat(proportion.price);
        addToCart({ 
            ...item, 
            price: numericPrice,
            proportion: { ...proportion, price: numericProportionPrice }
        });
        setIsDialogOpen(false);
    };
    
    const isPurchasable = item.price != null && !isNaN(parseFloat(item.price));

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
            </CardContent>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {isPurchasable ? (
                     <Typography variant="h6" sx={{ mb: 2 }}>
                        ₹{parseFloat(item.price).toFixed(2)}
                     </Typography>
                ) : null}

                <Button 
                    variant="contained" 
                    onClick={handleAddToCartClick}
                    disabled={!isPurchasable}
                >
                    {isPurchasable ? 'Add to Cart' : 'Unavailable'}
                </Button>
            </Box>
            
            <ProportionSelectionDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                item={item}
                onAddToCart={handleConfirmProportion}
            />
        </Card>
    );
};

export default MenuItemCard;
