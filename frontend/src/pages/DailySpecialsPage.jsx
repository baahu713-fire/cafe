import React, { useState, useEffect } from 'react';
import { getDailySpecials } from '../services/menuService';
import { Container, Typography, Grid, CircularProgress, Alert, Tabs, Tab, Box, Paper, Chip } from '@mui/material';
import { Schedule, AccessTime } from '@mui/icons-material';
import MenuItemCard from '../components/MenuItemCard';
import useTimeSlots from '../hooks/useTimeSlots';
import { DAYS_OF_WEEK, WORKING_DAYS, getCurrentDayName } from '../constants/dailySpecials';

const DailySpecialsPage = () => {
    const [weeklyMenu, setWeeklyMenu] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { timeSlots, isAvailable, getSlotInfo, formatCountdown, nextAvailableSlot, currentTimeIST } = useTimeSlots(30000);

    // Get actual today's name for ordering validation
    const todayIndex = new Date().getDay();
    const actualToday = getCurrentDayName();

    // Default tab to today if it's a working day, else Monday
    const initialTab = todayIndex === 0 ? 0 : todayIndex - 1;

    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const fetchDailyItems = async () => {
            try {
                setLoading(true);
                // Fetch full week
                const specials = await getDailySpecials('weekly');
                setWeeklyMenu(specials);
            } catch (err) {
                setError('Failed to load daily specials. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDailyItems();
    }, []);

    const handleChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const currentDayName = WORKING_DAYS[activeTab];
    const currentMenu = weeklyMenu[currentDayName] || { breakfast: [], lunch: [], snacks: [] };

    // Time slot status for display
    const breakfastSlot = getSlotInfo('breakfast');
    const lunchSlot = getSlotInfo('lunch');
    const snackSlot = getSlotInfo('snack');

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                Daily Specials
            </Typography>

            {/* Ordering Time Slots Banner */}
            <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                        Ordering Times (IST: {currentTimeIST || '--:--'})
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                        icon={<AccessTime />}
                        label={`Breakfast: 8:00 - 9:45 AM`}
                        color={isAvailable('breakfast') ? 'success' : 'default'}
                        variant={isAvailable('breakfast') ? 'filled' : 'outlined'}
                    />
                    <Chip
                        icon={<AccessTime />}
                        label={`Lunch: 11:00 AM - 12:30 PM`}
                        color={isAvailable('lunch') ? 'success' : 'default'}
                        variant={isAvailable('lunch') ? 'filled' : 'outlined'}
                    />
                    <Chip
                        icon={<AccessTime />}
                        label={`Snack: 3:00 - 3:45 PM`}
                        color={isAvailable('snack') ? 'success' : 'default'}
                        variant={isAvailable('snack') ? 'filled' : 'outlined'}
                    />
                </Box>
                {nextAvailableSlot && !isAvailable('breakfast') && !isAvailable('lunch') && !isAvailable('snack') && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Next ordering window: {nextAvailableSlot.category} ({nextAvailableSlot.displayStart})
                        {nextAvailableSlot.isTomorrow ? ' tomorrow' : ''} - starts in {formatCountdown(nextAvailableSlot.minutesUntil)}
                    </Typography>
                )}
            </Paper>

            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="daily specials tabs"
                        >
                            {WORKING_DAYS.map((day, index) => (
                                <Tab key={day} label={day} />
                            ))}
                        </Tabs>
                    </Box>

                    <Box role="tabpanel">
                        {/* Breakfast Section */}
                        <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                            {currentDayName}'s Breakfast Special
                            {breakfastSlot?.isActive && <Chip label="NOW OPEN" size="small" color="success" sx={{ ml: 1 }} />}
                        </Typography>
                        {currentMenu.breakfast?.length > 0 ? (
                            <Grid container spacing={4}>
                                {currentMenu.breakfast.map((item) => (
                                    <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <MenuItemCard item={item} timeSlotInfo={breakfastSlot} currentDay={actualToday} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="info" sx={{ mt: 2, mb: 4 }}>No breakfast specials for {currentDayName}.</Alert>
                        )}


                        {/* Lunch Section */}
                        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 5, color: '#1976d2', fontWeight: 'bold' }}>
                            {currentDayName}'s Lunch Special
                            {lunchSlot?.isActive && <Chip label="NOW OPEN" size="small" color="success" sx={{ ml: 1 }} />}
                        </Typography>
                        {currentMenu.lunch?.length > 0 ? (
                            <Grid container spacing={4}>
                                {currentMenu.lunch.map((item) => (
                                    <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <MenuItemCard item={item} timeSlotInfo={lunchSlot} currentDay={actualToday} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="info" sx={{ mt: 2, mb: 4 }}>No lunch specials for {currentDayName}.</Alert>
                        )}

                        {/* Snacks Section */}
                        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 5, color: '#388e3c', fontWeight: 'bold' }}>
                            {currentDayName}'s Snack Special
                            {snackSlot?.isActive && <Chip label="NOW OPEN" size="small" color="success" sx={{ ml: 1 }} />}
                        </Typography>
                        {currentMenu.snack?.length > 0 ? (
                            <Grid container spacing={4}>
                                {currentMenu.snack.map((item) => (
                                    <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <MenuItemCard item={item} timeSlotInfo={snackSlot} currentDay={actualToday} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="info" sx={{ mt: 2 }}>No special snacks for {currentDayName}.</Alert>
                        )}
                    </Box>
                </>
            )}
        </Container>
    );
};

export default DailySpecialsPage;

