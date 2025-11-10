const { createClient } = require('redis');
// require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// Create a single, reusable Redis client instance
const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

// Handle connection errors
client.on('error', err => console.error('Redis Client Error:', err));

// Connect to Redis
(async () => {
  try {
    await client.connect();
    console.log('Successfully connected to Redis Cloud!');
  } catch (err) {
    console.error('Failed to connect to Redis Cloud:', err);
  }
})();

module.exports = client;
