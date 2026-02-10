import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    Alert,
    Snackbar,
    Tooltip,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme,
    alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WeekendIcon from '@mui/icons-material/Weekend';
import {
    generateYearCalendar,
    getHolidays,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    deleteHolidaysByYear,
} from '../../services/calendarService';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarManagementPage = () => {
    const theme = useTheme();
    const currentYear = new Date().getFullYear();

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-indexed
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [holidayForm, setHolidayForm] = useState({ holiday_date: '', name: '', description: '' });

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Confirmation dialog
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getHolidays(selectedYear);
            setHolidays(data);
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to load holidays', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handleGenerateYear = () => {
        setConfirmDialog({
            open: true,
            title: `Generate Calendar for ${selectedYear}`,
            message: `This will add all Saturdays and Sundays of ${selectedYear} as holidays. Existing holidays won't be duplicated. Continue?`,
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, open: false });
                setGenerating(true);
                try {
                    const result = await generateYearCalendar(selectedYear);
                    setSnackbar({ open: true, message: result.message, severity: 'success' });
                    fetchHolidays();
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to generate calendar', severity: 'error' });
                } finally {
                    setGenerating(false);
                }
            }
        });
    };

    const handleOpenAdd = (date = '') => {
        setEditingHoliday(null);
        setHolidayForm({
            holiday_date: date || '',
            name: '',
            description: ''
        });
        setDialogOpen(true);
    };

    const handleOpenEdit = (holiday) => {
        setEditingHoliday(holiday);
        // Use local date methods to avoid UTC timezone shift
        const hd = new Date(holiday.holiday_date);
        const dateStr = `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, '0')}-${String(hd.getDate()).padStart(2, '0')}`;
        setHolidayForm({
            holiday_date: dateStr,
            name: holiday.name,
            description: holiday.description || ''
        });
        setDialogOpen(true);
    };

    const handleSaveHoliday = async () => {
        try {
            if (editingHoliday) {
                await updateHoliday(editingHoliday.id, holidayForm);
                setSnackbar({ open: true, message: 'Holiday updated', severity: 'success' });
            } else {
                await addHoliday(holidayForm);
                setSnackbar({ open: true, message: 'Holiday added', severity: 'success' });
            }
            setDialogOpen(false);
            fetchHolidays();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to save holiday', severity: 'error' });
        }
    };

    const handleDeleteHoliday = (holiday) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Holiday',
            message: `Delete "${holiday.name}" on ${new Date(holiday.holiday_date).toLocaleDateString('en-GB')}?`,
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, open: false });
                try {
                    await deleteHoliday(holiday.id);
                    setSnackbar({ open: true, message: 'Holiday deleted', severity: 'success' });
                    fetchHolidays();
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete holiday', severity: 'error' });
                }
            }
        });
    };

    const handleClearYear = () => {
        setConfirmDialog({
            open: true,
            title: `Clear All Holidays for ${selectedYear}`,
            message: `This will delete ALL holidays (including weekends and custom holidays) for ${selectedYear}. This cannot be undone. Continue?`,
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, open: false });
                try {
                    await deleteHolidaysByYear(selectedYear);
                    setSnackbar({ open: true, message: `All holidays for ${selectedYear} cleared`, severity: 'success' });
                    fetchHolidays();
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to clear holidays', severity: 'error' });
                }
            }
        });
    };

    // Calendar grid helpers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const getHolidayForDate = (year, month, day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return holidays.find(h => {
            // Use local date methods to avoid UTC timezone shift from toISOString()
            const hd = new Date(h.holiday_date);
            const hDateStr = `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, '0')}-${String(hd.getDate()).padStart(2, '0')}`;
            return hDateStr === dateStr;
        });
    };

    const monthHolidays = holidays.filter(h => {
        const d = new Date(h.holiday_date);
        return d.getMonth() === selectedMonth;
    });

    const totalHolidays = holidays.length;
    const weekendCount = holidays.filter(h => h.is_weekend).length;
    const customHolidayCount = totalHolidays - weekendCount;

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
        const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
        const cells = [];

        // Empty cells before the first day
        for (let i = 0; i < firstDay; i++) {
            cells.push(<Box key={`empty-${i}`} sx={{ p: 1 }} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const holiday = getHolidayForDate(selectedYear, selectedMonth, day);
            const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = new Date().getFullYear() === selectedYear
                && new Date().getMonth() === selectedMonth
                && new Date().getDate() === day;

            cells.push(
                <Tooltip
                    key={day}
                    title={holiday ? `${holiday.name}${holiday.description ? ` – ${holiday.description}` : ''}` : 'Click to add holiday'}
                    arrow
                >
                    <Paper
                        elevation={isToday ? 4 : holiday ? 2 : 0}
                        onClick={() => {
                            if (holiday && !holiday.is_weekend) {
                                handleOpenEdit(holiday);
                            } else if (!holiday) {
                                const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                handleOpenAdd(dateStr);
                            }
                        }}
                        sx={{
                            p: 1,
                            minHeight: 56,
                            cursor: (holiday && holiday.is_weekend) ? 'default' : 'pointer',
                            position: 'relative',
                            borderRadius: 2,
                            border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                            backgroundColor: holiday
                                ? (holiday.is_weekend
                                    ? alpha(theme.palette.warning.main, 0.12)
                                    : alpha(theme.palette.error.main, 0.12))
                                : (isWeekendDay
                                    ? alpha(theme.palette.action.hover, 0.05)
                                    : 'transparent'),
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: theme.shadows[3],
                                backgroundColor: holiday
                                    ? (holiday.is_weekend
                                        ? alpha(theme.palette.warning.main, 0.2)
                                        : alpha(theme.palette.error.main, 0.2))
                                    : alpha(theme.palette.primary.main, 0.08),
                            },
                        }}
                    >
                        <Typography
                            variant="body2"
                            fontWeight={isToday ? 700 : 500}
                            color={
                                holiday
                                    ? (holiday.is_weekend ? 'warning.dark' : 'error.main')
                                    : isWeekendDay ? 'text.secondary' : 'text.primary'
                            }
                        >
                            {day}
                        </Typography>
                        {holiday && (
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    fontSize: '0.6rem',
                                    lineHeight: 1.2,
                                    color: holiday.is_weekend ? 'warning.dark' : 'error.main',
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {holiday.name}
                            </Typography>
                        )}
                    </Paper>
                </Tooltip>
            );
        }

        return cells;
    };

    return (
        <Box>
            {/* Header with controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarMonthIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h5" fontWeight={700}>Holiday Calendar</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={selectedYear}
                            label="Year"
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            {Array.from({ length: 10 }, (_, i) => currentYear - 2 + i).map(y => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutorenewIcon />}
                        onClick={handleGenerateYear}
                        disabled={generating}
                        sx={{ textTransform: 'none' }}
                    >
                        Generate Weekends
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenAdd()}
                        sx={{ textTransform: 'none' }}
                    >
                        Add Holiday
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleClearYear}
                        sx={{ textTransform: 'none' }}
                    >
                        Clear Year
                    </Button>
                </Box>
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', background: alpha(theme.palette.info.main, 0.08) }}>
                        <Typography variant="h4" fontWeight={700} color="info.main">{totalHolidays}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Holidays</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', background: alpha(theme.palette.warning.main, 0.08) }}>
                        <Typography variant="h4" fontWeight={700} color="warning.main">{weekendCount}</Typography>
                        <Typography variant="body2" color="text.secondary">Weekends (Sat/Sun)</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', background: alpha(theme.palette.error.main, 0.08) }}>
                        <Typography variant="h4" fontWeight={700} color="error.main">{customHolidayCount}</Typography>
                        <Typography variant="body2" color="text.secondary">Custom Holidays</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Month Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, gap: 2 }}>
                <IconButton onClick={() => setSelectedMonth(prev => prev > 0 ? prev - 1 : 11)}>
                    <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h6" fontWeight={600} sx={{ minWidth: 150, textAlign: 'center' }}>
                    {MONTH_NAMES[selectedMonth]} {selectedYear}
                </Typography>
                <IconButton onClick={() => setSelectedMonth(prev => prev < 11 ? prev + 1 : 0)}>
                    <ChevronRightIcon />
                </IconButton>
            </Box>

            {/* Calendar Grid */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                    {/* 7-column CSS grid for proper day alignment */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: 0.5,
                    }}>
                        {/* Day headers */}
                        {DAY_NAMES.map(day => (
                            <Box key={day} sx={{ py: 1, textAlign: 'center' }}>
                                <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    color={day === 'Sun' || day === 'Sat' ? 'warning.main' : 'text.secondary'}
                                >
                                    {day}
                                </Typography>
                            </Box>
                        ))}
                        {/* Empty cells for days before the 1st */}
                        {Array.from({ length: getFirstDayOfMonth(selectedYear, selectedMonth) }).map((_, i) => (
                            <Box key={`empty-${i}`} />
                        ))}
                        {/* Day cells */}
                        {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1).map(day => {
                            const holiday = getHolidayForDate(selectedYear, selectedMonth, day);
                            const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
                            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
                            const isToday = new Date().getFullYear() === selectedYear
                                && new Date().getMonth() === selectedMonth
                                && new Date().getDate() === day;

                            return (
                                <Tooltip
                                    key={day}
                                    title={holiday ? `${holiday.name}${holiday.description ? ` – ${holiday.description}` : ''}` : 'Click to add holiday'}
                                    arrow
                                >
                                    <Paper
                                        elevation={isToday ? 4 : holiday ? 2 : 0}
                                        onClick={() => {
                                            if (holiday && !holiday.is_weekend) {
                                                handleOpenEdit(holiday);
                                            } else if (!holiday) {
                                                const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                handleOpenAdd(dateStr);
                                            }
                                        }}
                                        sx={{
                                            p: 1,
                                            minHeight: 64,
                                            cursor: (holiday && holiday.is_weekend) ? 'default' : 'pointer',
                                            borderRadius: 2,
                                            border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                                            borderColor: isToday ? theme.palette.primary.main : 'divider',
                                            backgroundColor: holiday
                                                ? (holiday.is_weekend
                                                    ? alpha(theme.palette.warning.main, 0.12)
                                                    : alpha(theme.palette.error.main, 0.12))
                                                : (isWeekendDay
                                                    ? alpha(theme.palette.action.hover, 0.04)
                                                    : 'background.paper'),
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'scale(1.04)',
                                                boxShadow: theme.shadows[3],
                                                backgroundColor: holiday
                                                    ? (holiday.is_weekend
                                                        ? alpha(theme.palette.warning.main, 0.2)
                                                        : alpha(theme.palette.error.main, 0.2))
                                                    : alpha(theme.palette.primary.main, 0.08),
                                            },
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            fontWeight={isToday ? 700 : 500}
                                            color={
                                                holiday
                                                    ? (holiday.is_weekend ? 'warning.dark' : 'error.main')
                                                    : isWeekendDay ? 'text.secondary' : 'text.primary'
                                            }
                                        >
                                            {day}
                                        </Typography>
                                        {holiday && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: 'block',
                                                    fontSize: '0.6rem',
                                                    lineHeight: 1.2,
                                                    mt: 0.25,
                                                    color: holiday.is_weekend ? 'warning.dark' : 'error.main',
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {holiday.name}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Tooltip>
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                    icon={<WeekendIcon />}
                    label="Weekend"
                    size="small"
                    sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.12), color: 'warning.dark' }}
                />
                <Chip
                    icon={<EventBusyIcon />}
                    label="Custom Holiday"
                    size="small"
                    sx={{ backgroundColor: alpha(theme.palette.error.main, 0.12), color: 'error.main' }}
                />
            </Box>

            {/* Holidays Table for Current Month */}
            {monthHolidays.length > 0 && (
                <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {MONTH_NAMES[selectedMonth]} Holidays ({monthHolidays.length})
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {monthHolidays
                                    .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
                                    .map((holiday) => (
                                        <TableRow key={holiday.id} hover>
                                            <TableCell>
                                                {new Date(holiday.holiday_date).toLocaleDateString('en-GB', {
                                                    weekday: 'short', day: '2-digit', month: 'short'
                                                })}
                                            </TableCell>
                                            <TableCell fontWeight={600}>{holiday.name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={holiday.is_weekend ? 'Weekend' : 'Holiday'}
                                                    size="small"
                                                    color={holiday.is_weekend ? 'warning' : 'error'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{holiday.description || '—'}</TableCell>
                                            <TableCell align="right">
                                                {!holiday.is_weekend && (
                                                    <>
                                                        <IconButton size="small" onClick={() => handleOpenEdit(holiday)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleDeleteHoliday(holiday)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                                {holiday.is_weekend && (
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteHoliday(holiday)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Add/Edit Holiday Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Date"
                            type="date"
                            value={holidayForm.holiday_date}
                            onChange={(e) => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Holiday Name"
                            value={holidayForm.name}
                            onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                            fullWidth
                            required
                            placeholder="e.g., Republic Day, Diwali"
                        />
                        <TextField
                            label="Description (optional)"
                            value={holidayForm.description}
                            onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveHoliday}
                        disabled={!holidayForm.holiday_date || !holidayForm.name}
                    >
                        {editingHoliday ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
                    <Button variant="contained" onClick={confirmDialog.onConfirm}>Confirm</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CalendarManagementPage;
