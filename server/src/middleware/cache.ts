import { redisClient } from '../utils/redisClient';
import { Request, Response, NextFunction } from 'express';

export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
      redisClient.setEx(key, 60, JSON.stringify(body)); // cache for 60s
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };
  } catch (err) {
    // Log but don't block request
    console.error('Cache middleware error:', err);
  }
  next();
};
