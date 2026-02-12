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
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip
} from '@mui/material';
import { Add, Remove, Favorite, FavoriteBorder, Schedule } from '@mui/icons-material';
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
                <Button onClick={handleConfirm} variant="contained">Add to Cart</Button>
            </DialogActions>
        </Dialog>
    );
};

const ManageCartItemDialog = ({ open, onClose, item, cartItems, updateQuantity, onAddNew }) => {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Manage {item.name}</DialogTitle>
            <DialogContent>
                <List>
                    {cartItems.map((cartItem) => {
                        const proportionName = cartItem.proportion?.name || 'Standard';
                        const price = cartItem.proportion?.price || item.price;
                        return (
                            <ListItem key={proportionName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                                <ListItemText
                                    primary={proportionName}
                                    secondary={`₹${parseFloat(price).toFixed(2)}`}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <IconButton onClick={() => updateQuantity(item.id, cartItem.quantity - 1, proportionName)} size="small" color="primary">
                                        <Remove fontSize="small" />
                                    </IconButton>
                                    <Typography sx={{ mx: 2, fontWeight: 'bold' }}>{cartItem.quantity}</Typography>
                                    <IconButton onClick={() => updateQuantity(item.id, cartItem.quantity + 1, proportionName)} size="small" color="primary">
                                        <Add fontSize="small" />
                                    </IconButton>
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>
                <Divider sx={{ my: 2 }} />
                <Button
                    startIcon={<Add />}
                    fullWidth
                    variant="outlined"
                    onClick={onAddNew}
                >
                    Add Another Size
                </Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Done</Button>
            </DialogActions>
        </Dialog>
    );
};

const MenuItemCard = ({ item, timeSlotInfo, currentDay }) => {
    const { cart, addToCart, updateQuantity } = useCart();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

    // Check time slot availability for this item's category
    const category = item.category?.toLowerCase();
    const hasTimeRestriction = category && ['breakfast', 'lunch', 'snack', 'snacks'].includes(category);
    const isWithinTimeSlot = timeSlotInfo?.isActive ?? true;

    // Check day-of-week restriction (if item has day_of_week assigned)
    const itemDayOfWeek = item.day_of_week;
    const isCorrectDay = !itemDayOfWeek || itemDayOfWeek === currentDay;

    // Correctly use the `available` boolean field.
    const isAvailable = item.available;
    const isPurchasable = isAvailable && item.price != null && !isNaN(parseFloat(item.price)) && (!hasTimeRestriction || isWithinTimeSlot) && isCorrectDay;

    // Get all cart entries for this item
    const cartItems = cart.filter(i => i.id === item.id);
    const totalQuantity = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

    const handleToggleFavorite = () => {
        if (isFavorite(item.id)) {
            removeFavorite(item.id);
        } else {
            addFavorite(item);
        }
    };

    // Initial add click
    const handleAddClick = () => {
        if (!isPurchasable) return;

        const hasProportions = item.proportions && item.proportions.length > 0;

        if (hasProportions) {
            setIsSelectionDialogOpen(true);
        } else {
            const numericPrice = parseFloat(item.price);
            addToCart({
                ...item,
                price: numericPrice,
                proportion: { name: 'Standard', price: numericPrice }
            });
        }
    };

    // Confirm adding a specific proportion
    const handleConfirmProportion = (proportion) => {
        const numericPrice = parseFloat(item.price);
        const numericProportionPrice = parseFloat(proportion.price);
        addToCart({
            ...item,
            price: numericPrice,
            proportion: { ...proportion, price: numericProportionPrice }
        });
        setIsSelectionDialogOpen(false);
        // checking if manage dialog is open, if so keep it open to show new state
        // logic simplified: close selection, user sees updated badge
    };

    const handleIncrement = () => {
        if (item.proportions && item.proportions.length > 0) {
            setIsManageDialogOpen(true);
        } else {
            // Standard item - just increment the first (and only) entry
            const currentQty = cartItems[0]?.quantity || 0;
            updateQuantity(item.id, currentQty + 1, 'Standard');
        }
    };

    const handleDecrement = () => {
        if (item.proportions && item.proportions.length > 0) {
            setIsManageDialogOpen(true);
        } else {
            // Standard item
            const currentQty = cartItems[0]?.quantity || 0;
            updateQuantity(item.id, currentQty - 1, 'Standard');
        }
    };

    return (
        <Card sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: !isAvailable ? '#f5f5f5' : '#fff',
            opacity: !isAvailable ? 0.6 : 1,
            transition: 'opacity 0.3s ease-in-out',
            width: '100%',
            position: 'relative' // For badge positioning if needed
        }}>
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="140"
                    image={item.image || '/storage/placeholder/food-placeholder.png'}
                    alt={item.name}
                    loading="lazy"
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
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {item.description}
                </Typography>
            </CardContent>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {/* Time slot restriction chip */}
                {hasTimeRestriction && !isWithinTimeSlot && timeSlotInfo && (
                    <Chip
                        icon={<Schedule />}
                        label={`Available: ${timeSlotInfo.displayStart} - ${timeSlotInfo.displayEnd}`}
                        size="small"
                        color="warning"
                        sx={{ mb: 1, fontSize: '0.75rem' }}
                    />
                )}

                {isPurchasable ? (
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        ₹{parseFloat(item.price).toFixed(2)}
                    </Typography>
                ) : hasTimeRestriction && !isWithinTimeSlot ? (
                    <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontStyle: 'italic' }}>
                        ₹{parseFloat(item.price).toFixed(2)}
                    </Typography>
                ) : (
                    <Typography variant="h6" sx={{ mb: 2, color: '#757575', fontStyle: 'italic' }}>
                        Unavailable
                    </Typography>
                )}

                {totalQuantity > 0 ? (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: '20px',
                        p: 0.5
                    }}>
                        <IconButton
                            onClick={handleDecrement}
                            size="small"
                            color="primary"
                            sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#eeeeee' } }}
                        >
                            <Remove fontSize="small" />
                        </IconButton>

                        <Typography variant="h6" sx={{ mx: 2, minWidth: '20px', textAlign: 'center' }}>
                            {totalQuantity}
                        </Typography>

                        <IconButton
                            onClick={handleIncrement}
                            size="small"
                            color="primary"
                            sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#eeeeee' } }}
                        >
                            <Add fontSize="small" />
                        </IconButton>
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleAddClick}
                        disabled={!isPurchasable}
                        fullWidth
                        sx={{
                            backgroundColor: !isPurchasable ? '#bdbdbd' : 'primary.main',
                            '&:hover': {
                                backgroundColor: !isPurchasable ? '#bdbdbd' : 'primary.dark',
                            },
                            borderRadius: '20px'
                        }}
                    >
                        {isPurchasable ? 'Add to Cart' : 'Unavailable'}
                    </Button>
                )}
            </Box>

            <ProportionSelectionDialog
                open={isSelectionDialogOpen}
                onClose={() => setIsSelectionDialogOpen(false)}
                item={item}
                onAddToCart={handleConfirmProportion}
            />

            <ManageCartItemDialog
                open={isManageDialogOpen}
                onClose={() => setIsManageDialogOpen(false)}
                item={item}
                cartItems={cartItems}
                updateQuantity={updateQuantity}
                onAddNew={() => setIsSelectionDialogOpen(true)}
            />
        </Card>
    );
};

export default MenuItemCard;
