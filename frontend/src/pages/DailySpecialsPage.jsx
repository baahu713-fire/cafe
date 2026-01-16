import React, { useState, useEffect } from 'react';
import { getDailySpecials } from '../services/menuService';
import { Container, Typography, Grid, CircularProgress, Alert, Tabs, Tab, Box } from '@mui/material';
import MenuItemCard from '../components/MenuItemCard';

const DailySpecialsPage = () => {
    const [weeklyMenu, setWeeklyMenu] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Determine current day index (0=Sunday, 1=Monday... 6=Saturday)
    // We want Tabs 0-5 to correspond to Monday-Saturday
    const todayIndex = new Date().getDay();
    // If Sunday (0), default to Monday (0). If (1-6), subtract 1 to get 0-5 index.
    const initialTab = todayIndex === 0 ? 0 : todayIndex - 1;

    const [activeTab, setActiveTab] = useState(initialTab);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    const currentDayName = days[activeTab];
    const currentMenu = weeklyMenu[currentDayName] || { breakfast: [], lunch: [], snacks: [] };

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                Daily Specials
            </Typography>

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
                            {days.map((day, index) => (
                                <Tab key={day} label={day} />
                            ))}
                        </Tabs>
                    </Box>

                    <Box role="tabpanel">
                        {/* Breakfast Section */}
                        <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                            {currentDayName}'s Breakfast Special
                        </Typography>
                        {currentMenu.breakfast?.length > 0 ? (
                            <Grid container spacing={4}>
                                {currentMenu.breakfast.map((item) => (
                                    <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <MenuItemCard item={item} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="info" sx={{ mt: 2, mb: 4 }}>No breakfast specials for {currentDayName}.</Alert>
                        )}


                        {/* Lunch Section */}
                        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 5, color: '#1976d2', fontWeight: 'bold' }}>
                            {currentDayName}'s Lunch Special
                        </Typography>
                        {currentMenu.lunch?.length > 0 ? (
                            <Grid container spacing={4}>
                                {currentMenu.lunch.map((item) => (
                                    <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <MenuItemCard item={item} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="info" sx={{ mt: 2, mb: 4 }}>No lunch specials for {currentDayName}.</Alert>
                        )}

                        {/* Snacks Section */}
                        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 5, color: '#388e3c', fontWeight: 'bold' }}>
                            {currentDayName}'s Snack Special
                        </Typography>
                        {currentMenu.snack?.length > 0 ? (
                            <Grid container spacing={4}>
                                {currentMenu.snack.map((item) => (
                                    <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <MenuItemCard item={item} />
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
