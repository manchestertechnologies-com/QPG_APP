import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { config } from '../config';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Subject, User } from '../types';
import { SubscriptionService } from '../services/subscriptionService';
import { MailService, OtpPurpose, validateStrongPassword } from '../services/mailService';
import { loginViaExamprep, newStudentId } from '../services/studentAccountService';

const router = Router();

const VALID_SUBJECTS: Subject[] = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
const VALID_CLASS_LEVELS = ['11', '12', 'dropper'];

function issueToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, subject: user.subject || null },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as any
  );
}

function publicUser(user: User) {
  const base: any = {
    id: user.id,
    email: user.email,
    name: user.name,
    institution: user.institution,
    role: user.role,
  };
  if (user.role === 'student') {
    base.classLevel = user.class_level || null;
    base.phone = user.phone || null;
    base.source = user.source || 'qpg';
    base.examprepLinked = !!user.examprep_id;
  } else {
    base.subject = user.subject;
    base.paperCredits = db.getUserPaperCredits(user.id);
    base.papersCreatedCount = db.getUserPapersCount(user.id);
  }
  return base;
}

function sessionPayload(user: User) {
  return {
    success: true,
    token: issueToken(user),
    user: publicUser(user),
    subscription: user.role === 'student' ? null : SubscriptionService.getStatus(user.id),
  };
}

/**
 * Step 1: Send OTP to the email (teacher or student sign-up, or password reset)
 * Body: { email: string, purpose?: 'SIGNUP' | 'FORGOT_PASSWORD' }
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email, purpose = 'SIGNUP' } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Please provide a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = await db.findUserByEmail(cleanEmail);

  if (purpose === 'SIGNUP' && existingUser && existingUser.password) {
    return res.status(400).json({
      error: 'USER_EXISTS',
      message: 'An account already exists with this email. Please sign in with your password or click Forgot Password.',
    });
  }

  if (purpose === 'FORGOT_PASSWORD' && !existingUser) {
    return res.status(404).json({
      error: 'USER_NOT_FOUND',
      message: 'No registered account found for this email. Please sign up first.',
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await db.saveOtp(cleanEmail, otpCode, 10);

  const mailResult = await MailService.sendOtpEmail(cleanEmail, otpCode, purpose as OtpPurpose);

  return res.json({
    success: true,
    message: mailResult.message,
    purpose,
    devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  });
});

/**
 * Step 2: Verify OTP and create / reset a strong password.
 * Body: { email, otp, password, purpose, role?: 'teacher' | 'student', name?, subject?, institution?,
 *         classLevel?, phone?, ref? }
 */
router.post('/verify-otp-and-set-password', async (req: Request, res: Response) => {
  const {
    email,
    otp,
    password,
    purpose = 'SIGNUP',
    role = 'teacher',
    name,
    subject,
    institution,
    classLevel,
    phone,
    ref,
  } = req.body || {};

  if (!email || !otp || !password) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'Email, OTP, and new password are required.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  const passwordValidation = validateStrongPassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', message: passwordValidation.message });
  }

  const isOtpValid = await db.verifyOtp(cleanEmail, String(otp));
  if (!isOtpValid) {
    return res.status(400).json({
      error: 'INVALID_OTP',
      message: 'Invalid or expired verification code. Please request a new code.',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let user = await db.findUserByEmail(cleanEmail);

  if (purpose === 'FORGOT_PASSWORD') {
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Account not found.' });
    }
    await db.updateUserPassword(user.id, hashedPassword);
    await db.logAudit('PASSWORD_RESET', cleanEmail, { userId: user.id });
  } else if (user) {
    // Existing account without password: a placeholder created by a teacher invite / ExamPrep import,
    // or a legacy teacher row. The OTP proves ownership, so the person claims it now.
    user.password = hashedPassword;
    if (user.role === 'student') {
      if (name && String(name).trim()) user.name = String(name).trim();
      if (classLevel && VALID_CLASS_LEVELS.includes(classLevel)) user.class_level = classLevel;
      if (phone) user.phone = String(phone).trim();
      if (user.source === 'invited') user.source = 'qpg';
    }
    await db.updateUser(user);
    await db.logAudit('ACCOUNT_CLAIMED', cleanEmail, { userId: user.id, role: user.role });
  } else if (role === 'student') {
    const newStudent: User = {
      id: newStudentId(),
      email: cleanEmail,
      password: hashedPassword,
      name: (name && String(name).trim()) || cleanEmail.split('@')[0],
      institution: institution || undefined,
      subject: undefined as unknown as Subject,
      role: 'student',
      source: 'qpg',
      class_level: VALID_CLASS_LEVELS.includes(classLevel) ? classLevel : undefined,
      phone: phone ? String(phone).trim() : undefined,
      created_at: new Date().toISOString(),
    };
    user = await db.createUser(newStudent);
    await db.logAudit('STUDENT_REGISTERED', cleanEmail, { id: user.id });
  } else {
    const userSubject: Subject = subject && VALID_SUBJECTS.includes(subject) ? subject : 'Chemistry';
    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: cleanEmail,
      password: hashedPassword,
      name: name || cleanEmail.split('@')[0],
      institution: institution || 'Academic Science Academy',
      subject: userSubject,
      role: 'teacher',
      source: 'qpg',
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

  return res.json({
    ...sessionPayload(user),
    message:
      purpose === 'FORGOT_PASSWORD'
        ? 'Password reset successfully! You are now logged in.'
        : 'Welcome! Your account and password are created successfully.',
  });
});

/**
 * Step 3: Password login for teachers and students.
 * Body: { email, password, role?: 'teacher' | 'student' }
 * Students may also use their ExamPrep credentials: when QPG has no usable password for the email,
 * the login is verified against ExamPrep and the account is created / linked in QPG's database.
 */
router.post('/login-password', async (req: Request, res: Response) => {
  const { email, password, role } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = await db.findUserByEmail(cleanEmail);

  let isPasswordMatch = false;
  if (user && user.password) {
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isPasswordMatch = await bcrypt.compare(String(password), user.password);
    } else {
      isPasswordMatch = user.password === password;
    }
  }

  if (user && isPasswordMatch) {
    return res.json(sessionPayload(user));
  }

  // Student path: try ExamPrep when the QPG account is missing, unclaimed, or came from ExamPrep.
  const studentLogin = role === 'student' || (user && user.role === 'student');
  if (studentLogin && (!user || !user.password || user.source === 'examprep')) {
    const bridged = await loginViaExamprep(cleanEmail, String(password), user);
    if (bridged.ok) {
      return res.json({ ...sessionPayload(bridged.user), linkedFromExamprep: true });
    }
    if (bridged.error !== 'INVALID_CREDENTIALS' || !user) {
      return res.status(bridged.status).json({
        error: bridged.error,
        message: bridged.message,
        needsFirstTimeOtp: !user || !user.password,
      });
    }
  }

  if (!user) {
    return res.status(401).json({
      error: 'ACCOUNT_NOT_FOUND',
      message: 'No account found with this email. Please sign up for first-time access.',
    });
  }

  if (!user.password) {
    return res.status(401).json({
      error: 'PASSWORD_NOT_SET',
      message: 'You have not created a password yet. Please use First-Time Sign Up to verify your email and set a password.',
      needsFirstTimeOtp: true,
    });
  }

  return res.status(401).json({
    error: 'INVALID_CREDENTIALS',
    message: 'Incorrect password. If you forgot your password, click Forgot Password to receive an email OTP.',
  });
});

/**
 * Backward-compatible OTP verify (teacher accounts)
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, otp, subject, name, institution } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and OTP are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const isValid = await db.verifyOtp(cleanEmail, String(otp));

  if (!isValid) {
    return res.status(400).json({ error: 'INVALID_OTP', message: 'Invalid or expired OTP. Please try again.' });
  }

  let user = await db.findUserByEmail(cleanEmail);

  if (!user) {
    const userSubject: Subject = subject && VALID_SUBJECTS.includes(subject) ? subject : 'Chemistry';

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      institution: institution || 'Educational Institution',
      subject: userSubject,
      role: 'teacher',
      source: 'qpg',
      paper_credits: 0,
      referral_code: 'usr_' + Date.now(),
      created_at: new Date().toISOString(),
    };

    user = await db.createUser(newUser);
  }

  return res.json(sessionPayload(user));
});

/**
 * Profile & Subscription Check
 */
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: publicUser(user),
    subscription: user.role === 'student' ? null : SubscriptionService.getStatus(user.id),
  });
});

/**
 * Student profile update (name, class, phone)
 */
router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, classLevel, phone, institution } = req.body || {};
  if (name !== undefined) {
    const clean = String(name).trim();
    if (clean.length < 2) return res.status(400).json({ error: 'INVALID_NAME', message: 'Name is too short.' });
    user.name = clean.slice(0, 120);
  }
  if (institution !== undefined) user.institution = String(institution).trim().slice(0, 200);
  if (user.role === 'student') {
    if (classLevel !== undefined) user.class_level = VALID_CLASS_LEVELS.includes(classLevel) ? classLevel : undefined;
    if (phone !== undefined) user.phone = String(phone).trim().slice(0, 20) || undefined;
  }
  await db.updateUser(user);
  return res.json({ success: true, user: publicUser(user) });
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
