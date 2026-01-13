import React from 'react';
import { Alert, Typography } from '@mui/material';

const UnsettledAmountNotification = ({ amount, dueDate }) => {
    if (!amount || amount <= 0) {
        return null;
    }

    return (
        <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
                You have an unsettled amount of <strong>₹{amount.toFixed(2)}</strong> which is due on <strong>{new Date(dueDate).toLocaleDateString()}</strong>.
            </Typography>
        </Alert>
    );
};

export default UnsettledAmountNotification;
