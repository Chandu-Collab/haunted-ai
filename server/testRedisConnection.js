const { createClient } = require('redis');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env file
const envPath = path.resolve(__dirname, './.env');
dotenv.config({ path: envPath });

const redisUrl = process.env.REDIS_URL;
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis successfully!');
    await redisClient.quit();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();