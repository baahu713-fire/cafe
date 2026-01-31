import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Divider } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

const SchedulableItemCard = ({ item, onAdd, onRemove, getQuantity }) => {
    const hasProportions = item.proportions && item.proportions.length > 0;

    const renderControl = (proportionName = null, price) => {
        const quantity = getQuantity(item.id, proportionName);
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <Box>
                    <Typography variant="body2" fontWeight={proportionName ? 'normal' : 'bold'}>
                        {proportionName || item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        ₹{parseFloat(price)}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => onRemove(item, proportionName)}
                        disabled={quantity === 0}
                        color="error"
                    >
                        <Remove fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ mx: 1, minWidth: '20px', textAlign: 'center' }}>
                        {quantity}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => onAdd(item, proportionName)}
                        color="primary"
                    >
                        <Add fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
        );
    };

    return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, pb: 2 }}>
                <Typography variant="subtitle1" component="div" gutterBottom fontWeight="bold">
                    {item.name}
                </Typography>

                {hasProportions ? (
                    <Box>
                        {item.proportions.map((p, index) => (
                            <React.Fragment key={p.name}>
                                {index > 0 && <Divider sx={{ my: 1 }} />}
                                {renderControl(p.name, p.price)}
                            </React.Fragment>
                        ))}
                    </Box>
                ) : (
                    renderControl(null, item.price)
                )}
            </CardContent>
        </Card>
    );
};

export default SchedulableItemCard;
