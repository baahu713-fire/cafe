import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Box,
    IconButton,
    Typography,
    FormControl,
    FormGroup,
    FormControlLabel,
    Checkbox,
    FormLabel,
    Alert,
    CircularProgress,
    Select,
    MenuItem,
    InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { AVAILABILITY_OPTIONS, DAILY_SPECIAL_CATEGORIES, DAYS_OF_WEEK } from '../../constants/categories';

const ItemForm = ({ open, handleClose, currentItem, setCurrentItem, handleSave, formError, isSaving }) => {
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (currentItem?.image) {
            setImagePreview(URL.createObjectURL(currentItem.image));
        } else if (currentItem?.image_data) {
            setImagePreview(currentItem.image_data);
        } else {
            setImagePreview(null);
        }
    }, [currentItem]);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCurrentItem(prev => ({ ...prev, image: file, image_data: null }));
        } else {
            setCurrentItem(prev => ({ ...prev, image: null }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentItem(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
        const newProportions = currentItem.proportions.filter((_, i) => i !== index);
        setCurrentItem({ ...currentItem, proportions: newProportions });
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{currentItem?.id ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            <DialogContent>
                {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                <TextField autoFocus margin="dense" name="name" label="Name" type="text" fullWidth variant="outlined" value={currentItem?.name || ''} onChange={handleChange} required disabled={isSaving} />
                <TextField margin="dense" name="price" label="Price" type="number" fullWidth variant="outlined" value={currentItem?.price || ''} onChange={handleChange} required disabled={isSaving} />
                <Button variant="contained" component="label" fullWidth sx={{ my: 1 }} disabled={isSaving}>
                    Upload Image
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {imagePreview && (
                    <Box mt={2} textAlign="center">
                        <img src={imagePreview} alt="Preview" height="150" />
                    </Box>
                )}
                <TextField margin="dense" name="description" label="Description" type="text" fullWidth multiline rows={4} variant="outlined" value={currentItem?.description || ''} onChange={handleChange} disabled={isSaving} />

                {/* Daily Special Settings */}
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Daily Special Settings</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl fullWidth margin="dense" disabled={isSaving}>
                        <InputLabel>Special Category</InputLabel>
                        <Select
                            name="category"
                            value={currentItem?.category || ''}
                            onChange={handleChange}
                            label="Special Category"
                        >
                            {DAILY_SPECIAL_CATEGORIES.map(cat => (
                                <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="dense" disabled={isSaving || !currentItem?.category}>
                        <InputLabel>Day of Week</InputLabel>
                        <Select
                            name="day_of_week"
                            value={currentItem?.day_of_week || ''}
                            onChange={handleChange}
                            label="Day of Week"
                        >
                            {DAYS_OF_WEEK.map(day => (
                                <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <FormControl component="fieldset" fullWidth margin="dense" disabled={isSaving}>
                    <FormLabel component="legend">Categories</FormLabel>
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
                <FormControlLabel
                    control={<Checkbox name="available" checked={currentItem?.available ?? false} onChange={handleChange} disabled={isSaving} />}
                    label="Available for purchase"
                />
                <Typography sx={{ mt: 2, mb: 1 }}>Proportions (Optional)</Typography>
                {currentItem?.proportions?.map((proportion, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        <TextField label="Proportion Name" value={proportion.name} onChange={(e) => handleProportionChange(index, 'name', e.target.value)} required disabled={isSaving} />
                        <TextField label="Price" type="number" value={proportion.price} onChange={(e) => handleProportionChange(index, 'price', e.target.value)} required disabled={isSaving} />
                        <IconButton onClick={() => removeProportion(index)} disabled={isSaving}><DeleteIcon /></IconButton>
                    </Box>
                ))}
                <Button startIcon={<AddIcon />} onClick={addProportion} disabled={isSaving}>Add Proportion</Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={isSaving}>
                    {isSaving ? <CircularProgress size={24} /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ItemForm;

