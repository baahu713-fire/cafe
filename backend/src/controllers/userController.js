const userService = require('../services/userService');

const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || '';
        const data = await userService.getUsersWithOrderStats(page, limit, search);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 1000; // A large limit to get all users
        const search = req.query.search || '';
        const data = await userService.getAllUsers(page, limit, search);
        res.json(data.users);
    } catch (error) {
        next(error);
    }
};

const getActiveUsers = async (req, res, next) => {
    try {
        const users = await userService.getActiveUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getAllUsers,
    getActiveUsers
};