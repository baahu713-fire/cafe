import React from 'react';
import {
    Container,
    Typography,
    Grid,
    Box,
    Button
} from '@mui/material';
import { useFavorites } from '../hooks/useFavorites';
import MenuItemCard from '../components/MenuItemCard';

const FavoritesPage = () => {
    const { favorites, removeFavorite } = useFavorites();

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom align="center">Your Favorites</Typography>
            {favorites.length === 0 ? (
                <Typography align="center">You have no favorite items yet.</Typography>
            ) : (
                <Grid container spacing={4}>
                    {favorites.map(item => (
                        <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Box sx={{ position: 'relative' }}>
                                <MenuItemCard item={item} />
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => removeFavorite(item.id)}
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                >
                                    Remove
                                </Button>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default FavoritesPage;
