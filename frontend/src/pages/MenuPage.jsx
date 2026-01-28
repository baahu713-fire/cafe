import React, { useState } from 'react';
import useMenu from '../hooks/useMenu';
import useTimeSlots from '../hooks/useTimeSlots';
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Grid,
    TextField,
    Box,
    ToggleButtonGroup,
    ToggleButton,
    Paper,
    Chip,
} from '@mui/material';
import { Schedule, AccessTime } from '@mui/icons-material';
import MenuItemCard from '../components/MenuItemCard';
import UnsettledAmountNotification from '../components/UnsettledAmountNotification';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentDayName } from '../constants/dailySpecials';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages'];

const MenuPage = () => {
    const { user } = useAuth();
    const { menuItems, loading, error } = useMenu();
    const { isAvailable, getSlotInfo, formatCountdown, nextAvailableSlot, currentTimeIST } = useTimeSlots(30000);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Get actual today's name for ordering validation
    const actualToday = getCurrentDayName();

    const handleCategoryChange = (event, newCategory) => {
        if (newCategory !== null) {
            setCategoryFilter(newCategory);
        }
    };

    const filteredMenu = menuItems.filter(item => {
        const matchesSearchTerm = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'All' || (item.availability && item.availability.includes(categoryFilter));
        return matchesSearchTerm && matchesCategory;
    });

    /**
     * Get time slot info for an item based on its category
     */
    const getTimeSlotInfoForItem = (item) => {
        const category = item.category?.toLowerCase();
        if (!category) return null;

        // Map category to time slot
        if (['breakfast', 'lunch', 'snack', 'snacks'].includes(category)) {
            const slotKey = category === 'snacks' ? 'snack' : category;
            return getSlotInfo(slotKey);
        }
        return null;
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Our Menu
            </Typography>

            <UnsettledAmountNotification amount={user?.unsettled_amount} />

            {/* Ordering Time Slots Banner */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                        Ordering Times (IST: {currentTimeIST || '--:--'})
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                        icon={<AccessTime />}
                        label="Breakfast: 8:00 - 9:45 AM"
                        color={isAvailable('breakfast') ? 'success' : 'default'}
                        variant={isAvailable('breakfast') ? 'filled' : 'outlined'}
                        size="small"
                    />
                    <Chip
                        icon={<AccessTime />}
                        label="Lunch: 11:00 AM - 12:30 PM"
                        color={isAvailable('lunch') ? 'success' : 'default'}
                        variant={isAvailable('lunch') ? 'filled' : 'outlined'}
                        size="small"
                    />
                    <Chip
                        icon={<AccessTime />}
                        label="Snack: 3:00 - 3:45 PM"
                        color={isAvailable('snack') ? 'success' : 'default'}
                        variant={isAvailable('snack') ? 'filled' : 'outlined'}
                        size="small"
                    />
                </Box>
                {nextAvailableSlot && !isAvailable('breakfast') && !isAvailable('lunch') && !isAvailable('snack') && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Next window: {nextAvailableSlot.category} ({nextAvailableSlot.displayStart})
                        {nextAvailableSlot.isTomorrow ? ' tomorrow' : ''} - in {formatCountdown(nextAvailableSlot.minutesUntil)}
                    </Typography>
                )}
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <TextField
                    label="Search Menu"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: '100%', maxWidth: '500px' }}
                />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <ToggleButtonGroup
                    value={categoryFilter}
                    exclusive
                    onChange={handleCategoryChange}
                    aria-label="menu categories"
                    sx={{
                        backgroundColor: '#fdecec',
                        borderRadius: '20px',
                        padding: '5px',
                    }}
                >
                    {CATEGORIES.map(category => (
                        <ToggleButton
                            key={category}
                            value={category}
                            sx={{
                                border: 'none',
                                borderRadius: '15px !important',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                color: '#8d6e63',
                                '&.Mui-selected': {
                                    backgroundColor: '#fff',
                                    color: '#d32f2f',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                },
                                '&:hover': {
                                    backgroundColor: '#fce4e4',
                                },
                                '&.Mui-selected:hover': {
                                    backgroundColor: '#fff',
                                }
                            }}
                        >
                            {category}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            <Grid container spacing={4}>
                {filteredMenu.map(item => (
                    <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <MenuItemCard item={item} timeSlotInfo={getTimeSlotInfoForItem(item)} currentDay={actualToday} />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

export default MenuPage;

