import React, { useState } from 'react';
import useMenu from '../hooks/useMenu';
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
} from '@mui/material';
import MenuItemCard from '../components/MenuItemCard';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages'];

const MenuPage = () => {
    const { menuItems, loading, error } = useMenu();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const handleCategoryChange = (event, newCategory) => {
        if (newCategory !== null) {
            setCategoryFilter(newCategory);
        }
    };

    const filteredMenu = menuItems.filter(item => {
        const matchesSearchTerm = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'All' || (item.category && item.category === categoryFilter);
        return matchesSearchTerm && matchesCategory;
    });

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Our Menu
            </Typography>

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
                    <Grid item key={item.id} xs={12} sm={6} md={4}>
                        <MenuItemCard item={item} />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

export default MenuPage;
