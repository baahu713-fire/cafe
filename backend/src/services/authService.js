const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_for_development';

const registerUser = async (userData) => {
  const { name, username, password, role, team_id, photo_url, registrationKey } = userData;

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const keyResult = await client.query(
      'SELECT id, is_used, team_id FROM registration_keys WHERE registration_key = $1',
      [registrationKey]
    );

    if (keyResult.rows.length === 0) {
      throw new Error('Invalid registration key.');
    }

    const keyData = keyResult.rows[0];

    if (keyData.is_used) {
      throw new Error('This registration key has already been used.');
    }

    if (keyData.team_id !== parseInt(team_id, 10)) {
      throw new Error('This registration key is not valid for the selected team.');
    }

    // --- 2. CONVERT THE WEB PATH TO A FILESYSTEM PATH ---
    // photo_url is '/uploads/filename.png'
    const absolutePath = path.resolve(process.cwd(), photo_url.substring(1));
    // absolutePath is now '/usr/src/app/uploads/filename.png'
    // Read the photo file into a buffer from the correct path
    const photoBuffer = await fs.readFile(absolutePath);

    const keyId = keyData.id;
    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      'INSERT INTO users (name, username, hashed_password, role, team_id, photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, role, team_id, is_active',
      [name, username, hashedPassword, role, team_id, photoBuffer]
    );

    const user = userResult.rows[0];

    await client.query(
      'UPDATE registration_keys SET is_used = TRUE, used_at = NOW(), used_by_user_id = $1 WHERE id = $2',
      [user.id, keyId]
    );

    await client.query('COMMIT');
    
    // Clean up the uploaded file
    await fs.unlink(photo_url);

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, teamId: user.team_id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { hashed_password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const loginUser = async (credentials) => {
  const { username, password } = credentials;
  const { rows } = await db.query('SELECT * FROM users WHERE username = $1 AND is_active = TRUE', [username]);

  if (rows.length === 0) {
    throw new Error('Invalid credentials or user not active.');
  }

  const user = rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials or user not active.');
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role, teamId: user.team_id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const { hashed_password, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

module.exports = {
  registerUser,
  loginUser,
};