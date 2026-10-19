import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { SubscriptionService } from '../services/subscriptionService';
import { db } from '../db/database';

/**
 * Backend Subscription Enforcement with ChatGPT-style Free Trial.
 * Allows 1 FREE examination paper creation for trial educators.
 * For paper #2 and beyond, requires an active ₹299 monthly subscription.
 */
export function requireSubscriptionOrFreeTrial(
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
  if (subStatus.isActive) {
    return next();
  }

  // ChatGPT-style Freemium: 1 free paper per educator
  const papersCount = db.getUserPapersCount(req.user.id);
  if (papersCount < 1) {
    return next();
  }

  return res.status(403).json({
    error: 'TRIAL_LIMIT_REACHED',
    status: subStatus.status,
    papersCreatedCount: papersCount,
    message: 'Free Trial Complete: You have generated your 1 free examination paper! Upgrade to QPG Educator Pro for ₹299/month to generate unlimited papers.',
    details: subStatus,
  });
}

/**
 * Strict subscription check for endpoints that require active Pro status
 */
export function requireActiveSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
  }

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
          ? `Your ₹299 monthly subscription expired on ${subStatus.formattedExpiry}. Please renew to continue accessing the pro question bank and generating papers.`
          : 'An active ₹299 monthly subscription is required for this action.',
      details: subStatus,
    });
  }

  next();
}
