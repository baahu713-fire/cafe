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
      'INSERT INTO users (name, username, hashed_password, role, team_id, photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, role, team_id, is_active',
      [name, username, hashedPassword, role, team_id, photoBuffer]
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
  const { rows } = await db.query('SELECT * FROM users WHERE username = $1 AND is_active = TRUE', [username]);

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

const beginUserSession = async ({ userId, sessionId, maxConcurrentSessions }) => {
  const client = await db.pool.connect();
  let oldestSessionId = null;

  try {
    await client.query('BEGIN');

    const { rows: sessions } = await client.query(
      'SELECT session_id, created_at FROM active_sessions WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );

    if (sessions.length >= maxConcurrentSessions) {
      oldestSessionId = sessions[0].session_id;
      await client.query('DELETE FROM active_sessions WHERE session_id = $1', [oldestSessionId]);
    }

    await client.query('INSERT INTO active_sessions (session_id, user_id) VALUES ($1, $2)', [sessionId, userId]);

    await client.query('COMMIT');

    return oldestSessionId;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in beginUserSession transaction:', error);
    throw new Error('Could not begin user session.'); // Re-throw to inform the controller
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
    // Log the error but don't re-throw, as we want to proceed with session destruction.
    console.error('Error in endUserSession transaction:', error);
  } finally {
    client.release();
  }
};


const forgotPassword = async ({ username, registrationKey, newPassword }) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Find the user by username
        const userResult = await client.query('SELECT id FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            throw new Error('User not found.');
        }
        const userId = userResult.rows[0].id;

        // Find the registration key and check if it was used by this user
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

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
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
