import React from 'react';
import { Rating, Box, Typography } from '@mui/material';

const StarRating = ({ value, readOnly = false, ...props }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating 
                value={value} 
                readOnly={readOnly} 
                precision={0.5} // Allow half-stars if needed
                {...props} 
            />
        </Box>
    );
};

export default StarRating;
