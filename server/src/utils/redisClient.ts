import { createClient, RedisClientType } from 'redis';

// Use the updated REDIS_URL from the .env file
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient: RedisClientType = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 10000, // Increase timeout to 10 seconds
  },
});

redisClient.on('error', (err: Error) => {
  console.error('Redis Client Error', err);
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log(`Connected to Redis at ${redisUrl}`);
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Fallback: Log the error and continue without Redis
  }
};
