import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient: RedisClientType = createClient({ url: redisUrl });

redisClient.on('error', (err: Error) => {
  console.error('Redis Client Error', err);
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Connected to Redis');
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Fallback: Log the error and continue without Redis
  }
};
