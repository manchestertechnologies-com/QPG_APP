import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db/database';
import { adminAuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { SubscriptionService } from '../services/subscriptionService';

const router = Router();

/**
 * Admin Login
 */
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (email === config.adminEmail && password === config.adminPassword) {
    const token = jwt.sign(
      { userId: 'admin_root', email: config.adminEmail, role: 'admin' },
      config.jwtSecret,
      { expiresIn: '7d' } as any
    );
    return res.json({ success: true, token, email: config.adminEmail });
  }

  return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid admin email or password.' });
});

// Protect all following routes with adminAuthMiddleware
router.use(adminAuthMiddleware);

/**
 * List all payment verification requests
 */
router.get('/payments', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as any;
  const requests = db.getPaymentRequests(status);
  return res.json({ success: true, requests });
});

/**
 * Approve payment request
 */
router.post('/payments/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const adminEmail = (req as any).user?.email || config.adminEmail;

    const result = await SubscriptionService.approvePayment(id, adminEmail);
    return res.json({
      success: true,
      message: 'Payment approved and 1-month subscription successfully activated.',
      ...result,
    });
  } catch (err: any) {
    console.error('Error approving payment:', err);
    return res.status(400).json({ error: 'APPROVAL_FAILED', message: err.message });
  }
});

/**
 * Reject payment request
 */
router.post('/payments/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const adminEmail = (req as any).user?.email || config.adminEmail;

    const payment = await SubscriptionService.rejectPayment(
      id,
      reason || 'Transaction could not be verified in account statement.',
      adminEmail
    );

    return res.json({
      success: true,
      message: 'Payment request rejected.',
      payment,
    });
  } catch (err: any) {
    console.error('Error rejecting payment:', err);
    return res.status(400).json({ error: 'REJECTION_FAILED', message: err.message });
  }
});

/**
 * View administrative audit logs
 */
router.get('/audit-logs', (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json({ success: true, logs });
});

export default router;
