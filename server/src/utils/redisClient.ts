import { createClient } from 'redis';

<<<<<<< HEAD
const redisUrl = process.env.REDIS_URL || 'redis://your-production-redis-url';
=======
const redisUrl = process.env.REDIS_URL || 'redis://aws-1-ap-southeast-1.pooler.supabase.com:6379';
>>>>>>> 9f3ad827bca1c955814909ac2968f6ff2a3cd068

export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis');
  }
};
