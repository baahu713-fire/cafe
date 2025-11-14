
// Load environment variables from .env file
require('dotenv').config({ path: __dirname + '/../.env' });

const crypto = require('crypto');
const { pool } = require('../src/config/database');

const generateKeys = async (teamName, count) => {
    if (!teamName || !count) {
        console.error('\n[ERROR] Usage: node backend/scripts/generate_keys.js <team_name> <number_of_keys>');
        console.error('Both team name and number of keys are required.');
        pool.end();
        return;
    }

    const numCount = parseInt(count, 10);
    if (isNaN(numCount) || numCount <= 0) {
        console.error('\n[ERROR] Please provide a valid positive number for the quantity of keys.');
        pool.end();
        return;
    }

    const client = await pool.connect();
    try {
        // First, validate that the team exists
        const teamResult = await client.query('SELECT id FROM teams WHERE name = $1', [teamName]);
        if (teamResult.rows.length === 0) {
            console.error(`\n[ERROR] No team found with name "${teamName}". Please check the team name and try again.`);
            client.release();
            pool.end();
            return;
        }
        const teamId = teamResult.rows[0].id;

        const generatedKeys = [];
        for (let i = 0; i < numCount; i++) {
            const key = crypto.randomBytes(8).toString('hex');
            generatedKeys.push(key);
        }

        console.log(`\nAttempting to generate ${numCount} key(s) for team "${teamName}"...`);
        await client.query('BEGIN');
        
        for (const key of generatedKeys) {
            const insertQuery = 'INSERT INTO registration_keys (registration_key, team_id) VALUES ($1, $2)';
            await client.query(insertQuery, [key, teamId]);
        }
        
        await client.query('COMMIT');

        console.log('\n----------------------------------------------------');
        console.log(`Successfully generated and stored ${numCount} new registration key(s) for team "${teamName}":`);
        generatedKeys.forEach(key => console.log(key));
        console.log('----------------------------------------------------\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n[ERROR] Could not generate registration keys.');
        if (error.code === '23505') { // Unique violation
            console.error('A generated key already exists in the database. Please try running the script again.');
        } else {
            console.error(error);
        }
    } finally {
        client.release();
        pool.end();
    }
};

// Get arguments from the command line
const teamName = process.argv[2];
const count = process.argv[3];

generateKeys(teamName, count);
