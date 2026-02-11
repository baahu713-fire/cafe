const db = require('../config/database');
const ORDER_STATUS = require('../constants/orderStatus');
const bcrypt = require('bcryptjs');

const buildQuery = (baseQuery, page, limit, search, searchFields, isOrderQuery = false) => {
    const offset = (page - 1) * limit;
    const params = [];
    const whereClauses = [];

    if (isOrderQuery) {
        whereClauses.push('o.status = $1');
        params.push(ORDER_STATUS.DELIVERED);
    }

    if (search && searchFields.length > 0) {
        const searchClauses = searchFields.map(field => {
            params.push(`%${search}%`);
            return `${field} ILIKE $${params.length}`;
        });
        whereClauses.push(`(${searchClauses.join(' OR ')})`);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalQuery = `SELECT COUNT(*) FROM ${isOrderQuery ? 'users u JOIN orders o ON u.id = o.user_id' : 'users'} ${whereString}`;

    params.push(limit, offset);
    const limitOffsetString = `LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const mainQuery = `${baseQuery} ${whereString} ${isOrderQuery ? 'GROUP BY u.id' : ''} ORDER BY created_at DESC ${limitOffsetString}`;

    return { totalQuery, mainQuery, params };
};

const getAllUsers = async (page, limit, search = '') => {
    const baseQuery = 'SELECT id, username, role, created_at, is_active FROM users';
    const { totalQuery, mainQuery, params } = buildQuery(baseQuery, page, limit, search, ['username']);

    const totalResult = await db.query(totalQuery, params.slice(0, params.length - 2));
    const total = parseInt(totalResult.rows[0].count, 10);

    const { rows: users } = await db.query(mainQuery, params);

    return { users, total };
};

const getAllUsersForSuperAdmin = async (search = '') => {
    let query = 'SELECT u.id, u.name, u.username, u.role, u.is_active, u.photo_url, t.name as team_name FROM users u LEFT JOIN teams t ON u.team_id = t.id';
    const params = [];

    if (search) {
        query += ' WHERE u.name ILIKE $1 OR u.username ILIKE $1 OR t.name ILIKE $1';
        params.push(`%${search}%`);
    }

    query += ' ORDER BY u.created_at DESC';

    const { rows } = await db.query(query, params);
    return rows;
};

const getUsersWithOrderStats = async (page, limit, search = '') => {
    const baseQuery = `
        SELECT
            u.id,
            u.username,
            u.role,
            u.created_at,
            COUNT(o.id) AS order_count,
            SUM(o.total_price) AS total_order_price
        FROM users u
        JOIN orders o ON u.id = o.user_id
    `;

    const { totalQuery, mainQuery, params } = buildQuery(baseQuery, page, limit, search, ['u.username'], true);

    const totalResult = await db.query(totalQuery, params.slice(0, params.length - 2));
    const total = parseInt(totalResult.rows[0].count, 10);

    const { rows: users } = await db.query(mainQuery, params);

    return { users, total };
};

const getActiveUsers = async () => {
    const { rows } = await db.query('SELECT u.id, u.username, u.role, t.name as team_name FROM users u LEFT JOIN teams t ON u.team_id = t.id WHERE u.is_active = TRUE ORDER BY u.username ASC');
    return rows;
};

const getUserPhotoUrl = async (userId) => {
    const result = await db.query('SELECT photo_url FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
        return result.rows[0].photo_url;
    }
    return null;
};

const updateUserProfile = async (userId, { name, password, photo_url }) => {
    const setClauses = [];
    const params = [userId];

    if (name) {
        params.push(name);
        setClauses.push(`name = $${params.length}`);
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        params.push(hashedPassword);
        setClauses.push(`hashed_password = $${params.length}`);
    }

    if (photo_url) {
        params.push(photo_url);
        setClauses.push(`photo_url = $${params.length}`);
    }

    if (setClauses.length === 0) {
        throw new Error('No fields to update.');
    }

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $1 RETURNING id, name, username, role, team_id, is_active, photo_url`;

    const { rows: [updatedUser] } = await db.query(query, params);

    if (!updatedUser) {
        throw new Error('User not found.');
    }

    return updatedUser;
};

const updateUserBySuperAdmin = async (userId, { name, photo_url, is_active }) => {
    const setClauses = [];
    const params = [userId];

    if (name) {
        params.push(name);
        setClauses.push(`name = $${params.length}`);
    }

    if (photo_url) {
        params.push(photo_url);
        setClauses.push(`photo_url = $${params.length}`);
    }

    if (is_active !== undefined) {
        params.push(is_active);
        setClauses.push(`is_active = $${params.length}`);
    }

    if (setClauses.length === 0) {
        throw new Error('No fields to update.');
    }

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $1 RETURNING id, name, username, role, is_active, photo_url, (SELECT name FROM teams WHERE id = team_id) as team_name`;

    const { rows: [updatedUser] } = await db.query(query, params);

    if (!updatedUser) {
        throw new Error('User not found.');
    }

    return updatedUser;
};

const changeUserPasswordBySuperAdmin = async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { rows: [updatedUser] } = await db.query(
        'UPDATE users SET hashed_password = $1 WHERE id = $2 RETURNING id, username',
        [hashedPassword, userId]
    );
    if (!updatedUser) {
        throw new Error('User not found.');
    }
    return updatedUser;
};

const getUserProfile = async (userId) => {
    const { rows } = await db.query('SELECT id, name, username, role, team_id, is_active, photo_url FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) {
        throw new Error('User not found');
    }
    return rows[0];
};

const updateUserStatus = async (userId, isActive) => {
    const { rows: [updatedUser] } = await db.query(
        'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, role, is_active',
        [isActive, userId]
    );
    if (!updatedUser) {
        throw new Error('User not found.');
    }
    return updatedUser;
};

const getUserUnsettledAmount = async (userId) => {
    const query = `
        SELECT SUM(total_price) as unsettled_amount 
        FROM orders 
        WHERE user_id = $1 AND status = $2
    `;
    const { rows } = await db.query(query, [userId, ORDER_STATUS.DELIVERED]);
    return parseFloat(rows[0].unsettled_amount || 0);
};

module.exports = {
    getAllUsers,
    getAllUsersForSuperAdmin,
    getUsersWithOrderStats,
    getActiveUsers,
    getUserPhotoUrl,
    updateUserProfile,
    updateUserBySuperAdmin,
    changeUserPasswordBySuperAdmin,
    getUserProfile,
    updateUserStatus,
    getUserUnsettledAmount
};