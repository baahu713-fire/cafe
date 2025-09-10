const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (userData) => {
  const { username, password, email } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
    [username, hashedPassword, email]
  );
  return rows[0];
};

const loginUser = async (credentials) => {
  const { email, password } = credentials;
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    throw new Error('User not found');
  }
  const user = rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }
  const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
  return { token, user };
};

module.exports = {
  registerUser,
  loginUser,
};
