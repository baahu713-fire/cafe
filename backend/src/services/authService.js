const db = require('../config/database');
const bcrypt = require('bcryptjs');

const registerUser = async (userData) => {
  const { name, username, password, role, team_id, photoBuffer, registrationKey } = userData;

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

    const keyId = keyData.id;
    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      'INSERT INTO users (name, username, hashed_password, team_id, photo) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, role, team_id, is_active, photo_url',
      [name, username, hashedPassword, team_id, photoBuffer]
    );

    const user = userResult.rows[0];

    await client.query(
      'UPDATE registration_keys SET is_used = TRUE, used_at = NOW(), used_by_user_id = $1 WHERE id = $2',
      [user.id, keyId]
    );

    await client.query('COMMIT');

    // Return the user object without the password
    const { hashed_password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const loginUser = async (credentials) => {
  const { username, password } = credentials;
  const { rows } = await db.query(
    'SELECT id, name, username, role, team_id, is_active, hashed_password, photo_url FROM users WHERE username = $1 AND is_active = TRUE',
    [username]
  );

  if (rows.length === 0) {
    throw new Error('Invalid credentials or user not active.');
  }

  const user = rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials or user not active.');
  }

  // Return the user object without the password
  const { hashed_password, ...userWithoutPassword } = user;

  return { user: userWithoutPassword };
};

const beginUserSession = async ({ userId, userRole, sessionId, clientIp }) => {
  const client = await db.pool.connect();
  let oldestSessionId = null;

  try {
    await client.query('BEGIN');

    // Get max concurrent sessions for the user's role
    const permissionsResult = await client.query(
      'SELECT max_concurrent_sessions FROM role_permissions WHERE role = $1',
      [userRole]
    );

    let maxConcurrentSessions = 1; // Default value
    if (permissionsResult.rows.length > 0) {
      maxConcurrentSessions = permissionsResult.rows[0].max_concurrent_sessions;
    } else {
      console.warn(`Role '${userRole}' not found in role_permissions. Defaulting to 1 session.`);
    }

    const { rows: sessions } = await client.query(
      'SELECT session_id, created_at FROM active_sessions WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );

    if (sessions.length >= maxConcurrentSessions) {
      oldestSessionId = sessions[0].session_id;
      await client.query('DELETE FROM active_sessions WHERE session_id = $1', [oldestSessionId]);
    }

    await client.query('INSERT INTO active_sessions (session_id, user_id, client_ip) VALUES ($1, $2, $3)', [sessionId, userId, clientIp]);

    await client.query('COMMIT');

    return oldestSessionId;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in beginUserSession transaction:', error);
    throw new Error('Could not begin user session.');
  } finally {
    client.release();
  }
};


const endUserSession = async (sessionId) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM active_sessions WHERE session_id = $1', [sessionId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in endUserSession transaction:', error);
  } finally {
    client.release();
  }
};


const forgotPassword = async ({ username, registrationKey, newPassword }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found.');
    }
    const userId = userResult.rows[0].id;

    const keyResult = await client.query(
      'SELECT id, used_by_user_id FROM registration_keys WHERE registration_key = $1',
      [registrationKey]
    );

    if (keyResult.rows.length === 0) {
      throw new Error('Invalid registration key.');
    }

    const keyData = keyResult.rows[0];
    if (keyData.used_by_user_id !== userId) {
      throw new Error('This registration key is not associated with this user.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await client.query('UPDATE users SET hashed_password = $1 WHERE id = $2', [hashedPassword, userId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  registerUser,
  loginUser,
  beginUserSession,
  endUserSession,
  forgotPassword
};
