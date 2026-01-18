import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://aws-1-ap-southeast-1.pooler.supabase.com:6379';

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
