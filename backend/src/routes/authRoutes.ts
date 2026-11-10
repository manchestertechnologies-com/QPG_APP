import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { config } from '../config';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Subject, User } from '../types';
import { SubscriptionService } from '../services/subscriptionService';
import { MailService, OtpPurpose, validateStrongPassword } from '../services/mailService';

const router = Router();

/**
 * Step 1: Send OTP to teacher's email with customized templates
 * Body: { email: string, purpose?: 'SIGNUP' | 'FORGOT_PASSWORD' }
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email, purpose = 'SIGNUP' } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Please provide a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = db.getUserByEmail(cleanEmail);

  // If user is trying to sign up for first time, but already has password
  if (purpose === 'SIGNUP' && existingUser && existingUser.password) {
    return res.status(400).json({
      error: 'USER_EXISTS',
      message: 'An account already exists with this email. Please sign in with your password or click Forgot Password.',
    });
  }

  // If user is trying to reset password, but account does not exist
  if (purpose === 'FORGOT_PASSWORD' && !existingUser) {
    return res.status(404).json({
      error: 'USER_NOT_FOUND',
      message: 'No registered faculty account found for this email. Please sign up first.',
    });
  }

  // Generate 6-digit cryptographic OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.saveOtp(cleanEmail, otpCode, 10);

  // Send real email via Gmail SMTP (or fallback log to console if no app password)
  const mailResult = await MailService.sendOtpEmail(cleanEmail, otpCode, purpose as OtpPurpose);

  return res.json({
    success: true,
    message: mailResult.message,
    purpose,
    // Dev OTP fallback during local development
    devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  });
});

/**
 * Step 2: Verify OTP and Create / Reset Strong Password
 * Body: {
 *   email: string,
 *   otp: string,
 *   password: string,
 *   purpose: 'SIGNUP' | 'FORGOT_PASSWORD',
 *   name?: string,
 *   subject?: Subject,
 *   institution?: string,
 *   ref?: string
 * }
 */
router.post('/verify-otp-and-set-password', async (req: Request, res: Response) => {
  const { email, otp, password, purpose = 'SIGNUP', name, subject, institution, ref } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'Email, OTP, and new password are required.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Verify Strong Password Criteria (8-20 chars, Upper, Lower, Number, Special)
  const passwordValidation = validateStrongPassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      error: 'WEAK_PASSWORD',
      message: passwordValidation.message,
    });
  }

  // 2. Verify OTP
  const isOtpValid = db.verifyOtp(cleanEmail, otp);
  if (!isOtpValid) {
    return res.status(400).json({
      error: 'INVALID_OTP',
      message: 'Invalid or expired verification code. Please request a new code.',
    });
  }

  // 3. Hash the strong password securely
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  let user = db.getUserByEmail(cleanEmail);

  if (purpose === 'FORGOT_PASSWORD') {
    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Faculty account not found.',
      });
    }

    // Update password
    await db.updateUserPassword(user.id, hashedPassword);
    await db.logAudit('PASSWORD_RESET', cleanEmail, { userId: user.id });
  } else {
    // Purpose: SIGNUP (First-time user)
    if (user) {
      // User existed without password (e.g. legacy/mock user), set password
      await db.updateUserPassword(user.id, hashedPassword);
    } else {
      // Create new teacher account
      const validSubjects: Subject[] = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
      const userSubject: Subject = subject && validSubjects.includes(subject) ? subject : 'Chemistry';

      const newUser: User = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        email: cleanEmail,
        password: hashedPassword,
        name: name || cleanEmail.split('@')[0],
        institution: institution || 'Academic Science Academy',
        subject: userSubject,
        role: 'teacher',
        paper_credits: 0,
        referral_code: 'usr_' + Date.now(),
        referred_by: ref || undefined,
        created_at: new Date().toISOString(),
      };

      user = await db.createUser(newUser);
      await db.logAudit('USER_REGISTERED', cleanEmail, { subject: user.subject, id: user.id });

      if (ref) {
        await db.creditUserReferral(ref);
      }
    }
  }

  // 4. Generate JWT Token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, subject: user.subject },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as any
  );

  const subscriptionStatus = SubscriptionService.getStatus(user.id);

  return res.json({
    success: true,
    message: purpose === 'FORGOT_PASSWORD'
      ? 'Password reset successfully! You are now logged in.'
      : 'Welcome! Your account and password are created successfully.',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      institution: user.institution,
      subject: user.subject,
      role: user.role,
      paperCredits: db.getUserPaperCredits(user.id),
      papersCreatedCount: db.getUserPapersCount(user.id),
    },
    subscription: subscriptionStatus,
  });
});

/**
 * Step 3: Direct Password Login (For teachers after they have set their password)
 */
router.post('/login-password', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);

  if (!user) {
    return res.status(401).json({
      error: 'ACCOUNT_NOT_FOUND',
      message: 'No account found with this email. Please sign up for first-time access.',
    });
  }

  // If user has not yet set a password, prompt them to use first-time OTP
  if (!user.password) {
    return res.status(401).json({
      error: 'PASSWORD_NOT_SET',
      message: 'You have not created a password yet. Please use First-Time Sign Up to verify your email and set a password.',
      needsFirstTimeOtp: true,
    });
  }

  // Support both bcrypt hashes and legacy plaintext demo accounts
  let isPasswordMatch = false;
  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    isPasswordMatch = await bcrypt.compare(password, user.password);
  } else {
    isPasswordMatch = user.password === password;
  }

  if (!isPasswordMatch) {
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Incorrect password. If you forgot your password, click Forgot Password to receive an email OTP.',
    });
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
      paperCredits: db.getUserPaperCredits(user.id),
      papersCreatedCount: db.getUserPapersCount(user.id),
    },
    subscription: subscriptionStatus,
  });
});

/**
 * Step 4: Backward-compatible OTP Verify (Optional)
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
    const validSubjects: Subject[] = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
    const userSubject: Subject = subject && validSubjects.includes(subject) ? subject : 'Chemistry';

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      institution: institution || 'Educational Institution',
      subject: userSubject,
      role: 'teacher',
      paper_credits: 0,
      referral_code: 'usr_' + Date.now(),
      created_at: new Date().toISOString(),
    };

    user = await db.createUser(newUser);
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
      paperCredits: db.getUserPaperCredits(user.id),
      papersCreatedCount: db.getUserPapersCount(user.id),
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
      paperCredits: db.getUserPaperCredits(user.id),
      papersCreatedCount: db.getUserPapersCount(user.id),
    },
    subscription,
  });
});

/**
 * Account Deletion
 */
router.delete('/account', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  await db.logAudit('ACCOUNT_DELETED', user.email, { userId: user.id });
  return res.json({ success: true, message: 'Account successfully removed.' });
});

export default router;
