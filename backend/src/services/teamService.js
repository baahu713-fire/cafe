const db = require('../config/database');

// Service to get all teams
const getAllTeams = async () => {
  const { rows } = await db.query('SELECT * FROM teams ORDER BY name');
  return rows;
};

// Service to get a single team by its ID
const getTeamById = async (teamId) => {
  const { rows } = await db.query('SELECT * FROM teams WHERE id = $1', [teamId]);
  if (rows.length === 0) {
    throw new Error('Team not found');
  }
  return rows[0];
};

// Service to create a new team
const createTeam = async (teamData) => {
  const { name } = teamData;
  const { rows } = await db.query(
    'INSERT INTO teams (name) VALUES ($1) RETURNING *',
    [name]
  );
  return rows[0];
};

// Service to update an existing team
const updateTeam = async (teamId, teamData) => {
  const { name } = teamData;
  const { rows } = await db.query(
    'UPDATE teams SET name = $1, activated_from = NOW() WHERE id = $2 RETURNING *',
    [name, teamId]
  );
  if (rows.length === 0) {
    throw new Error('Team not found');
  }
  return rows[0];
};

// Service to delete a team
// Note: This will fail if any users are still assigned to this team due to foreign key constraints.
// A more robust implementation might reassign users or prevent deletion if the team is not empty.
const deleteTeam = async (teamId) => {
  const result = await db.query('DELETE FROM teams WHERE id = $1', [teamId]);
  if (result.rowCount === 0) {
    throw new Error('Team not found');
  }
  // No rows to return on delete, but we can confirm deletion via rowCount
  return { message: 'Team deleted successfully.' };
};


module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
};
