import React, { useState, useEffect } from 'react';
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
    Chip,
    Grid,
    Card,
    CardContent,
    CardActions,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Checkbox,
    TablePagination,
    Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Schedule, Add, Remove, Info, Cancel as CancelIcon, EventBusy, CalendarMonth } from '@mui/icons-material';
import {
    getSchedulingConstraints,
    getSchedulableItems,
    createScheduledOrder,
    getMyScheduledOrders,
    bulkCancelScheduledOrders
} from '../services/scheduledOrderService';
import { getPublicHolidays } from '../services/calendarService';
import { useAuth } from '../contexts/AuthContext';
import SchedulableItemCard from '../components/SchedulableItemCard';
import ConfirmationDialog from '../components/ConfirmationDialog';

const ScheduledOrdersPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [initLoading, setInitLoading] = useState(true);
    const [initError, setInitError] = useState('');

    // Pagination & Data
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);

    // Cancel confirmation dialog state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    // Constraints & Creation Data
    const [constraints, setConstraints] = useState(null);
    const [schedulableData, setSchedulableData] = useState({ categories: [], items: [] });

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const [startDate, setStartDate] = useState(dayjs().add(1, 'day'));
    const [endDate, setEndDate] = useState(dayjs().add(1, 'day'));
    const [selectedItems, setSelectedItems] = useState([]);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [itemSearch, setItemSearch] = useState('');

    // Holiday data
    const [holidayDates, setHolidayDates] = useState(new Set());
    const [holidayNames, setHolidayNames] = useState(new Map());

    const [filterStartDate, setFilterStartDate] = useState(null);
    const [filterEndDate, setFilterEndDate] = useState(null);

    useEffect(() => {
        loadInitializationData();
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [page, rowsPerPage, filterStartDate, filterEndDate]);

    const loadInitializationData = async () => {
        setInitLoading(true);
        setInitError('');
        try {
            const [constraintsData, itemsData] = await Promise.all([
                getSchedulingConstraints(),
                getSchedulableItems()
            ]);
            setConstraints(constraintsData);
            setSchedulableData(itemsData);
        } catch (err) {
            console.error('Failed to load init data', err);
            setInitError('Failed to load scheduling data. Please try again.');
        } finally {
            setInitLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const startDateStr = filterStartDate ? filterStartDate.format('YYYY-MM-DD') : undefined;
            const endDateStr = filterEndDate ? filterEndDate.format('YYYY-MM-DD') : undefined;

            const data = await getMyScheduledOrders(false, page + 1, rowsPerPage, startDateStr, endDateStr);
            setOrders(data.orders || []);
            setTotal(data.total || 0);
            setSelectedOrderIds([]); // Reset selection on page change or refresh
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load scheduled orders');
        } finally {
            setLoading(false);
        }
    };

    // --- Bulk Action Handlers ---

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = orders.map((n) => n.id);
            setSelectedOrderIds(newSelecteds);
            return;
        }
        setSelectedOrderIds([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selectedOrderIds.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedOrderIds, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedOrderIds.slice(1));
        } else if (selectedIndex === selectedOrderIds.length - 1) {
            newSelected = newSelected.concat(selectedOrderIds.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedOrderIds.slice(0, selectedIndex),
                selectedOrderIds.slice(selectedIndex + 1),
            );
        }
        setSelectedOrderIds(newSelected);
    };

    const handleBulkCancel = async () => {
        console.log('handleBulkCancel called, selectedOrderIds:', selectedOrderIds);
        if (selectedOrderIds.length === 0) {
            setError('Please select at least one order to cancel');
            return;
        }
        // Open the confirmation dialog instead of window.confirm
        setCancelDialogOpen(true);
    };

    const handleConfirmCancel = async () => {
        setCancelLoading(true);
        try {
            console.log('Calling bulkCancelScheduledOrders with:', selectedOrderIds);
            const result = await bulkCancelScheduledOrders(selectedOrderIds);
            console.log('Cancel result:', result);
            setSuccess(`${result.cancelled || selectedOrderIds.length} orders cancelled successfully`);
            setCancelDialogOpen(false);
            fetchOrders();
        } catch (err) {
            console.error('Bulk cancel error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to cancel orders');
            setCancelDialogOpen(false);
        } finally {
            setCancelLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // --- Dialog Handlers (Existing Logic) ---

    // Fetch holidays for a year range (current + next year)
    const fetchHolidaysForPicker = async () => {
        try {
            const currentYear = dayjs().year();
            const [thisYear, nextYear] = await Promise.all([
                getPublicHolidays(currentYear),
                getPublicHolidays(currentYear + 1)
            ]);
            const allHolidays = [...(thisYear || []), ...(nextYear || [])];
            const dateSet = new Set();
            const nameMap = new Map();
            allHolidays.forEach(h => {
                const hd = new Date(h.holiday_date);
                const dateStr = `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, '0')}-${String(hd.getDate()).padStart(2, '0')}`;
                dateSet.add(dateStr);
                nameMap.set(dateStr, h.name);
            });
            setHolidayDates(dateSet);
            setHolidayNames(nameMap);
        } catch (err) {
            console.error('Failed to load holidays for picker', err);
        }
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
        setDialogError('');
        setSelectedItems([]);
        const nextDay = dayjs().add(1, 'day');
        setStartDate(nextDay);
        setEndDate(nextDay);
        setComment('');
        setItemSearch('');
        fetchHolidaysForPicker();
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleAddItem = (item, proportionName = null) => {
        // ... (Logic identical to previous implementation)
        let price = parseFloat(item.price);
        let displayName = item.name;

        if (proportionName && item.proportions) {
            const proportion = item.proportions.find(p => p.name === proportionName);
            if (proportion) {
                price = parseFloat(proportion.price);
                displayName = `${item.name} (${proportionName})`;
            }
        }

        const key = `${item.id}-${proportionName || 'default'}`;
        const existing = selectedItems.find(i => i.key === key);
        if (existing) {
            setSelectedItems(selectedItems.map(i =>
                i.key === key ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setSelectedItems([...selectedItems, {
                key, menu_item_id: item.id, name: displayName, price, quantity: 1, proportion_name: proportionName
            }]);
        }
    };

    const handleRemoveItem = (key) => {
        const existing = selectedItems.find(i => i.key === key);
        if (existing && existing.quantity > 1) {
            setSelectedItems(selectedItems.map(i => i.key === key ? { ...i, quantity: i.quantity - 1 } : i));
        } else {
            setSelectedItems(selectedItems.filter(i => i.key !== key));
        }
    };

    const handleAddCategory = (category) => {
        const key = `category-${category.category}`;
        const existing = selectedItems.find(i => i.key === key);
        if (existing) {
            setSelectedItems(selectedItems.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setSelectedItems([...selectedItems, {
                key, isCategory: true, category: category.category, name: category.category,
                price: category.minPrice, quantity: 1,
                priceDisplay: category.hasPriceRange ? `₹${category.minPrice} - ₹${category.maxPrice}` : `₹${category.minPrice}`
            }]);
        }
    };

    const handleRemoveCategory = (catName) => {
        const key = `category-${catName}`;
        const existing = selectedItems.find(i => i.key === key);
        if (existing && existing.quantity > 1) {
            setSelectedItems(selectedItems.map(i => i.key === key ? { ...i, quantity: i.quantity - 1 } : i));
        } else {
            setSelectedItems(selectedItems.filter(i => i.key !== key));
        }
    };

    const calculateTotal = () => selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculateMaxEndDate = () => startDate ? startDate.endOf('year') : dayjs().endOf('year');

    // Should disable date on DatePicker (weekends + holidays)
    const shouldDisableDate = (date) => {
        const day = date.day(); // 0=Sun, 6=Sat
        if (day === 0 || day === 6) return true;
        const dateStr = date.format('YYYY-MM-DD');
        return holidayDates.has(dateStr);
    };

    // Calculate working days summary between start and end date
    const getWorkingDaysSummary = () => {
        if (!startDate || !endDate) return null;
        let totalDays = 0;
        let weekends = 0;
        let holidays = 0;
        let workingDays = 0;
        const holidayList = [];

        for (let d = startDate; d.isBefore(endDate) || d.isSame(endDate, 'day'); d = d.add(1, 'day')) {
            totalDays++;
            const day = d.day();
            if (day === 0 || day === 6) {
                weekends++;
            } else {
                const dateStr = d.format('YYYY-MM-DD');
                if (holidayDates.has(dateStr)) {
                    holidays++;
                    holidayList.push({ date: d.format('DD MMM'), name: holidayNames.get(dateStr) || 'Holiday' });
                } else {
                    workingDays++;
                }
            }
        }
        return { totalDays, weekends, holidays, workingDays, holidayList };
    };

    const workingSummary = getWorkingDaysSummary();

    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            setDialogError('Please select at least one item');
            return;
        }
        setSubmitting(true);
        setDialogError('');
        try {
            const itemsToSubmit = selectedItems.map(i => {
                if (i.isCategory) return { category: i.category, quantity: i.quantity };
                return { menu_item_id: i.menu_item_id, quantity: i.quantity, proportion_name: i.proportion_name };
            });

            await createScheduledOrder(
                itemsToSubmit,
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                comment
            );
            setSuccess('Scheduled order created successfully!');
            handleCloseDialog();
            fetchOrders();
        } catch (err) {
            setDialogError(err.response?.data?.message || 'Failed to create scheduled order');
        } finally {
            setSubmitting(false);
        }
    };

    // Formatters
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

    // --- Render ---

    const getQuantity = (itemId, proportionName) => {
        const key = `${itemId}-${proportionName || 'default'}`;
        const found = selectedItems.find(i => i.key === key);
        return found ? found.quantity : 0;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule sx={{ fontSize: 32 }} />
                        My Scheduled Orders
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenDialog}
                        disabled={initLoading || (schedulableData.categories.length === 0 && schedulableData.items.length === 0)}
                    >
                        {initLoading ? 'Loading...' : 'New Schedule'}
                    </Button>
                </Box>

                {initError && (
                    <Alert severity="error" sx={{ mb: 2 }} action={
                        <Button color="inherit" size="small" onClick={loadInitializationData}>Retry</Button>
                    }>
                        {initError}
                    </Alert>
                )}

                {!initLoading && !initError && schedulableData.categories.length === 0 && schedulableData.items.length === 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        No items are available for scheduling. An admin needs to mark menu items as schedulable.
                    </Alert>
                )}

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">Filter:</Typography>
                    <DatePicker
                        label="From Date"
                        value={filterStartDate}
                        onChange={(newValue) => setFilterStartDate(newValue)}
                        slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                        format="DD/MM/YYYY"
                    />
                    <DatePicker
                        label="To Date"
                        value={filterEndDate}
                        onChange={(newValue) => setFilterEndDate(newValue)}
                        slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                        minDate={filterStartDate}
                        format="DD/MM/YYYY"
                    />
                    {(filterStartDate || filterEndDate) && (
                        <Button color="inherit" onClick={() => { setFilterStartDate(null); setFilterEndDate(null); }}>
                            Clear
                        </Button>
                    )}
                </Paper>


                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

                {/* Bulk Action Bar */}
                {selectedOrderIds.length > 0 && (
                    <Paper sx={{ mb: 2, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffebee' }}>
                        <Typography variant="subtitle1" color="error" fontWeight="bold">
                            {selectedOrderIds.length} orders selected
                        </Typography>
                        <Button
                            variant="outlined" color="error"
                            startIcon={<CancelIcon />}
                            onClick={handleBulkCancel}
                        >
                            Skip / Cancel Selected Days
                        </Button>
                    </Paper>
                )}

                {/* Constraints Info */}
                {constraints && (
                    <Alert severity="info" code="info" sx={{ mb: 2 }} icon={<Info />}>
                        {constraints.note}. You can schedule up to {constraints.maxStartDate}.
                    </Alert>
                )}

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.100' }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        color="primary"
                                        indeterminate={selectedOrderIds.length > 0 && selectedOrderIds.length < orders.length}
                                        checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                                        onChange={handleSelectAllClick}
                                    />
                                </TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Items</strong></TableCell>
                                <TableCell><strong>Total</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Created</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary">No active scheduled orders found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => {
                                    const isSelected = selectedOrderIds.indexOf(order.id) !== -1;
                                    return (
                                        <TableRow
                                            key={order.id}
                                            hover
                                            role="checkbox"
                                            aria-checked={isSelected}
                                            selected={isSelected}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    checked={isSelected}
                                                    onChange={(event) => handleClick(event, order.id)}
                                                    disabled={order.status !== 'Pending'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2" color="primary">
                                                    {new Date(order.scheduled_for_date).toLocaleDateString('en-GB')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {order.items && order.items.map((item, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={`${item.quantity}x ${item.name_at_order}`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>{formatPrice(order.total_price)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={order.status}
                                                    color={order.status === 'Pending' ? 'warning' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                                {new Date(order.created_at).toLocaleDateString('en-GB')}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={total}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </TableContainer>

                {/* Create Dialog (Reusing Logic) */}
                <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>Create Scheduled Order</DialogTitle>
                    <DialogContent>
                        {dialogError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{dialogError}</Alert>}
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(newValue) => {
                                        setStartDate(newValue);
                                        if (endDate.isBefore(newValue)) setEndDate(newValue);
                                    }}
                                    minDate={dayjs().add(1, 'day')}
                                    maxDate={constraints ? dayjs(constraints.maxStartDate) : undefined}
                                    shouldDisableDate={shouldDisableDate}
                                    slotProps={{ textField: { fullWidth: true } }}
                                    format="DD/MM/YYYY"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={setEndDate}
                                    minDate={startDate}
                                    maxDate={calculateMaxEndDate()}
                                    shouldDisableDate={shouldDisableDate}
                                    slotProps={{ textField: { fullWidth: true } }}
                                    format="DD/MM/YYYY"
                                />
                            </Grid>

                            {/* Working days summary */}
                            {workingSummary && workingSummary.totalDays > 0 && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <CalendarMonth color="info" fontSize="small" />
                                            <Typography variant="subtitle2" color="info.main" fontWeight={700}>
                                                Scheduling Summary
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            📅 Orders will be created for <strong>{workingSummary.workingDays} working day{workingSummary.workingDays !== 1 ? 's' : ''}</strong>
                                            {workingSummary.totalDays > 1 && ` out of ${workingSummary.totalDays} total days`}
                                        </Typography>
                                        {(workingSummary.weekends > 0 || workingSummary.holidays > 0) && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Skipping: {workingSummary.weekends > 0 && `${workingSummary.weekends} weekend day${workingSummary.weekends !== 1 ? 's' : ''}`}
                                                {workingSummary.weekends > 0 && workingSummary.holidays > 0 && ', '}
                                                {workingSummary.holidays > 0 && `${workingSummary.holidays} holiday${workingSummary.holidays !== 1 ? 's' : ''}`}
                                            </Typography>
                                        )}
                                        {workingSummary.holidayList.length > 0 && (
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                                                {workingSummary.holidayList.map((h, i) => (
                                                    <Chip
                                                        key={i}
                                                        icon={<EventBusy />}
                                                        label={`${h.date} — ${h.name}`}
                                                        size="small"
                                                        color="warning"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <TextField
                                    placeholder="Search items..."
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                    fullWidth size="small" sx={{ mb: 2 }}
                                />
                                {/* Categories */}
                                {(schedulableData.categories || []).length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" sx={{ bgcolor: 'primary.main', color: 'white', px: 1, borderRadius: 1 }}>Daily Specials</Typography>
                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            {schedulableData.categories.filter(c => c.category.toLowerCase().includes(itemSearch.toLowerCase())).map(category => {
                                                const key = `category-${category.category}`;
                                                const selected = selectedItems.find(i => i.key === key);
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} key={category.category}>
                                                        <Card variant="outlined">
                                                            <CardContent sx={{ pb: 1 }}>
                                                                <Typography variant="subtitle1">{category.category}</Typography>
                                                                <Typography variant="caption" display="block">
                                                                    {category.hasPriceRange ? `₹${category.minPrice} - ₹${category.maxPrice}` : `₹${category.minPrice}`}
                                                                </Typography>
                                                            </CardContent>
                                                            <CardActions sx={{ justifyContent: 'center' }}>
                                                                <IconButton size="small" onClick={() => handleRemoveCategory(category.category)} disabled={!selected}><Remove /></IconButton>
                                                                <Typography>{selected?.quantity || 0}</Typography>
                                                                <IconButton size="small" onClick={() => handleAddCategory(category)}><Add /></IconButton>
                                                            </CardActions>
                                                        </Card>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                )}

                                {/* Items */}
                                <Typography variant="h6" sx={{ bgcolor: 'grey.600', color: 'white', px: 1, borderRadius: 1 }}>Individual Items</Typography>
                                <Grid container spacing={2} sx={{ mt: 1 }}>


                                    {(schedulableData.items || []).filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())).map(item => (
                                        <Grid item xs={12} sm={6} md={4} key={item.id}>
                                            <SchedulableItemCard
                                                item={item}
                                                onAdd={handleAddItem}
                                                onRemove={(itm, prop) => handleRemoveItem(`${itm.id}-${prop || 'default'}`)}
                                                getQuantity={getQuantity}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} fullWidth multiline rows={2} />
                            </Grid>

                            {selectedItems.length > 0 && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                        <Typography variant="h6" gutterBottom>Order Summary</Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Item</TableCell>
                                                        <TableCell>Variant</TableCell>
                                                        <TableCell align="right">Price</TableCell>
                                                        <TableCell align="center">Quantity</TableCell>
                                                        <TableCell align="right">Total</TableCell>
                                                        <TableCell></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {selectedItems.map((item) => (
                                                        <TableRow key={item.key}>
                                                            <TableCell>{item.name.split('(')[0].trim()}</TableCell>
                                                            <TableCell>{item.proportion_name || (item.isCategory ? 'Category' : '-')}</TableCell>
                                                            <TableCell align="right">{item.isCategory ? item.priceDisplay : `₹${item.price}`}</TableCell>
                                                            <TableCell align="center">
                                                                <IconButton size="small" onClick={() => item.isCategory ? handleRemoveCategory(item.category) : handleRemoveItem(item.key)}>
                                                                    <Remove fontSize="small" />
                                                                </IconButton>
                                                                {item.quantity}
                                                                <IconButton size="small" onClick={() => item.isCategory ? handleAddCategory({ category: item.category, minPrice: item.price }) : handleAddItem({ id: item.menu_item_id, name: item.name.split('(')[0], price: item.price }, item.proportion_name)}>
                                                                    {/* Note: handleAddItem expects full item object usually, but we constructed simplified one. 
                                                                        Re-using original handleAddItem might be safer if we have original item data.
                                                                        Actually, `item` here is from `selectedItems` state, which has `menu_item_id`.
                                                                        We need to re-find the original item to pass to handleAddItem OR update handleAddItem to accept ID.
                                                                        Easier: Just manually increment quantity in state here.
                                                                     */}
                                                                    <Add fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                            <TableCell align="right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                            <TableCell>
                                                                {/* Delete button? */}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="right"><strong>Total Daily Cost:</strong></TableCell>
                                                        <TableCell align="right"><strong>₹{calculateTotal().toFixed(2)}</strong></TableCell>
                                                        <TableCell></TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained" disabled={submitting || selectedItems.length === 0}>
                            {submitting ? <CircularProgress size={24} /> : 'Create Schedule'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Cancel Confirmation Dialog */}
                <ConfirmationDialog
                    open={cancelDialogOpen}
                    onClose={() => setCancelDialogOpen(false)}
                    onConfirm={handleConfirmCancel}
                    title="Skip / Cancel Orders"
                    message={`Are you sure you want to cancel ${selectedOrderIds.length} scheduled order${selectedOrderIds.length > 1 ? 's' : ''}? This action cannot be undone.`}
                    type="cancel"
                    confirmText="Yes, Cancel Orders"
                    cancelText="Go Back"
                    loading={cancelLoading}
                />
            </Container>
        </LocalizationProvider>
    );
};

export default ScheduledOrdersPage;
