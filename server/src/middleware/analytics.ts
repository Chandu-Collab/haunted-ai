import { redisClient } from '../utils/redisClient';
import { Request, Response, NextFunction } from 'express';

// Middleware to track API usage
export const analyticsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const route = req.path;
    await redisClient.hIncrBy('api_usage', route, 1);
  } catch (err) {
    // Log but don't block request
    console.error('Analytics middleware error:', err);
  }
  next();
};

// Route handler for analytics dashboard (basic JSON)
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const usage = await redisClient.hGetAll('api_usage');
    res.json({ usage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
