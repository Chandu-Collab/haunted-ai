import { createClient, RedisClientType } from 'redis';

// Use the updated REDIS_URL from the .env file
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Check if we should disable Redis (for production deployments)
const disableRedis = process.env.DISABLE_REDIS === 'true' || redisUrl.includes('59.93.55.218')

// Create a dummy Redis client for production when Redis is disabled
export const redisClient: RedisClientType = disableRedis 
  ? createClient({ url: 'redis://localhost:6379' }) // Dummy client
  : createClient({
      url: redisUrl,
      socket: {
        connectTimeout: disableRedis ? 1000 : 5000, // Very fast timeout for disabled Redis
      },
    });

redisClient.on('error', (err: Error) => {
  if (disableRedis) {
    // Silently ignore Redis errors when disabled
    return
  }
  if (redisUrl.includes('59.93.55.218') || !redisUrl.includes('localhost')) {
    console.warn('Production Redis unavailable - running without cache:', err.message);
  } else {
    console.error('Redis Client Error', err);
  }
});

redisClient.on('connect', () => {
  if (!disableRedis) {
    console.log('Redis Client Connected');
  }
});

redisClient.on('ready', () => {
  if (!disableRedis) {
    console.log('Redis Client Ready');
  }
});

redisClient.on('end', () => {
  if (!disableRedis) {
    console.log('Redis Client Connection Ended');
  }
});

export const connectRedis = async (): Promise<void> => {
  if (disableRedis) {
    console.log('Redis disabled - skipping connection');
    return
  }
  
  try {
    if (!redisClient.isOpen) {
      // Add a timeout to the connection attempt
      const timeout = redisUrl.includes('59.93.55.218') || !redisUrl.includes('localhost') ? 3000 : 8000;
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), timeout)
        )
      ]);
      console.log(`Connected to Redis at ${redisUrl}`);
    }
  } catch (error) {
    if (redisUrl.includes('59.93.55.218') || !redisUrl.includes('localhost')) {
      console.warn('Production Redis connection failed - continuing without cache');
    } else {
      console.error('Failed to connect to Redis:', error);
      console.log('Continuing without Redis (caching disabled)');
    }
    // Don't throw the error - continue without Redis
  }
};

export const isRedisConnected = (): boolean => {
  return !disableRedis && redisClient.isOpen;
};
