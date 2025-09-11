const teamService = require('../services/teamService');

const getAllTeams = async (req, res) => {
  try {
    const teams = await teamService.getAllTeams();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeamById = async (req, res) => {
  try {
    const team = await teamService.getTeamById(req.params.id);
    res.json(team);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const createTeam = async (req, res) => {
  try {
    const newTeam = await teamService.createTeam(req.body);
    res.status(201).json(newTeam);
  } catch (error) {
    if (error.code === '23505') { // Handle unique name constraint if added
      return res.status(409).json({ message: 'Team name already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateTeam = async (req, res) => {
  try {
    const updatedTeam = await teamService.updateTeam(req.params.id, req.body);
    res.json(updatedTeam);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    await teamService.deleteTeam(req.params.id);
    res.status(204).send(); // No content
  } catch (error) {
    if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ message: 'Cannot delete team. It is still associated with active users.' });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
};
