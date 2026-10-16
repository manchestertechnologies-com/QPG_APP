import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { SubscriptionService } from '../services/subscriptionService';

/**
 * Backend Subscription Enforcement Middleware.
 * Rejects requests if user has no active subscription or if validity has expired.
 */
export function requireActiveSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
  }

  // Admins bypass subscription restrictions
  if (req.user.role === 'admin') {
    return next();
  }

  const subStatus = SubscriptionService.getStatus(req.user.id);
  if (!subStatus.isActive) {
    return res.status(403).json({
      error: 'SUBSCRIPTION_REQUIRED',
      status: subStatus.status,
      message:
        subStatus.status === 'expired'
          ? `Your ₹299 monthly subscription expired on ${subStatus.formattedExpiry}. Please renew to continue accessing the question bank and generating papers.`
          : 'An active ₹299 monthly subscription is required to access the question bank and generate examination papers.',
      details: subStatus,
    });
  }

  next();
}
