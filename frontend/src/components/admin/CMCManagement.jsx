import React, { useState, useEffect } from 'react';
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
    Avatar,
    Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import {
    getCmcMembers,
    createCmcMember,
    updateCmcMember,
    deleteCmcMember
} from '../../services/cmcService';
import HoverAvatar from '../HoverAvatar';

const CMCManagement = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [currentMember, setCurrentMember] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        designation: '',
        phone: '',
        address: '',
        display_order: 0
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const data = await getCmcMembers();
            setMembers(data);
            setError(null);
        } catch (err) {
            setError('Failed to load CMC members');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleOpenForm = (member = null) => {
        if (member) {
            setCurrentMember(member);
            setFormData({
                name: member.name || '',
                designation: member.designation || '',
                phone: member.phone || '',
                address: member.address || '',
                display_order: member.display_order || 0
            });
            setPhotoPreview(member.photo || null);
        } else {
            setCurrentMember(null);
            setFormData({
                name: '',
                designation: '',
                phone: '',
                address: '',
                display_order: members.length + 1
            });
            setPhotoPreview(null);
        }
        setPhotoFile(null);
        setFormError('');
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setCurrentMember(null);
        setFormError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) {
                setFormError('Photo must be less than 500KB');
                return;
            }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setFormError('');
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.designation.trim()) {
            setFormError('Name and Designation are required');
            return;
        }

        setIsSaving(true);
        setFormError('');

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('designation', formData.designation);
            submitData.append('phone', formData.phone);
            submitData.append('address', formData.address);
            submitData.append('display_order', formData.display_order);

            if (photoFile) {
                submitData.append('photo', photoFile);
            }

            if (currentMember) {
                await updateCmcMember(currentMember.id, submitData);
                setSnackbar({ open: true, message: 'Member updated successfully', severity: 'success' });
            } else {
                await createCmcMember(submitData);
                setSnackbar({ open: true, message: 'Member added successfully', severity: 'success' });
            }

            handleCloseForm();
            fetchMembers();
        } catch (err) {
            console.error('Error saving member:', err);
            setFormError(err.response?.data?.error || 'Failed to save member');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (member) => {
        setMemberToDelete(member);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!memberToDelete) return;

        try {
            await deleteCmcMember(memberToDelete.id);
            setSnackbar({ open: true, message: 'Member deleted successfully', severity: 'success' });
            fetchMembers();
        } catch (err) {
            console.error('Error deleting member:', err);
            setSnackbar({ open: true, message: 'Failed to delete member', severity: 'error' });
        } finally {
            setDeleteConfirmOpen(false);
            setMemberToDelete(null);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    CMC Members Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenForm()}
                >
                    Add Member
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Order</TableCell>
                            <TableCell>Photo</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Designation</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No CMC members found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>{member.display_order}</TableCell>
                                    <TableCell>
                                        {member.photo ? (
                                            <HoverAvatar
                                                src={member.photo}
                                                alt={member.name}
                                                name={member.name}
                                                size={40}
                                            />
                                        ) : (
                                            <Avatar><PersonIcon /></Avatar>
                                        )}
                                    </TableCell>
                                    <TableCell>{member.name}</TableCell>
                                    <TableCell>{member.designation}</TableCell>
                                    <TableCell>{member.phone || '-'}</TableCell>
                                    <TableCell>{member.address || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleOpenForm(member)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeleteClick(member)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {currentMember ? 'Edit CMC Member' : 'Add CMC Member'}
                </DialogTitle>
                <DialogContent>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formError}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Designation"
                            name="designation"
                            value={formData.designation}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            label="Display Order"
                            name="display_order"
                            type="number"
                            value={formData.display_order}
                            onChange={handleInputChange}
                            fullWidth
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Photo (max 500KB)
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                            >
                                Upload Photo
                                <input
                                    type="file"
                                    hidden
                                    accept="image/jpeg,image/jpg,image/png,image/gif"
                                    onChange={handlePhotoChange}
                                />
                            </Button>
                            {photoPreview && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Avatar
                                        src={photoPreview}
                                        sx={{ width: 100, height: 100 }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseForm} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isSaving}
                    >
                        {isSaving ? <CircularProgress size={24} /> : (currentMember ? 'Update' : 'Add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete {memberToDelete?.name}? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                message={snackbar.message}
            />
        </Box>
    );
};

export default CMCManagement;
