import { redisClient, isRedisConnected } from '../utils/redisClient';
import { Request, Response, NextFunction } from 'express';

export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip caching if Redis is not connected
  if (!isRedisConnected()) {
    next();
    return;
  }

  const key = `cache:${req.originalUrl}`;
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.type('application/json').send(cached);
      return;
    }
    // Monkey-patch res.json to cache the result
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (isRedisConnected()) {
        redisClient.setEx(key, 60, JSON.stringify(body)).catch(err => 
          console.error('Cache set error:', err)
        );
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };
  } catch (err) {
    // Log but don't block request
    console.error('Cache middleware error:', err);
  }
  next();
};
