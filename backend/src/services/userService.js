const db = require('../config/database');

const getAllUsers = async () => {
    const query = 'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC';
    const { rows } = await db.query(query);
    return rows;
};

module.exports = {
    getAllUsers,
};