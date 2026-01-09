import React, { useState, useEffect } from 'react';
import { getMenuItemsByCategory } from '../services/menuService';
import { Container, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import MenuItemCard from '../components/MenuItemCard';

const DailySpecialsPage = () => {
    const [dailyMenu, setDailyMenu] = useState([]);
    const [dailySnacks, setDailySnacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDailyItems = async () => {
            try {
                setLoading(true);
                const [menu, snacks] = await Promise.all([
                    getMenuItemsByCategory('daily-special'),
                    getMenuItemsByCategory('daily-snack')
                ]);
                setDailyMenu(menu);
                setDailySnacks(snacks);
            } catch (err) {
                setError('Failed to load daily specials. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDailyItems();
    }, []);

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
                    <Typography variant="h5" component="h2" gutterBottom>
                        Daily Menu
                    </Typography>
                    <Grid container spacing={4}>
                        {dailyMenu.map((item) => (
                            <Grid item key={item.id} xs={12} sm={6} md={4}>
                                <MenuItemCard item={item} />
                            </Grid>
                        ))}
                    </Grid>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                        Daily Snacks
                    </Typography>
                    <Grid container spacing={4}>
                        {dailySnacks.map((item) => (
                            <Grid item key={item.id} xs={12} sm={6} md={4}>
                                <MenuItemCard item={item} />
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}
        </Container>
    );
};

export default DailySpecialsPage;
