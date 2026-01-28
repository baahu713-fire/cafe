import React, { useState } from 'react';
import { Avatar, Box, Typography, Fade, Paper } from '@mui/material';

/**
 * HoverAvatar - An Avatar component that shows an enlarged version on hover.
 * Uses CSS transform to avoid making duplicate network requests.
 * 
 * Props:
 * - src: Image source URL
 * - alt: Alt text for the image
 * - name: Optional name to display below enlarged avatar
 * - size: Size of the avatar (default: 32)
 * - enlargedSize: Size of the enlarged avatar (default: 150)
 * - ...rest: Any other Avatar props
 */
const HoverAvatar = ({
    src,
    alt,
    name,
    size = 32,
    enlargedSize = 150,
    sx = {},
    ...rest
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        if (src) {
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <Box
            sx={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Avatar
                src={src}
                alt={alt}
                sx={{
                    width: size,
                    height: size,
                    cursor: src ? 'pointer' : 'default',
                    ...sx
                }}
                {...rest}
            />

            {/* Enlarged preview using CSS positioned overlay */}
            <Fade in={isHovered && !!src} timeout={150}>
                <Paper
                    elevation={8}
                    sx={{
                        position: 'absolute',
                        top: size + 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1500,
                        p: 1.5,
                        textAlign: 'center',
                        pointerEvents: 'none',
                        borderRadius: 2,
                    }}
                >
                    {/* Use the same image with CSS scaling instead of new element */}
                    <Box
                        sx={{
                            width: enlargedSize,
                            height: enlargedSize,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            boxShadow: 2,
                            backgroundImage: `url(${src})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    {name && (
                        <Typography
                            variant="body2"
                            sx={{
                                mt: 1,
                                fontWeight: 500,
                                maxWidth: enlargedSize,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {name}
                        </Typography>
                    )}
                </Paper>
            </Fade>
        </Box>
    );
};

export default HoverAvatar;
