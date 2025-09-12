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
  DialogContentText,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { AVAILABILITY_OPTIONS } from '../../constants/categories';

const MenuManagement = ({ user }) => {
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

    useEffect(() => {
        if (user && user.isAdmin) {
            fetchMenu();
        }
    }, [fetchMenu, user]);


    const handleFormOpen = (item = null) => {
        setFormError('');
        if (item) {
            const itemToEdit = JSON.parse(JSON.stringify(item));
            const initialProportions = itemToEdit.proportions && itemToEdit.proportions.length > 0 
                ? itemToEdit.proportions 
                : [{ name: 'Full', price: itemToEdit.price || '' }];

            let initialAvailability = [];
            if (Array.isArray(itemToEdit.availability)) {
                initialAvailability = itemToEdit.availability;
            } else if (typeof itemToEdit.availability === 'string' && itemToEdit.availability) {
                initialAvailability = itemToEdit.availability.split(',').map(s => s.trim());
            }

            setCurrentItem({ ...itemToEdit, proportions: initialProportions, availability: initialAvailability });
        } else {
            setCurrentItem({ name: '', price: '', image: '', description: '', availability: [], proportions: [{ name: 'Full', price: '' }] });
        }
        setFormOpen(true);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setCurrentItem(null);
        setFormError('');
    };

    const handleSave = async () => {
        if (!currentItem || !currentItem.name) {
            setFormError('Item name is required.');
            return;
        }
        
        const hasInvalidProportion = currentItem.proportions.some(p => !p.name || p.price === '' || isNaN(parseFloat(p.price)));
        if (!currentItem.proportions || hasInvalidProportion) {
            setFormError('All proportions must have a name and a valid price.');
            return;
        }

        try {
            const proportionsWithNumericPrices = currentItem.proportions.map(p => ({ 
                ...p, 
                price: parseFloat(p.price) 
            }));

            const itemToSave = {
                ...currentItem,
                price: proportionsWithNumericPrices[0]?.price || 0,
                proportions: proportionsWithNumericPrices
            };

            if (itemToSave.id) {
                await updateMenuItem(itemToSave.id, itemToSave);
            } else {
                await addMenuItem(itemToSave);
            }
            handleFormClose();
        } catch (err) {
            setFormError(err.message);
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

    const handleChange = (e) => {
        setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
    };
    
    const handleAvailabilityChange = (e) => {
        const { name, checked } = e.target;
        setCurrentItem(prev => {
            const currentAvailability = prev.availability || [];
            const newAvailability = checked 
                ? [...currentAvailability, name]
                : currentAvailability.filter(item => item !== name);
            return { ...prev, availability: newAvailability };
        });
    };

    const handleProportionChange = (index, field, value) => {
        const newProportions = currentItem.proportions.map((p, i) => i === index ? { ...p, [field]: value } : p);
        setCurrentItem({ ...currentItem, proportions: newProportions });
    };

    const addProportion = () => {
        const newProportions = [...currentItem.proportions, { name: '', price: '' }];
        setCurrentItem({ ...currentItem, proportions: newProportions });
    };

    const removeProportion = (index) => {
        if (currentItem.proportions.length > 1) {
            const newProportions = currentItem.proportions.filter((_, i) => i !== index);
            setCurrentItem({ ...currentItem, proportions: newProportions });
        }
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
                    <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Availability</TableCell><TableCell>Description</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                    <TableBody>
                        {filteredMenu.map(item => (
                            <TableRow key={item.id}> 
                                <TableCell>{item.name}</TableCell>
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
            <Dialog open={formOpen} onClose={handleFormClose} fullWidth maxWidth="sm">
                <DialogTitle>{currentItem?.id ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
                <DialogContent>
                    {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                    <TextField autoFocus margin="dense" name="name" label="Name" type="text" fullWidth variant="outlined" value={currentItem?.name || ''} onChange={handleChange} required/>
                    <TextField margin="dense" name="image" label="Image URL" type="text" fullWidth variant="outlined" value={currentItem?.image || ''} onChange={handleChange} />
                    <TextField margin="dense" name="description" label="Description" type="text" fullWidth multiline rows={4} variant="outlined" value={currentItem?.description || ''} onChange={handleChange} />
                    <FormControl component="fieldset" fullWidth margin="dense">
                        <FormLabel component="legend">Availability</FormLabel>
                        <FormGroup row>
                            {AVAILABILITY_OPTIONS.map(option => (
                                <FormControlLabel
                                    key={option}
                                    control={<Checkbox checked={currentItem?.availability?.includes(option) ?? false} onChange={handleAvailabilityChange} name={option} />}
                                    label={option}
                                />
                            ))}
                        </FormGroup>
                    </FormControl>
                    <Typography sx={{ mt: 2, mb: 1 }}>Proportions</Typography>
                    {currentItem?.proportions?.map((proportion, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                            <TextField label="Proportion Name" value={proportion.name} onChange={(e) => handleProportionChange(index, 'name', e.target.value)} required />
                            <TextField label="Price" type="number" value={proportion.price} onChange={(e) => handleProportionChange(index, 'price', e.target.value)} required />
                            <IconButton onClick={() => removeProportion(index)} disabled={currentItem.proportions.length <= 1}><DeleteIcon /></IconButton>
                        </Box>
                    ))}
                    <Button startIcon={<AddIcon />} onClick={addProportion}>Add Proportion</Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFormClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
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
