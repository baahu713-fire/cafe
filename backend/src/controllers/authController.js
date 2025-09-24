const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    const { email, password, role, team_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'A profile photo is required.' });
    }

    const photo_url = `/uploads/${req.file.filename}`;
    const user = await authService.registerUser({ email, password, role, team_id, photo_url });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === '23505') { 
      return res.status(409).json({ message: 'Email already in use.' });
    }
    res.status(500).json({ message: error.message });
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
