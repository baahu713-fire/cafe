const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    const { name, username, password, role, team_id, registrationKey } = req.body;

    // A registration key is now mandatory for creating an account.
    if (!registrationKey) {
      return res.status(400).json({ message: 'A valid registration key is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A profile photo is required.' });
    }

    const photo_url = `/uploads/${req.file.filename}`;
    
    // Pass the registration key to the service layer for validation and processing.
    const user = await authService.registerUser({ name, username, password, role, team_id, photo_url, registrationKey });

    res.status(201).json(user);
  } catch (error) {
    // Retain existing error handling for duplicate usernames.
    if (error.code === '23505') { 
      return res.status(409).json({ message: 'This username is already taken.' });
    }
    // Provide a more specific message if the registration key is invalid or already used.
    if (error.message.includes('registration key')) {
        return res.status(403).json({ message: error.message });
    }
    // General server error
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

module.exports = {
  register,
  login,
};
