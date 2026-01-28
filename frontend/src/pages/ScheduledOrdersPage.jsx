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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Schedule, Add, Remove, CalendarMonth, Info } from '@mui/icons-material';
import {
    getSchedulingConstraints,
    getSchedulableItems,
    createScheduledOrder,
    getMyScheduledOrders
} from '../services/scheduledOrderService';
import { useAuth } from '../contexts/AuthContext';

const ScheduledOrdersPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Constraints
    const [constraints, setConstraints] = useState(null);

    // Schedulable items and categories
    const [schedulableData, setSchedulableData] = useState({ categories: [], items: [] });

    // My scheduled orders
    const [myOrders, setMyOrders] = useState([]);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const [startDate, setStartDate] = useState(dayjs().add(1, 'day'));
    const [endDate, setEndDate] = useState(dayjs().add(1, 'day'));
    const [selectedItems, setSelectedItems] = useState([]);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [itemSearch, setItemSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [constraintsData, itemsData, ordersData] = await Promise.all([
                getSchedulingConstraints(),
                getSchedulableItems(),
                getMyScheduledOrders()
            ]);
            setConstraints(constraintsData);
            setSchedulableData(itemsData);
            setMyOrders(ordersData);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
        setDialogError('');
        setSelectedItems([]);
        setStartDate(dayjs().add(1, 'day'));
        setEndDate(dayjs().add(1, 'day'));
        setComment('');
        setItemSearch('');
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleAddItem = (item, proportionName = null) => {
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
                i.key === key
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            ));
        } else {
            setSelectedItems([...selectedItems, {
                key,
                menu_item_id: item.id,
                name: displayName,
                price: price,
                quantity: 1,
                proportion_name: proportionName
            }]);
        }
    };

    const handleRemoveItem = (key) => {
        const existing = selectedItems.find(i => i.key === key);
        if (existing && existing.quantity > 1) {
            setSelectedItems(selectedItems.map(i =>
                i.key === key
                    ? { ...i, quantity: i.quantity - 1 }
                    : i
            ));
        } else {
            setSelectedItems(selectedItems.filter(i => i.key !== key));
        }
    };

    const handleAddCategory = (category) => {
        const key = `category-${category.category}`;
        const existing = selectedItems.find(i => i.key === key);
        if (existing) {
            setSelectedItems(selectedItems.map(i =>
                i.key === key
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            ));
        } else {
            setSelectedItems([...selectedItems, {
                key,
                isCategory: true,
                category: category.category,
                name: category.category,
                price: category.minPrice, // Use min price for display
                priceDisplay: category.hasPriceRange
                    ? `₹${category.minPrice.toFixed(2)} - ₹${category.maxPrice.toFixed(2)}`
                    : `₹${category.minPrice.toFixed(2)}`,
                quantity: 1
            }]);
        }
    };

    const handleRemoveCategory = (categoryName) => {
        const key = `category-${categoryName}`;
        const existing = selectedItems.find(i => i.key === key);
        if (existing && existing.quantity > 1) {
            setSelectedItems(selectedItems.map(i =>
                i.key === key
                    ? { ...i, quantity: i.quantity - 1 }
                    : i
            ));
        } else {
            setSelectedItems(selectedItems.filter(i => i.key !== key));
        }
    };

    const calculateTotal = () => {
        return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateMaxEndDate = () => {
        if (!startDate) return dayjs().endOf('year');

        // End of current year
        return startDate.endOf('year');
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            setDialogError('Please select at least one item');
            return;
        }

        setSubmitting(true);
        setDialogError('');
        try {
            // Build items array - handle both categories and individual items
            const itemsToSubmit = selectedItems.map(i => {
                if (i.isCategory) {
                    return {
                        category: i.category,
                        quantity: i.quantity
                    };
                } else {
                    return {
                        menu_item_id: i.menu_item_id,
                        quantity: i.quantity,
                        proportion_name: i.proportion_name
                    };
                }
            });

            await createScheduledOrder(
                itemsToSubmit,
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD'),
                comment
            );
            setSuccess('Scheduled order created successfully!');
            handleCloseDialog();
            loadData(); // Refresh orders
        } catch (err) {
            setDialogError(err.response?.data?.message || 'Failed to create scheduled order');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'Confirmed': return 'info';
            case 'Delivered': return 'success';
            case 'Cancelled': return 'error';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule sx={{ fontSize: 32 }} />
                        Scheduled Orders
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenDialog}
                        disabled={schedulableData.categories.length === 0 && schedulableData.items.length === 0}
                    >
                        New Scheduled Order
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

                {/* Constraints Info */}
                {constraints && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Info />
                            <Typography variant="body2">
                                {constraints.note}. You can schedule up to {constraints.maxStartDate}.
                            </Typography>
                        </Box>
                    </Paper>
                )}

                {/* My Scheduled Orders */}
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>My Scheduled Orders</Typography>

                    {myOrders.length === 0 ? (
                        <Typography color="text.secondary">
                            No scheduled orders yet. Create one to get started!
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell><strong>Order ID</strong></TableCell>
                                        <TableCell><strong>Schedule Period</strong></TableCell>
                                        <TableCell><strong>Items</strong></TableCell>
                                        <TableCell><strong>Daily Total</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {myOrders.map((order) => (
                                        <TableRow key={order.id} hover>
                                            <TableCell>#{order.id}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarMonth fontSize="small" />
                                                    {new Date(order.scheduled_for_date).toLocaleDateString('en-IN')}
                                                    {' - '}
                                                    {new Date(order.scheduled_end_date).toLocaleDateString('en-IN')}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {order.items.map((item, idx) => (
                                                    <Box key={idx}>
                                                        {item.name_at_order} x{item.quantity}
                                                    </Box>
                                                ))}
                                            </TableCell>
                                            <TableCell>₹{parseFloat(order.total_price).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={order.status}
                                                    color={getStatusColor(order.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>

                <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>Create Scheduled Order</DialogTitle>
                    <DialogContent>
                        {dialogError && (
                            <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setDialogError('')}>
                                {dialogError}
                            </Alert>
                        )}
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            {/* Date Selection */}
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(date) => {
                                        setStartDate(date);
                                        if (endDate.isBefore(date)) {
                                            setEndDate(date);
                                        }
                                    }}
                                    minDate={dayjs().add(1, 'day')}
                                    maxDate={constraints ? dayjs(constraints.maxStartDate) : dayjs().add(1, 'year')}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={setEndDate}
                                    minDate={startDate}
                                    maxDate={calculateMaxEndDate()}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Grid>

                            {/* Items Selection */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1">
                                        Select Items
                                    </Typography>
                                    <TextField
                                        size="small"
                                        placeholder="Search items..."
                                        value={itemSearch}
                                        onChange={(e) => setItemSearch(e.target.value)}
                                        sx={{ width: 250 }}
                                    />
                                </Box>
                                {/* Render categories as single selectable options */}
                                {schedulableData.categories.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                px: 1,
                                                py: 0.5,
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                borderRadius: 1
                                            }}
                                        >
                                            Daily Specials
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Select a category and the correct item will be delivered based on the day of the week.
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {schedulableData.categories
                                                .filter(cat => cat.category.toLowerCase().includes(itemSearch.toLowerCase()))
                                                .map((category) => {
                                                    const key = `category-${category.category}`;
                                                    const selectedCategory = selectedItems.find(i => i.key === key);
                                                    const quantity = selectedCategory?.quantity || 0;

                                                    return (
                                                        <Grid item xs={12} sm={6} md={4} key={category.category}>
                                                            <Card variant="outlined" sx={{ height: '100%' }}>
                                                                <CardContent>
                                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                                        {category.category}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {category.hasPriceRange
                                                                            ? `₹${category.minPrice.toFixed(2)} - ₹${category.maxPrice.toFixed(2)}`
                                                                            : `₹${category.minPrice.toFixed(2)}`
                                                                        }
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                                        Available: {Object.keys(category.dayMappings).join(', ')}
                                                                    </Typography>
                                                                </CardContent>
                                                                <CardActions sx={{ justifyContent: 'center' }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleRemoveCategory(category.category)}
                                                                        disabled={quantity === 0}
                                                                    >
                                                                        <Remove />
                                                                    </IconButton>
                                                                    <Typography sx={{ minWidth: 30, textAlign: 'center' }}>{quantity}</Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleAddCategory(category)}
                                                                        color="primary"
                                                                    >
                                                                        <Add />
                                                                    </IconButton>
                                                                </CardActions>
                                                            </Card>
                                                        </Grid>
                                                    );
                                                })}
                                        </Grid>
                                    </Box>
                                )}

                                {/* Render individual uncategorized items */}
                                {(() => {
                                    const filteredItems = schedulableData.items.filter(item =>
                                        item.name.toLowerCase().includes(itemSearch.toLowerCase())
                                    );

                                    if (filteredItems.length === 0) return null;

                                    const renderItemCard = (item) => {
                                        const hasProportions = item.proportions && item.proportions.length > 0;
                                        const itemSelections = selectedItems.filter(i => i.menu_item_id === item.id);
                                        const totalQuantity = itemSelections.reduce((sum, i) => sum + i.quantity, 0);

                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                    <CardContent sx={{ pb: 1, flexGrow: 1 }}>
                                                        <Typography variant="subtitle2">
                                                            {item.name}
                                                            {item.day_of_week && (
                                                                <Chip
                                                                    label={item.day_of_week}
                                                                    size="small"
                                                                    sx={{ ml: 1, fontSize: '0.7rem' }}
                                                                />
                                                            )}
                                                        </Typography>
                                                        {hasProportions ? (
                                                            <Box sx={{ mt: 1 }}>
                                                                {item.proportions.map((proportion) => {
                                                                    const key = `${item.id}-${proportion.name}`;
                                                                    const selectedItem = selectedItems.find(i => i.key === key);
                                                                    const quantity = selectedItem?.quantity || 0;

                                                                    return (
                                                                        <Box
                                                                            key={key}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                py: 0.5,
                                                                                borderBottom: '1px solid',
                                                                                borderColor: 'divider'
                                                                            }}
                                                                        >
                                                                            <Box>
                                                                                <Typography variant="body2">{proportion.name}</Typography>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    ₹{parseFloat(proportion.price).toFixed(2)}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleRemoveItem(key)}
                                                                                    disabled={quantity === 0}
                                                                                >
                                                                                    <Remove fontSize="small" />
                                                                                </IconButton>
                                                                                <Typography sx={{ minWidth: 20, textAlign: 'center' }}>{quantity}</Typography>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleAddItem(item, proportion.name)}
                                                                                    color="primary"
                                                                                >
                                                                                    <Add fontSize="small" />
                                                                                </IconButton>
                                                                            </Box>
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>
                                                        ) : (
                                                            <>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    ₹{parseFloat(item.price).toFixed(2)}
                                                                </Typography>
                                                                <CardActions sx={{ justifyContent: 'center', px: 0, mt: 1 }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleRemoveItem(`${item.id}-default`)}
                                                                        disabled={totalQuantity === 0}
                                                                    >
                                                                        <Remove />
                                                                    </IconButton>
                                                                    <Typography sx={{ minWidth: 30, textAlign: 'center' }}>{totalQuantity}</Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleAddItem(item)}
                                                                        color="primary"
                                                                    >
                                                                        <Add />
                                                                    </IconButton>
                                                                </CardActions>
                                                            </>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    };

                                    return (
                                        <Box sx={{ width: '100%' }}>
                                            {schedulableData.categories.length > 0 && (
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        mb: 1,
                                                        px: 1,
                                                        py: 0.5,
                                                        bgcolor: 'grey.600',
                                                        color: 'white',
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    Other Items
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                Items with a day tag (e.g., "Monday") are only delivered on that day. Items without a tag are delivered every working day.
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {filteredItems.map(renderItemCard)}
                                            </Grid>
                                        </Box>
                                    );
                                })()}
                            </Grid>

                            {/* Comment */}
                            <Grid item xs={12}>
                                <TextField
                                    label="Comment (optional)"
                                    multiline
                                    rows={2}
                                    fullWidth
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </Grid>

                            {/* Selected Items Summary */}
                            {selectedItems.length > 0 && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                        <Typography variant="subtitle2" gutterBottom>Order Summary (per day)</Typography>
                                        {selectedItems.map((item, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">{item.name} x{item.quantity}</Typography>
                                                <Typography variant="body2">₹{(item.price * item.quantity).toFixed(2)}</Typography>
                                            </Box>
                                        ))}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                            <Typography variant="subtitle2">Daily Total</Typography>
                                            <Typography variant="subtitle2">₹{calculateTotal().toFixed(2)}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={submitting || selectedItems.length === 0}
                        >
                            {submitting ? <CircularProgress size={24} /> : 'Create Schedule'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </LocalizationProvider>
    );
};

export default ScheduledOrdersPage;
