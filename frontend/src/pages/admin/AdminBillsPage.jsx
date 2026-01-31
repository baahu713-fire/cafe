import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Chip,
    Stack,
    TextField,
    InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
    Receipt,
    Download,
    Refresh,
    Search,
    People,
    CurrencyRupee,
    Print
} from '@mui/icons-material';
import { getAllUsersBills, downloadBillsCSV } from '../../services/billService';
import { getAllUsers } from '../../services/userService';
import { debounce } from 'lodash';

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
    
    /* Ensure table fits on page */
    table {
        width: 100% !important;
        font-size: 11px !important;
        page-break-inside: auto;
    }
    
    tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }
    
    th, td {
        padding: 6px 8px !important;
    }
    
    /* Summary cards - make them print-friendly */
    .summary-cards {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 10px !important;
        margin-bottom: 20px !important;
    }
    
    .summary-cards > div {
        flex: 1 1 18% !important;
        min-width: 120px !important;
    }
    
    /* Print header */
    .print-header {
        display: block !important;
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
    }
    
    .print-header h1 {
        margin: 0;
        font-size: 24px;
        color: #333;
    }
    
    .print-header p {
        margin: 5px 0 0 0;
        font-size: 14px;
        color: #666;
    }
    
    /* Page setup */
    @page {
        size: A4 landscape;
        margin: 10mm;
    }
}
`;

const AdminBillsPage = () => {
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Date range
    const [startDate, setStartDate] = useState(dayjs().startOf('month'));
    const [endDate, setEndDate] = useState(dayjs());

    // User filter
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [userSearch, setUserSearch] = useState('');

    // Bill data
    const [billData, setBillData] = useState(null);

    // Fetch users for dropdown
    const fetchUsers = useCallback(async (search = '') => {
        try {
            const { users: fetchedUsers } = await getAllUsers(1, 100, search);
            setUsers(fetchedUsers || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    }, []);

    const debouncedFetchUsers = useCallback(debounce(fetchUsers, 300), [fetchUsers]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (userSearch) {
            debouncedFetchUsers(userSearch);
        }
    }, [userSearch, debouncedFetchUsers]);

    const handleFetchBills = async () => {
        setLoading(true);
        setError('');
        setBillData(null);

        try {
            const start = startDate.format('YYYY-MM-DD');
            const end = endDate.format('YYYY-MM-DD');
            const userId = selectedUserId || null;

            const data = await getAllUsersBills(start, end, userId);
            setBillData(data);
        } catch (err) {
            console.error('Error fetching bills:', err);
            setError(err.response?.data?.message || 'Failed to fetch bills');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = async () => {
        setDownloading(true);
        setError('');

        try {
            const start = startDate.format('YYYY-MM-DD');
            const end = endDate.format('YYYY-MM-DD');
            const userId = selectedUserId || null;

            await downloadBillsCSV(start, end, userId);
            setSuccess('CSV downloaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error downloading CSV:', err);
            setError(err.response?.data?.message || 'Failed to download CSV');
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* Inject print styles */}
            <style>{printStyles}</style>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className="printable-area">
                {/* Print Header - Only visible when printing */}
                <Box className="print-header" sx={{ display: 'none' }}>
                    <Typography variant="h4" component="h1">The Cafe Central</Typography>
                    <Typography variant="body1">Admin Bill Generation Report</Typography>
                    <Typography variant="body2">
                        Period: {startDate.format('DD/MM/YYYY')} to {endDate.format('DD/MM/YYYY')}
                    </Typography>
                </Box>

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
                    <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt sx={{ fontSize: 32 }} />
                        Admin Bill Generation
                    </Typography>
                </Box>

                {/* Filters - Hide in print */}
                <Paper sx={{ p: 3, mb: 3 }} className="no-print">
                    <Typography variant="h6" gutterBottom>Filters</Typography>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                format="DD/MM/YYYY"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                minDate={startDate}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                format="DD/MM/YYYY"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>User Filter</InputLabel>
                                <Select
                                    value={selectedUserId}
                                    label="User Filter"
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <MenuItem value="">
                                        <em>All Users</em>
                                    </MenuItem>
                                    {users.map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.username} {user.name ? `(${user.name})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="contained"
                                    onClick={handleFetchBills}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
                                >
                                    {loading ? 'Loading...' : 'Generate'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleDownloadCSV}
                                    disabled={downloading || !billData}
                                    startIcon={downloading ? <CircularProgress size={20} /> : <Download />}
                                    color="success"
                                >
                                    CSV
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handlePrint}
                                    disabled={!billData}
                                    startIcon={<Print />}
                                    sx={{
                                        bgcolor: '#1976d2',
                                        '&:hover': { bgcolor: '#1565c0' },
                                        color: 'white'
                                    }}
                                >
                                    Print
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Alerts */}
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')} className="no-print">{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')} className="no-print">{success}</Alert>}

                {/* Summary Cards */}
                {billData && (
                    <Grid container spacing={2} sx={{ mb: 3 }} className="summary-cards">
                        <Grid item xs={6} sm={4} md={2.4}>
                            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <People sx={{ fontSize: 36, mb: 0.5 }} />
                                    <Typography variant="h5">{billData.grandTotals.totalUsers}</Typography>
                                    <Typography variant="body2">Users</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                            <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <Receipt sx={{ fontSize: 36, mb: 0.5 }} />
                                    <Typography variant="h5">{billData.grandTotals.totalOrders}</Typography>
                                    <Typography variant="body2">Total Orders</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                            <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <CurrencyRupee sx={{ fontSize: 36, mb: 0.5 }} />
                                    <Typography variant="h6">{formatCurrency(billData.grandTotals.settledTotal)}</Typography>
                                    <Typography variant="body2">Settled</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2.4}>
                            <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <CurrencyRupee sx={{ fontSize: 36, mb: 0.5 }} />
                                    <Typography variant="h6">{formatCurrency(billData.grandTotals.outstanding)}</Typography>
                                    <Typography variant="body2">Outstanding</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4} md={2.4}>
                            <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <CurrencyRupee sx={{ fontSize: 36, mb: 0.5 }} />
                                    <Typography variant="h6">{formatCurrency(billData.grandTotals.settledTotal + billData.grandTotals.outstanding)}</Typography>
                                    <Typography variant="body2">Grand Total</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Bills Table */}
                {billData && billData.users.length > 0 && (
                    <TableContainer component={Paper} elevation={2}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'grey.100' }}>
                                <TableRow>
                                    <TableCell><strong>User</strong></TableCell>
                                    <TableCell><strong>Team</strong></TableCell>
                                    <TableCell align="center"><strong>Orders</strong></TableCell>
                                    <TableCell align="center"><strong>Settled</strong></TableCell>
                                    <TableCell align="center"><strong>Delivered</strong></TableCell>
                                    <TableCell align="right"><strong>Settled Total</strong></TableCell>
                                    <TableCell align="right"><strong>Outstanding</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {billData.users.map((user) => (
                                    <TableRow key={user.userId} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle2">{user.username}</Typography>
                                                {user.name && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {user.name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={user.teamName} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="center">{user.totalOrders}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={user.settledCount}
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={user.deliveredCount}
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                            {formatCurrency(user.settledTotal)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: user.outstanding > 0 ? 'warning.main' : 'text.secondary', fontWeight: 'bold' }}>
                                            {formatCurrency(user.outstanding)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Totals Row */}
                                <TableRow sx={{ bgcolor: 'grey.200' }}>
                                    <TableCell colSpan={2}><strong>TOTAL</strong></TableCell>
                                    <TableCell align="center"><strong>{billData.grandTotals.totalOrders}</strong></TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                                        {formatCurrency(billData.grandTotals.settledTotal)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                                        {formatCurrency(billData.grandTotals.outstanding)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Empty State */}
                {billData && billData.users.length === 0 && (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            No bills found for the selected date range and filters.
                        </Typography>
                    </Paper>
                )}

                {/* Initial State */}
                {!billData && !loading && (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Receipt sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Generate Bill Report
                        </Typography>
                        <Typography color="text.secondary">
                            Select a date range and click "Generate" to view bills.
                        </Typography>
                    </Paper>
                )}
            </Container>
        </LocalizationProvider>
    );
};

export default AdminBillsPage;
