import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogContentText,
    Button,
    Slide,
    Box,
    Typography,
    Stack,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import GavelIcon from '@mui/icons-material/Gavel';

// Slide transition for animation
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Reusable Confirmation Dialog with animations
 */
const ConfirmationDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning',
    loading = false,
}) => {
    // Get icon and colors based on type
    const getTypeConfig = () => {
        switch (type) {
            case 'cancel':
                return {
                    icon: <CancelIcon sx={{ fontSize: 48 }} />,
                    bgGradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    confirmBg: '#dc2626',
                    confirmHoverBg: '#b91c1c',
                };
            case 'dispute':
                return {
                    icon: <GavelIcon sx={{ fontSize: 48 }} />,
                    bgGradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                    confirmBg: '#ea580c',
                    confirmHoverBg: '#c2410c',
                };
            default:
                return {
                    icon: <WarningAmberIcon sx={{ fontSize: 48 }} />,
                    bgGradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                    confirmBg: '#ea580c',
                    confirmHoverBg: '#c2410c',
                };
        }
    };

    const config = getTypeConfig();

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={loading ? undefined : onClose}
            aria-describedby="confirmation-dialog-description"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    minWidth: 340,
                    maxWidth: 420,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                },
            }}
        >
            {/* Animated Header */}
            <Box
                sx={{
                    background: config.bgGradient,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: 'white',
                }}
            >
                <Box
                    sx={{
                        animation: 'bounce 0.6s ease-in-out',
                        '@keyframes bounce': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                        },
                    }}
                >
                    {config.icon}
                </Box>
                <Typography
                    variant="h6"
                    sx={{
                        mt: 1,
                        fontWeight: 700,
                        textAlign: 'center',
                    }}
                >
                    {title}
                </Typography>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 1 }}>
                <DialogContentText
                    id="confirmation-dialog-description"
                    sx={{
                        textAlign: 'center',
                        color: 'text.primary',
                        fontSize: '1rem',
                    }}
                >
                    {message}
                </DialogContentText>
            </DialogContent>

            {/* Buttons Section */}
            <Stack spacing={1.5} sx={{ p: 2.5, pt: 1.5 }}>
                {/* Confirm Button - Always visible */}
                <Button
                    fullWidth
                    onClick={onConfirm}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        backgroundColor: config.confirmBg,
                        color: '#ffffff',
                        boxShadow: '0 4px 14px 0 rgba(0,0,0,0.25)',
                        '&:hover': {
                            backgroundColor: config.confirmHoverBg,
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px 0 rgba(0,0,0,0.3)',
                        },
                        '&:disabled': {
                            backgroundColor: '#9ca3af',
                            color: '#ffffff',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    {loading ? 'Processing...' : confirmText}
                </Button>

                {/* Cancel/Go Back Button */}
                <Button
                    fullWidth
                    onClick={onClose}
                    variant="outlined"
                    disabled={loading}
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        borderColor: '#d1d5db',
                        color: '#374151',
                        '&:hover': {
                            borderColor: '#9ca3af',
                            backgroundColor: '#f3f4f6',
                        },
                    }}
                >
                    {cancelText}
                </Button>
            </Stack>
        </Dialog>
    );
};

export default ConfirmationDialog;
