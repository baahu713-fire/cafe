const { Pool } = require('pg');
const fs = require('fs');

// This function reads a secret from the file path where Docker mounts it.
const readSecret = (secretName) => {
  try {
    return fs.readFileSync(`/run/secrets/${secretName}`, 'utf8').trim();
  } catch (err) {
    console.error(`Error reading secret: ${secretName}`, err);
    return null;
  }
};

let pool;

// Check if running in a Docker environment with secrets.
// This makes the code flexible for both development and production.
if (fs.existsSync('/run/secrets/db_user')) {
  console.log('Running in production mode. Using Docker secrets for DB connection.');
  const dbUser = readSecret('db_user');
  const dbPassword = readSecret('db_password');
  const dbName = readSecret('db_name');

  if (!dbUser || !dbPassword || !dbName) {
    throw new Error('One or more database secrets are missing or could not be read.');
  }

  // Construct the connection string to connect to the database on the Docker host.
  const connectionString = `postgres://${dbUser}:${dbPassword}@host.docker.internal:5432/${dbName}`;

  pool = new Pool({
    connectionString: connectionString,
  });

} else {
  // Fallback for local development using the .env file.
  console.log('Running in development mode. Using DATABASE_URL from .env file.');
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set for development mode.');
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // The SSL requirement might only be for remote connections like Supabase.
    // If your local dev setup uses a local Postgres, you might remove this.
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};
