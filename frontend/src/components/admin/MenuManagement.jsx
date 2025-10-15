import React, { useState, useMemo, useEffect } from 'react';
import useMenu from '../../hooks/useMenu';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Typography,
  DialogContentText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ItemForm from './ItemForm';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

const MenuManagement = () => { // Remove user prop
    const { user } = useAuth(); // Get user from AuthContext
    const {
        menuItems,
        loading,
        error,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        fetchMenu
    } = useMenu();

    const [formOpen, setFormOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user && user.isAdmin) {
            fetchMenu();
        }
    }, [fetchMenu, user]);


    const handleFormOpen = (item = null) => {
        setFormError('');
        if (item) {
            // Preserve the original image data when editing
            const proportions = item.proportions && item.proportions.length > 0 ? item.proportions : [];
            let availability = [];
            if (Array.isArray(item.availability)) {
                availability = item.availability;
            } else if (typeof item.availability === 'string' && item.availability) {
                availability = item.availability.split(',').map(s => s.trim());
            }

            setCurrentItem({ ...item, proportions, availability, image: null }); // Set image to null initially
        } else {
            setCurrentItem({ name: '', price: '', image: null, image_data: null, description: '', availability: [], proportions: [], available: true });
        }
        setFormOpen(true);
    };

    const handleFormClose = () => {
        if (isSaving) return; // Prevent closing while saving
        setFormOpen(false);
        setCurrentItem(null);
        setFormError('');
    };

    const handleSave = async () => {
        if (!currentItem || !currentItem.name || !currentItem.price) {
            setFormError('Item name and price are required.');
            return;
        }

        if (isNaN(parseFloat(currentItem.price)) || parseFloat(currentItem.price) < 0) {
            setFormError('Price must be a valid, non-negative number.');
            return;
        }

        const hasInvalidProportion = currentItem.proportions.some(p => !p.name || p.price === '' || isNaN(parseFloat(p.price)) || parseFloat(p.price) < 0);
        if (currentItem.proportions && hasInvalidProportion) {
            setFormError('All proportions must have a name and a valid, non-negative price.');
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', currentItem.name);
            formData.append('price', parseFloat(currentItem.price));
            formData.append('description', currentItem.description);
            formData.append('available', currentItem.available);
            
            if (currentItem.image) {
                formData.append('image', currentItem.image);
            }

            (currentItem.availability || []).forEach(a => formData.append('availability[]', a));
            if (currentItem.proportions && currentItem.proportions.length > 0) {
                formData.append('proportions', JSON.stringify(currentItem.proportions));
            }


            if (currentItem.id) {
                await updateMenuItem(currentItem.id, formData);
            } else {
                await addMenuItem(formData);
            }
            handleFormClose();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (itemId) => {
        setItemToDelete(itemId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (itemToDelete) {
            try {
                await deleteMenuItem(itemToDelete);
            } catch (err) {
                setFormError(err.message);
            }
        }
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
    };



    const filteredMenu = useMemo(() => {
        if (!menuItems) return [];
        return menuItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [menuItems, searchTerm]);
    
    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Menu Management</Typography>
                <Button variant="contained" onClick={() => handleFormOpen()}>Add New Item</Button>
            </Box>
            <TextField 
                label="Search by Name or Description"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
            />
            <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                <Table>
                    <TableHead><TableRow><TableCell>Image</TableCell><TableCell>Name</TableCell><TableCell>Price</TableCell><TableCell>Categories</TableCell><TableCell>Description</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                    <TableBody>
                        {filteredMenu.map(item => (
                            <TableRow key={item.id}> 
                                <TableCell><img src={item.image_data} alt={item.name} height="50" /></TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>₹{item.price}</TableCell>
                                <TableCell>{Array.isArray(item.availability) ? item.availability.join(', ') : (item.availability || 'N/A')}</TableCell>
                                <TableCell>{item.description || 'N/A'}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleFormOpen(item)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDeleteClick(item.id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {formOpen && (
                <ItemForm 
                    open={formOpen} 
                    handleClose={handleFormClose} 
                    currentItem={currentItem} 
                    setCurrentItem={setCurrentItem} 
                    handleSave={handleSave} 
                    formError={formError}
                    isSaving={isSaving} 
                />
            )}
            <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to delete this menu item? This action cannot be undone.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default MenuManagement;
