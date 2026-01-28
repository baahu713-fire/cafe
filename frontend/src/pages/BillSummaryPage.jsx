import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Divider,
    Chip,
    Grid,
    Card,
    CardContent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Receipt, CalendarMonth, Print, Download } from '@mui/icons-material';
import { getBillSummary } from '../services/billService';
import { useAuth } from '../contexts/AuthContext';

const BillSummaryPage = () => {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState(dayjs().startOf('month'));
    const [endDate, setEndDate] = useState(dayjs());
    const [billData, setBillData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateBill = async () => {
        if (!startDate || !endDate) {
            setError('Please select both start and end dates');
            return;
        }

        if (startDate.isAfter(endDate)) {
            setError('Start date must be before end date');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const data = await getBillSummary(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD')
            );
            setBillData(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate bill summary');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt sx={{ fontSize: 32 }} />
                    Bill Summary
                </Typography>

                {/* Date Selection */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarMonth />
                        Select Date Range
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={setStartDate}
                                maxDate={endDate || dayjs()}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={setEndDate}
                                minDate={startDate}
                                maxDate={dayjs()}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleGenerateBill}
                                disabled={loading}
                                sx={{ height: 56 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Generate Bill'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {/* Bill Summary Results */}
                {billData && (
                    <Box className="print-section">
                        {/* Summary Cards */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" gutterBottom>Settled Orders</Typography>
                                        <Typography variant="h4">₹{billData.summary.settledTotal.toFixed(2)}</Typography>
                                        <Typography variant="body2">{billData.summary.settledOrdersCount} orders</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" gutterBottom>Delivered Orders</Typography>
                                        <Typography variant="h4">₹{billData.summary.deliveredTotal.toFixed(2)}</Typography>
                                        <Typography variant="body2">{billData.summary.deliveredOrdersCount} orders</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" gutterBottom>Grand Total</Typography>
                                        <Typography variant="h4">₹{billData.summary.grandTotal.toFixed(2)}</Typography>
                                        <Typography variant="body2">{billData.summary.totalOrdersCount} total orders</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* User Info & Date Range */}
                        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle1">
                                <strong>User:</strong> {billData.user.name} (@{billData.user.username})
                            </Typography>
                            <Typography variant="subtitle1">
                                <strong>Period:</strong> {billData.dateRange.startDate} to {billData.dateRange.endDate}
                            </Typography>
                        </Paper>

                        {/* Items Breakdown */}
                        <Paper elevation={2} sx={{ mb: 3 }}>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">Items Breakdown</Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<Print />}
                                    onClick={handlePrint}
                                    className="no-print"
                                >
                                    Print
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell><strong>Item</strong></TableCell>
                                            <TableCell><strong>Portion</strong></TableCell>
                                            <TableCell align="right"><strong>Price/Unit</strong></TableCell>
                                            <TableCell align="right"><strong>Quantity</strong></TableCell>
                                            <TableCell align="right"><strong>Total</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {billData.itemsBreakdown.map((item, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>{item.proportionName || '-'}</TableCell>
                                                <TableCell align="right">₹{item.pricePerUnit.toFixed(2)}</TableCell>
                                                <TableCell align="right">{item.totalQuantity}</TableCell>
                                                <TableCell align="right"><strong>₹{item.totalAmount.toFixed(2)}</strong></TableCell>
                                            </TableRow>
                                        ))}
                                        {billData.itemsBreakdown.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    No items found for this period
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        {/* Orders List */}
                        <Paper elevation={2}>
                            <Box sx={{ p: 2 }}>
                                <Typography variant="h6">Order Details</Typography>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell><strong>Order ID</strong></TableCell>
                                            <TableCell><strong>Date</strong></TableCell>
                                            <TableCell><strong>Status</strong></TableCell>
                                            <TableCell><strong>Items</strong></TableCell>
                                            <TableCell align="right"><strong>Amount</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {billData.orders.map((order) => (
                                            <TableRow key={order.orderId} hover>
                                                <TableCell>#{order.orderId}</TableCell>
                                                <TableCell>{new Date(order.createdAt).toLocaleDateString('en-IN')}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={order.status}
                                                        size="small"
                                                        color={order.status === 'Settled' ? 'success' : 'info'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {order.items.map(i => `${i.name_at_order} x${i.quantity}`).join(', ')}
                                                </TableCell>
                                                <TableCell align="right">₹{order.totalPrice.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                )}
            </Container>
        </LocalizationProvider>
    );
};

export default BillSummaryPage;
