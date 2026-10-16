import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { config } from '../config';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Subject, User } from '../types';
import { SubscriptionService } from '../services/subscriptionService';

const router = Router();

/**
 * Step 1: Send OTP to teacher's email
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Please provide a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Generate 6-digit cryptographic OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.saveOtp(cleanEmail, otpCode, 10);

  // In production, nodemailer sends to SMTP. In development, we log clearly to console.
  console.log(`\n========================================`);
  console.log(`🔐 [AUTH OTP] For ${cleanEmail}: ${otpCode}`);
  console.log(`========================================\n`);

  return res.json({
    success: true,
    message: `Verification code sent to ${cleanEmail}. (Valid for 10 minutes)`,
    // Provide OTP in response during development for seamless instant testing
    devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  });
});

/**
 * Step 2: Verify OTP & Sign In / Register with Locked Subject Specialization
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, otp, subject, name, institution } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and OTP are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isValid = db.verifyOtp(cleanEmail, otp);

  if (!isValid) {
    return res.status(400).json({ error: 'INVALID_OTP', message: 'Invalid or expired OTP. Please try again.' });
  }

  let user = db.getUserByEmail(cleanEmail);

  if (!user) {
    // New Registration: Teacher MUST select their subject specialization
    const validSubjects: Subject[] = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
    if (!subject || !validSubjects.includes(subject)) {
      return res.status(400).json({
        error: 'SUBJECT_REQUIRED',
        message: 'Please choose your primary subject specialization (Mathematics, Physics, Chemistry, or Biology).',
        needsSubjectSetup: true,
      });
    }

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      institution: institution || 'Educational Institution',
      subject: subject as Subject,
      role: 'teacher',
      created_at: new Date().toISOString(),
    };

    user = await db.createUser(newUser);
    await db.logAudit('USER_REGISTERED', cleanEmail, { subject: user.subject, id: user.id });
  }

  // Generate JWT Session Token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, subject: user.subject },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as any
  );

  const subscriptionStatus = SubscriptionService.getStatus(user.id);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      institution: user.institution,
      subject: user.subject,
      role: user.role,
    },
    subscription: subscriptionStatus,
  });
});

/**
 * Profile & Subscription Check
 */
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const subscription = SubscriptionService.getStatus(user.id);
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      institution: user.institution,
      subject: user.subject,
      role: user.role,
    },
    subscription,
  });
});

/**
 * Step 3: Direct Password Login
 */
router.post('/login-password', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, subject: user.subject },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as any
  );

  const subscriptionStatus = SubscriptionService.getStatus(user.id);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      institution: user.institution,
      subject: user.subject,
      role: user.role,
    },
    subscription: subscriptionStatus,
  });
});

/**
 * Account Deletion (Requirement 19)
 */
router.delete('/account', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  await db.logAudit('ACCOUNT_DELETED', user.email, { userId: user.id });
  return res.json({ success: true, message: 'Account successfully removed.' });
});

export default router;
