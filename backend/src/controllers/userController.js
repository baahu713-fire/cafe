const userService = require('../services/userService');

const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || '';
        const data = await userService.getUsersWithOrderStats(page, limit, search);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 1000; // A large limit to get all users
        const search = req.query.search || '';
        const data = await userService.getAllUsers(page, limit, search);
        res.json(data.users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch all users.', error: error.message });
    }
};

module.exports = {
    getUsers,
    getAllUsers,
};