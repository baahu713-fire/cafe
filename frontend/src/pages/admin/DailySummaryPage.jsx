import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Grid, CircularProgress, Alert,
    Chip, Card, CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Print, Refresh, Restaurant, PendingActions, LocalShipping, CheckCircle } from '@mui/icons-material';
import api from '../../services/api';

// Print-specific styles
const printStyles = `
@media print {
    /* Hide everything by default */
    body * {
        visibility: hidden;
    }
    
    /* Show only printable area */
    .printable-area, .printable-area * {
        visibility: visible;
    }
    
    .printable-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20px;
        box-sizing: border-box;
    }
    
    /* Hide non-printable elements */
    .no-print {
        display: none !important;
    }
    
    /* Print header */
    .print-header {
        display: block !important;
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
    }
    
    /* Ensure table fits on page */
    table {
        width: 100% !important;
        font-size: 11px !important;
    }
    
    th, td {
        padding: 6px 8px !important;
    }
    
    /* Page setup */
    @page {
        size: A4 portrait;
        margin: 10mm;
    }
}
`;

const DailySummaryPage = () => {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [loading, setLoading] = useState(false);
    const [summaryItems, setSummaryItems] = useState([]);
    const [error, setError] = useState('');

    const fetchSummary = async () => {
        // Don't set loading to true for background refreshes if data exists
        if (summaryItems.length === 0) setLoading(true);
        setError('');
        try {
            const formattedDate = selectedDate.format('YYYY-MM-DD');
            const response = await api.get(`/orders/daily-summary?date=${formattedDate}`);
            setSummaryItems(response.data);
        } catch (err) {
            setError('Failed to fetch daily summary');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();

        // Auto-refresh every 1 minute
        const intervalId = setInterval(() => {
            fetchSummary();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [selectedDate]);

    const handlePrint = () => {
        window.print();
    };

    // Calculate totals
    const getTotals = () => {
        return summaryItems.reduce((acc, item) => ({
            pending: acc.pending + parseInt(item.pending_qty || 0),
            delivered: acc.delivered + parseInt(item.delivered_qty || 0),
            settled: acc.settled + parseInt(item.settled_qty || 0),
            total: acc.total + parseInt(item.total_quantity || 0)
        }), { pending: 0, delivered: 0, settled: 0, total: 0 });
    };

    const totals = getTotals();

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* Inject print styles */}
            <style>{printStyles}</style>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className="printable-area">
                {/* Print Header - Only visible when printing */}
                <Box className="print-header" sx={{ display: 'none' }}>
                    <Typography variant="h4" component="h1">The Cafe Central</Typography>
                    <Typography variant="body1">Daily Consumption Summary</Typography>
                    <Typography variant="body2">
                        Date: {selectedDate.format('DD/MM/YYYY')}
                    </Typography>
                </Box>

                {/* Header - Hidden in print */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }} className="no-print">
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Restaurant sx={{ fontSize: 32 }} />
                        Daily Consumption Summary
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={(newValue) => setSelectedDate(newValue)}
                            slotProps={{ textField: { size: 'small' } }}
                            format="DD/MM/YYYY"
                        />
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={fetchSummary}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Print />}
                            onClick={handlePrint}
                            sx={{
                                bgcolor: '#1976d2',
                                '&:hover': { bgcolor: '#1565c0' },
                                color: 'white'
                            }}
                        >
                            Print
                        </Button>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }} className="no-print">{error}</Alert>}

                {/* Summary Cards */}
                {summaryItems.length > 0 && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}>
                            <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <PendingActions sx={{ fontSize: 32 }} />
                                    <Typography variant="h4">{totals.pending}</Typography>
                                    <Typography variant="body2">Pending</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <LocalShipping sx={{ fontSize: 32 }} />
                                    <Typography variant="h4">{totals.delivered}</Typography>
                                    <Typography variant="body2">Delivered</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <CheckCircle sx={{ fontSize: 32 }} />
                                    <Typography variant="h4">{totals.settled}</Typography>
                                    <Typography variant="body2">Settled</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <Restaurant sx={{ fontSize: 32 }} />
                                    <Typography variant="h4">{totals.total}</Typography>
                                    <Typography variant="body2">Total Items</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                <TableContainer component={Paper} elevation={3}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#eeeeee' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Variation / Portion</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>Pending</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'info.dark' }}>Delivered</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'success.dark' }}>Settled</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'primary.contrastText' }}>Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : summaryItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No orders found for this date.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {summaryItems.map((item, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell sx={{ fontWeight: 500 }}>{item.name_at_order}</TableCell>
                                            <TableCell>{item.proportion_name || '-'}</TableCell>
                                            <TableCell align="center">
                                                {parseInt(item.pending_qty || 0) > 0 ? (
                                                    <Chip
                                                        label={item.pending_qty}
                                                        size="small"
                                                        color="warning"
                                                        sx={{ minWidth: 50, fontWeight: 'bold' }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">0</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {parseInt(item.delivered_qty || 0) > 0 ? (
                                                    <Chip
                                                        label={item.delivered_qty}
                                                        size="small"
                                                        color="info"
                                                        sx={{ minWidth: 50, fontWeight: 'bold' }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">0</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {parseInt(item.settled_qty || 0) > 0 ? (
                                                    <Chip
                                                        label={item.settled_qty}
                                                        size="small"
                                                        color="success"
                                                        sx={{ minWidth: 50, fontWeight: 'bold' }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">0</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ bgcolor: 'primary.light' }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                                                    {item.total_quantity}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals Row */}
                                    <TableRow sx={{ bgcolor: 'grey.300' }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
                                        <TableCell align="center">
                                            <Chip label={totals.pending} size="small" color="warning" sx={{ fontWeight: 'bold' }} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={totals.delivered} size="small" color="info" sx={{ fontWeight: 'bold' }} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={totals.settled} size="small" color="success" sx={{ fontWeight: 'bold' }} />
                                        </TableCell>
                                        <TableCell align="center" sx={{ bgcolor: 'primary.main' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                                                {totals.total}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </LocalizationProvider>
    );
};

export default DailySummaryPage;
