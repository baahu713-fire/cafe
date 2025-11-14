require('dotenv').config();
const db = require('../src/config/database');
const fs = require('fs').promises;
const path = require('path');

const uploadUserPhoto = async (userId, filePath) => {
  let client;
  try {
    console.log(`Reading photo from: ${filePath}`);
    
    const absoluteFilePath = path.resolve(filePath);
    
    try {
      await fs.access(absoluteFilePath);
    } catch (e) {
      console.error(`Error: The file at ${absoluteFilePath} does not exist.`);
      return;
    }

    const photoBuffer = await fs.readFile(absoluteFilePath);

    console.log(`Connecting to the database...`);
    client = await db.pool.connect();

    console.log(`Updating photo for user ID: ${userId}`);
    const result = await client.query(
      'UPDATE users SET photo = $1 WHERE id = $2',
      [photoBuffer, userId]
    );

    if (result.rowCount === 0) {
      console.error(`Error: User with ID ${userId} not found.`);
    } else {
      console.log(`Successfully uploaded photo for user ID: ${userId}`);
    }
  } catch (error) {
    console.error('An error occurred during photo upload:', error.message);
  } finally {
    if (client) {
      client.release();
      console.log('Database client released.');
    }
    await db.pool.end();
    console.log('Database pool has been closed.');
  }
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error('Usage: node -r dotenv/config backend/uploadPhoto.js <userId> <filePath>');
    process.exit(1);
  }

  const userId = parseInt(args[0], 10);
  const filePath = args[1];

  if (isNaN(userId)) {
    console.error('Error: Invalid user ID provided. It must be a number.');
    process.exit(1);
  }

  uploadUserPhoto(userId, filePath);
};

main();
