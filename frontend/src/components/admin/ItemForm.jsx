import React from 'react';
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
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { AVAILABILITY_OPTIONS } from '../../constants/categories';

const ItemForm = ({ open, handleClose, currentItem, setCurrentItem, handleSave, formError }) => {

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
                <TextField autoFocus margin="dense" name="name" label="Name" type="text" fullWidth variant="outlined" value={currentItem?.name || ''} onChange={handleChange} required/>
                <TextField margin="dense" name="price" label="Price" type="number" fullWidth variant="outlined" value={currentItem?.price || ''} onChange={handleChange} required />
                <TextField margin="dense" name="image" label="Image URL" type="text" fullWidth variant="outlined" value={currentItem?.image || ''} onChange={handleChange} />
                <TextField margin="dense" name="description" label="Description" type="text" fullWidth multiline rows={4} variant="outlined" value={currentItem?.description || ''} onChange={handleChange} />
                <FormControl component="fieldset" fullWidth margin="dense">
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
                    control={<Checkbox name="available" checked={currentItem?.available ?? false} onChange={handleChange} />}
                    label="Available for purchase"
                />
                <Typography sx={{ mt: 2, mb: 1 }}>Proportions (Optional)</Typography>
                {currentItem?.proportions?.map((proportion, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        <TextField label="Proportion Name" value={proportion.name} onChange={(e) => handleProportionChange(index, 'name', e.target.value)} required />
                        <TextField label="Price" type="number" value={proportion.price} onChange={(e) => handleProportionChange(index, 'price', e.target.value)} required />
                        <IconButton onClick={() => removeProportion(index)}><DeleteIcon /></IconButton>
                    </Box>
                ))}
                <Button startIcon={<AddIcon />} onClick={addProportion}>Add Proportion</Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ItemForm;
