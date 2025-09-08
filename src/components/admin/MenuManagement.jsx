import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../../services/menuService';
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

const MenuManagement = ({ user }) => {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMenu = useCallback(async () => {
        try {
            setLoading(true);
            const menuData = await getMenu();
            setMenu(menuData);
        } catch (err) {
            setError('Failed to load menu.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if(user && user.isAdmin) fetchMenu();
    }, [fetchMenu, user]);

    const handleFormOpen = (item = null) => {
        setCurrentItem(item ? { ...item } : { name: '', price: '', image: '' , description: ''});
        setFormOpen(true);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setCurrentItem(null);
    };

    const handleSave = async () => {
        try {
            if (currentItem.id) {
                await updateMenuItem(currentItem.id, currentItem);
            } else {
                await addMenuItem(currentItem);
            }
            fetchMenu();
            handleFormClose();
        } catch (err) {
            setError(err.message);
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
                fetchMenu();
            } catch (err) {
                setError(err.message);
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

    const filteredMenu = useMemo(() => {
        return menu.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [menu, searchTerm]);
    
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
            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && (
                <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
                    <Table>
                        <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Price</TableCell><TableCell>Image URL</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                        <TableBody>
                            {filteredMenu.map(item => (
                                <TableRow key={item.id}> 
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                    <TableCell>{item.image}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleFormOpen(item)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDeleteClick(item.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Dialog open={formOpen} onClose={handleFormClose}>
                <DialogTitle>{currentItem?.id ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" name="name" label="Name" type="text" fullWidth variant="outlined" value={currentItem?.name || ''} onChange={handleChange} />
                    <TextField margin="dense" name="price" label="Price" type="number" fullWidth variant="outlined" value={currentItem?.price || ''} onChange={handleChange} />
                    <TextField margin="dense" name="image" label="Image URL" type="text" fullWidth variant="outlined" value={currentItem?.image || ''} onChange={handleChange} />
                    <TextField margin="dense" name="description" label="Description" type="text" fullWidth multiline rows={4} variant="outlined" value={currentItem?.description || ''} onChange={handleChange} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFormClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={deleteConfirmOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this menu item? This action cannot be undone.
                    </DialogContentText>
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
