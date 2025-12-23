const authService = require('../services/authService');

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
    
    const user = await authService.registerUser({ name, username, password, role, team_id, photoBuffer, registrationKey });

    req.session.captchaVerified = false;

    res.status(201).json(user);
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
    const { token, user } = await authService.loginUser(req.body);
    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ message: error.message });
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
  forgotPassword
};
