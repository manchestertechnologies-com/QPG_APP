import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db/database';
import { User, UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token is missing. Please sign in.',
    });
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwtSecret) as any;
  } catch (err: any) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Session has expired or is invalid. Please sign in again.',
    });
  }

  // Memory first, then Postgres: on serverless the account may have been created by another instance.
  const user = await db.findUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({
      error: 'USER_NOT_FOUND',
      message: 'Account not found. Please log in again.',
    });
  }

  req.user = user;
  next();
}

/** Allows only the listed roles through (use after authMiddleware). */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({
        error: 'FORBIDDEN_ROLE',
        message:
          roles.length === 1 && roles[0] === 'student'
            ? 'This area is for student accounts.'
            : 'This area is for teacher accounts.',
      });
    }
    next();
  };
}

/**
 * Blocks student tokens from teacher-only route groups (paper generator, question bank,
 * subscriptions) without touching those routers. Requests without a token pass through
 * so each router keeps its own auth behaviour.
 */
export function blockStudentTokens(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret) as any;
      if (decoded && decoded.role === 'student') {
        return res.status(403).json({
          error: 'FORBIDDEN_ROLE',
          message: 'The paper generator is available to teacher accounts only.',
        });
      }
    } catch {
      // invalid token: let the router's own auth respond
    }
  }
  next();
}

export function adminAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Admin authentication required.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin privileges required.' });
    }
    (req as any).user = { email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid admin session token.' });
  }
}
