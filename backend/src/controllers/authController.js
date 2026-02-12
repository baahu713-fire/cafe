const authService = require('../services/authService');
const userService = require('../services/userService');
const imageService = require('../services/imageService');

const register = async (req, res) => {
  try {
    const { name, username, password, team_id, registrationKey, captchaInput } = req.body;

    // --- Input validation ---
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    if (!username || username.length < 5 || username.length > 20) {
      return res.status(400).json({ message: 'Username must be between 5 and 20 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (!registrationKey) {
      return res.status(400).json({ message: 'A valid registration key is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A profile photo is required.' });
    }

    // --- Inline CAPTCHA validation ---
    if (!captchaInput) {
      return res.status(400).json({ message: 'Please enter the CAPTCHA text.' });
    }

    const storedCaptcha = req.session.captchaText;
    if (!storedCaptcha || storedCaptcha.toLowerCase() !== captchaInput.toLowerCase()) {
      return res.status(400).json({ message: 'Invalid CAPTCHA. Please try again.' });
    }
    // Clear after use to prevent replay
    req.session.captchaText = null;

    // --- Upload photo to MinIO ---
    const photo_url = await imageService.uploadImage(req.file.buffer, 'users', req.file.mimetype);

    const clientIp = req.ip;

    // 1. Register the user (DB transaction in the service)
    const { user } = await authService.registerUser({ name, username, password, team_id, photo_url, registrationKey });

    // 2. Begin the user session (DB transaction in the service)
    await authService.beginUserSession({
      userId: user.id,
      userRole: user.role,
      sessionId: req.session.id,
      clientIp: clientIp,
    });

    // 3. Set session data
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
    const clientIp = req.ip; // Get client IP

    // 1. Authenticate the user
    const { user } = await authService.loginUser(req.body);

    // 2. Handle session management (DB transaction in the service)
    const oldestSessionId = await authService.beginUserSession({
      userId: user.id,
      userRole: user.role, // Pass user role
      sessionId: req.session.id,
      clientIp: clientIp, // Pass client IP
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
    // 4. Set session data
    req.session.user = user;

    const unsettled_amount = await userService.getUserUnsettledAmount(user.id);

    res.json({ user: { ...user, unsettled_amount } });
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
    const unsettled_amount = await userService.getUserUnsettledAmount(req.session.user.id);
    res.json({ user: { ...req.session.user, unsettled_amount } });
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
