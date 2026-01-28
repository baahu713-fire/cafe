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
  const dbPort = 6532;

  if (!dbUser || !dbPassword || !dbName) {
    throw new Error('One or more database secrets are missing or could not be read.');
  }

  // Construct the connection string to connect to the database on the Docker host.
  const connectionString = `postgres://${dbUser}:${dbPassword}@host.docker.internal:${dbPort}/${dbName}`;

  pool = new Pool({
    connectionString: connectionString,
    // Connection pool settings to prevent timeout issues
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

} else {
  // Fallback for local development using the .env file.
  console.log('Running in development mode. Using DATABASE_URL from .env file.');
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set for development mode.');
  }

  // Check if connecting to localhost (Docker) or remote (Supabase)
  const isLocalhost = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Only use SSL for remote connections (not localhost/Docker)
    ...(isLocalhost ? {} : { ssl: { rejectUnauthorized: false } }),
    // Connection pool settings to prevent timeout issues
    max: 10, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Timeout after 10 seconds when acquiring connection
    keepAlive: true, // Keep connections alive
    keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10 seconds
  });

  console.log(`Database connection: ${isLocalhost ? 'Local Docker (no SSL)' : 'Remote (SSL enabled)'}`);
}

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};
