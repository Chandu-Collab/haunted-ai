import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Simple JWT authentication middleware. Expects Authorization: Bearer <token>
// Token payload should include { userId: string }
export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    // Not authenticated
    return res.status(401).json({ error: 'Missing Authorization token' });
  }

  const secret = process.env.JWT_SECRET || 'dev-secret';
  try {
    const decoded = jwt.verify(token, secret) as any;
    (req as AuthRequest).userId = decoded?.userId;
    return next();
  } catch (err) {
    console.error('JWT auth error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default authenticateJWT;
