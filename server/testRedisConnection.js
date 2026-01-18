const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
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