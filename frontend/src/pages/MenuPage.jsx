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
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { CATEGORIES, AVAILABILITY_OPTIONS } from '../constants/categories';
import MenuItemCard from '../components/MenuItemCard'; // Import the new component

const MenuPage = () => {
    const { menuItems, loading, error } = useMenu();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [availabilityFilter, setAvailabilityFilter] = useState('All');

    const filteredMenu = menuItems.filter(item => {
        const matchesSearchTerm = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'All' || (item.category && item.category === categoryFilter);
        const matchesAvailability = availabilityFilter === 'All' || (item.availability && item.availability.includes(availabilityFilter));
        return matchesSearchTerm && matchesCategory && matchesAvailability;
    });

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Our Menu
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                <TextField
                    label="Search Menu"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: '280px' }}
                />
                <FormControl variant="outlined" sx={{ minWidth: '180px' }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        label="Category"
                    >
                        <MenuItem value="All">All Categories</MenuItem>
                        {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl variant="outlined" sx={{ minWidth: '180px' }}>
                    <InputLabel>Availability</InputLabel>
                    <Select
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                        label="Availability"
                    >
                        <MenuItem value="All">All</MenuItem>
                        {AVAILABILITY_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </Select>
                </FormControl>
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
