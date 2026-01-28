import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Switch, FormControlLabel, Box, CircularProgress, TextField,
    Button, Modal, Snackbar
} from '@mui/material';
import {
    getAllUsersForSuperAdmin, updateUserBySuperAdmin, changeUserPasswordBySuperAdmin
} from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import HoverAvatar from '../HoverAvatar';

const ManageUsers = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [passwordChangeUser, setPasswordChangeUser] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const { user } = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const data = await getAllUsersForSuperAdmin();
                setAllUsers(data);
                setFilteredUsers(data);
                setError('');
            } catch (err) {
                setError('Failed to fetch users. You may not have the required permissions.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.isSuperAdmin) {
            fetchUsers();
        }
    }, [user]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = allUsers.filter(item => {
            return (
                item.name?.toLowerCase().includes(lowercasedFilter) ||
                item.username?.toLowerCase().includes(lowercasedFilter) ||
                item.team_name?.toLowerCase().includes(lowercasedFilter)
            );
        });
        setFilteredUsers(filteredData);
    }, [searchTerm, allUsers]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleStatusChange = async (userId, isActive) => {
        try {
            const updatedUser = await updateUserBySuperAdmin(userId, { is_active: isActive });
            const updatedUsers = allUsers.map(u => (u.id === userId ? updatedUser : u));
            setAllUsers(updatedUsers);
            setSnackbar({ open: true, message: 'User status updated successfully!' });
        } catch (err) {
            setError('Failed to update user status.');
            console.error(err);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
    };

    const handleChangePassword = (user) => {
        setPasswordChangeUser(user);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setPasswordChangeUser(null);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ open: false, message: '' });
    };

    if (!user || !user.isSuperAdmin) {
        return <Typography>You are not authorized to view this page.</Typography>;
    }

    return (
        <Container>
            <Typography variant="h5" gutterBottom>Manage Users</Typography>
            <TextField
                label="Search by name, username, or team"
                variant="outlined"
                fullWidth
                margin="normal"
                value={searchTerm}
                onChange={handleSearchChange}
            />
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : (
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Photo</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Team</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell>
                                            <HoverAvatar
                                                src={`/api/users/${u.id}/photo`}
                                                alt={u.name || u.username}
                                                name={u.name || u.username}
                                                size={40}
                                            />
                                        </TableCell>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>{u.username}</TableCell>
                                        <TableCell>{u.role}</TableCell>
                                        <TableCell>{u.team_name}</TableCell>
                                        <TableCell>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={u.is_active}
                                                        onChange={(e) => handleStatusChange(u.id, e.target.checked)}
                                                        disabled={u.id === user.id}
                                                    />
                                                }
                                                label={u.is_active ? 'Active' : 'Inactive'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button size="small" onClick={() => handleEditUser(u)}>Edit</Button>
                                            <Button size="small" onClick={() => handleChangePassword(u)}>Change Password</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
            {editingUser && <EditUserModal user={editingUser} onClose={handleCloseModal} setAllUsers={setAllUsers} setSnackbar={setSnackbar} />}
            {passwordChangeUser && <ChangePasswordModal user={passwordChangeUser} onClose={handleCloseModal} setSnackbar={setSnackbar} />}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={snackbar.message}
            />
        </Container>
    );
};

const EditUserModal = ({ user, onClose, setAllUsers, setSnackbar }) => {
    const [name, setName] = useState(user.name);
    const [photo, setPhoto] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        if (photo) {
            formData.append('photo', photo);
        }

        try {
            const updatedUser = await updateUserBySuperAdmin(user.id, formData);
            setAllUsers(prevUsers => prevUsers.map(u => (u.id === user.id ? { ...u, ...updatedUser } : u)));
            setSnackbar({ open: true, message: 'User updated successfully!' });
            onClose();
        } catch (error) {
            console.error('Failed to update user:', error);
            setSnackbar({ open: true, message: 'Failed to update user.' });
        }
    };

    return (
        <Modal open={true} onClose={onClose}>
            <Box sx={{ ...modalStyle }}>
                <Typography variant="h6">Edit User</Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <Button variant="contained" component="label">
                        Upload Photo
                        <input type="file" hidden onChange={(e) => setPhoto(e.target.files[0])} />
                    </Button>
                    {photo && <Typography variant="body2">{photo.name}</Typography>}
                    <Box sx={{ mt: 2 }}>
                        <Button type="submit" variant="contained" color="primary">Save</Button>
                        <Button onClick={onClose} sx={{ ml: 1 }}>Cancel</Button>
                    </Box>
                </form>
            </Box>
        </Modal>
    );
};

const ChangePasswordModal = ({ user, onClose, setSnackbar }) => {
    const [newPassword, setNewPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await changeUserPasswordBySuperAdmin(user.id, newPassword);
            setSnackbar({ open: true, message: 'Password updated successfully!' });
            onClose();
        } catch (error) {
            console.error('Failed to change password:', error);
            setSnackbar({ open: true, message: 'Failed to change password.' });
        }
    };

    return (
        <Modal open={true} onClose={onClose}>
            <Box sx={{ ...modalStyle }}>
                <Typography variant="h6">Change Password for {user.username}</Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <Box sx={{ mt: 2 }}>
                        <Button type="submit" variant="contained" color="primary">Update Password</Button>
                        <Button onClick={onClose} sx={{ ml: 1 }}>Cancel</Button>
                    </Box>
                </form>
            </Box>
        </Modal>
    );
};

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default ManageUsers;