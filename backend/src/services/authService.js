const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_for_development';

const registerUser = async (userData) => {
  const { email, password, role, team_id } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);

  const { rows } = await db.query(
    'INSERT INTO users (email, hashed_password, role, team_id) VALUES ($1, $2, $3, $4) RETURNING id, email, role, team_id, is_active',
    [email, hashedPassword, role, team_id]
  );
  
  const user = rows[0];
  
  const token = jwt.sign(
    { userId: user.id, role: user.role, teamId: user.team_id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Omit password from the returned user object
  const { hashed_password, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

const loginUser = async (credentials) => {
  const { email, password } = credentials;
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email]);

  if (rows.length === 0) {
    throw new Error('Invalid credentials or user not active.');
  }

  const user = rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials or user not active.');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, teamId: user.team_id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Omit password from the returned user object
  const { hashed_password, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

module.exports = {
  registerUser,
  loginUser,
};
