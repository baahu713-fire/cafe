import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Box,
    Chip,
    Divider,
    Paper,
    Link,
    CircularProgress,
    Alert,
    Avatar
} from '@mui/material';
import {
    Phone,
    LocationOn,
    Support,
    ReportProblem,
    Person
} from '@mui/icons-material';
import { getCmcMembers } from '../services/cmcService';

const MemberCard = ({ member }) => (
    <Card
        elevation={4}
        sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            borderRadius: 3,
            overflow: 'hidden',
            '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
            }
        }}
    >
        <Box
            sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                pt: 4,
                pb: 2,
                display: 'flex',
                justifyContent: 'center'
            }}
        >
            {member.photo ? (
                <CardMedia
                    component="img"
                    image={member.photo}
                    alt={member.name}
                    sx={{
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        border: '4px solid white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        objectFit: 'cover'
                    }}
                />
            ) : (
                <Avatar
                    sx={{
                        width: 140,
                        height: 140,
                        border: '4px solid white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        bgcolor: 'primary.light',
                        fontSize: '3rem'
                    }}
                >
                    <Person sx={{ fontSize: '4rem' }} />
                </Avatar>
            )}
        </Box>
        <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 2 }}>
            <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                {member.name}
            </Typography>
            <Chip
                label={member.designation}
                color="primary"
                variant="outlined"
                sx={{ mb: 2, fontWeight: 'medium' }}
            />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Phone sx={{ mr: 1.5, color: 'primary.main' }} />
                    <Typography variant="body1">
                        <Link href={`tel:${member.phone}`} underline="hover">
                            {member.phone || 'Not available'}
                        </Link>
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1.5, color: 'error.main' }} />
                    <Typography variant="body1" color="text.secondary">
                        {member.address || 'Not available'}
                    </Typography>
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const ContactPage = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const data = await getCmcMembers();
                setMembers(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching CMC members:', err);
                setError('Failed to load CMC members. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header Section */}
            <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Typography
                    variant="h3"
                    component="h1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    Contact CMC
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                    Canteen Management Committee - Here to help with your queries and concerns
                </Typography>
            </Box>

            {/* Quick Actions */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        elevation={2}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)' }
                        }}
                    >
                        <Support sx={{ fontSize: 48, color: 'success.main' }} />
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Need Help?</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Contact any CMC member for assistance with menu, orders, or feedback
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        elevation={2}
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)' }
                        }}
                    >
                        <ReportProblem sx={{ fontSize: 48, color: 'error.main' }} />
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Lodge a Complaint</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Report any issues with food quality, service, or hygiene
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* CMC Members Section */}
            <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                CMC Members
            </Typography>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {!loading && !error && (
                <Grid container spacing={4}>
                    {members.length > 0 ? (
                        members.map((member) => (
                            <Grid key={member.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <MemberCard member={member} />
                            </Grid>
                        ))
                    ) : (
                        <Grid size={{ xs: 12 }}>
                            <Alert severity="info">
                                No CMC members found. Please check back later.
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Footer Note */}
            <Box sx={{ mt: 5, textAlign: 'center' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        backgroundColor: 'grey.100'
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        <strong>Office Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        For urgent matters outside office hours, please leave a message and we'll respond promptly.
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default ContactPage;

