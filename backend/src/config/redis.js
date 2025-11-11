const { createClient } = require('redis');
const fs = require('fs');
require('dotenv').config();

let client = null;
let isConnected = false;
let connectionPromise = null;

const connectToRedis = async () => {
  if (isConnected && client) {
    return client;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise(async (resolve, reject) => {
    let redisConfig = {};
    const inProduction = fs.existsSync('/run/secrets/redis_user');

    if (inProduction) {
      console.log('Running in production. Connecting to Redis using REDIS_URL.');
      if (!process.env.REDIS_URL) {
        console.warn('REDIS_URL is not defined in production. Skipping Redis connection.');
        return resolve(null);
      }
      redisConfig.url = process.env.REDIS_URL;
    } else {
      console.log('Running in development. Connecting to Redis using credentials from .env file.');
      if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
        console.warn('Redis connection details are not fully specified in .env. Skipping Redis connection.');
        return resolve(null);
      }
      redisConfig = {
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
        },
      };
    }

    const newClient = createClient(redisConfig);

    newClient.on('connect', () => console.log('Connecting to Redis...'));
    newClient.on('ready', () => {
      console.log('Successfully connected to Redis!');
      client = newClient;
      isConnected = true;
      resolve(client);
    });

    newClient.on('error', (err) => {
      console.error(`Redis Client Error: ${err.message}.`);
      isConnected = false;
      client = null;
      // Do not reject the promise here, allow the app to run without redis
    });

    newClient.on('end', () => {
      console.log('Redis connection closed. Will attempt to reconnect...');
      isConnected = false;
      client = null;
      connectionPromise = null;
    });

    try {
      await newClient.connect();
    } catch (err) {
      console.error(`Failed to connect to Redis: ${err.message}`);
      isConnected = false;
      client = null;
      // Resolve with null to allow app to start without redis
      resolve(null);
    }
  });

  return connectionPromise;
};

const getRedisClient = async () => {
  if (!client || !isConnected) {
    return await connectToRedis();
  }
  return client;
};

const disconnectFromRedis = async () => {
  if (client && isConnected) {
    await client.quit();
  }
};

module.exports = { getRedisClient, disconnectFromRedis };
