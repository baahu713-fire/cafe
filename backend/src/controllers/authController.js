const authService = require('../services/authService');

const MAX_CONCURRENT_SESSIONS = 1; // Configurable session limit

const register = async (req, res) => {
  try {
    if (!req.session.captchaVerified) {
      return res.status(403).json({ message: 'Please complete the CAPTCHA verification before registering.' });
    }

    const { name, username, password, role, team_id, registrationKey } = req.body;

    if (!registrationKey) {
      return res.status(400).json({ message: 'A valid registration key is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A profile photo is required.' });
    }

    const photoBuffer = req.file.buffer;

    // 1. Register the user (DB transaction in the service)
    const { user } = await authService.registerUser({ name, username, password, role, team_id, photoBuffer, registrationKey });

    // 2. Begin the user session (DB transaction in the service)
    await authService.beginUserSession({
      userId: user.id,
      sessionId: req.session.id,
      maxConcurrentSessions: MAX_CONCURRENT_SESSIONS
    });

    // 3. Set session data and clear captcha flag
    req.session.captchaVerified = false;
    req.session.user = user;

    res.status(201).json({ user });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'This username is already taken.' });
    }
    if (error.message.includes('registration key')) {
        return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'An error occurred during registration. Please try again later.' });
  }
};

const login = async (req, res) => {
  try {
    // 1. Authenticate the user
    const { user } = await authService.loginUser(req.body);

    // 2. Handle session management (DB transaction in the service)
    const oldestSessionId = await authService.beginUserSession({
      userId: user.id,
      sessionId: req.session.id,
      maxConcurrentSessions: MAX_CONCURRENT_SESSIONS
    });

    // 3. If a session was removed, destroy it in the session store
    if (oldestSessionId) {
      req.sessionStore.destroy(oldestSessionId, (err) => {
        if (err) {
          console.error('Error destroying oldest session:', err);
        }
      });
    }

    // 4. Set session data
    req.session.user = user;

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const sessionId = req.session.id;

    // Use the new service function to handle the DB transaction
    await authService.endUserSession(sessionId);

    // Destroy the session in the session store
    req.session.destroy((err) => {
      if (err) {
        // Even if session destruction fails, we proceed to clear the cookie
        console.error('Error destroying session:', err);
      }
      
      // Clear the cookie and send the final response
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully.' });
    });

  } catch (error) {
    // This will catch any unexpected errors during the process
    console.error('An error occurred during logout:', error);
    res.status(500).json({ message: 'An internal error occurred during logout.' });
  }
};

const getMe = async (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

const forgotPassword = async (req, res) => {
    try {
        const { username, registrationKey, newPassword } = req.body;
        await authService.forgotPassword({ username, registrationKey, newPassword });
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword
};
