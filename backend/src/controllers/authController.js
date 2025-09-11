const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    // Ensure team_id is correctly passed from the request, if available
    const { email, password, role, team_id } = req.body;
    const user = await authService.registerUser({ email, password, role, team_id });
    res.status(201).json(user);
  } catch (error) {
    // Check for unique constraint violation (e.g., email already exists)
    if (error.code === '23505') { // PostgreSQL unique violation error code
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
