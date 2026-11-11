// Vercel Serverless Function: Verify OTP & Set Strong Password (api/auth/verify-otp-and-set-password.js)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

global.__mtech_otps = global.__mtech_otps || {};
global.__mtech_users = global.__mtech_users || {};

const JWT_SECRET = process.env.JWT_SECRET || 'mtech_qpg_secure_jwt_2026';

function validateStrongPassword(password) {
  if (!password || password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters long.' };
  if (password.length > 20) return { isValid: false, message: 'Password must not exceed 20 characters.' };
  if (!/[A-Z]/.test(password)) return { isValid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  if (!/[a-z]/.test(password)) return { isValid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  if (!/\d/.test(password)) return { isValid: false, message: 'Password must contain at least one number (0-9).' };
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`\\/]/.test(password)) return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
  return { isValid: true, message: 'Strong password verified.' };
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  const email = (body.email || '').trim().toLowerCase();
  const otp = (body.otp || '').trim();
  const password = body.password || '';
  const purpose = body.purpose || 'SIGNUP';
  const name = body.name || email.split('@')[0];
  const subject = body.subject || 'Chemistry';
  const verificationHash = body.verificationHash;
  const expiresAt = body.expiresAt;

  if (!email || !otp || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email, OTP, and password are required.' });
  }

  const val = validateStrongPassword(password);
  if (!val.isValid) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', message: val.message });
  }

  let isOtpValid = false;

  const stored = global.__mtech_otps[email];
  if (stored && stored.code === otp && Date.now() <= stored.expiresAt) {
    isOtpValid = true;
    delete global.__mtech_otps[email];
  }

  if (!isOtpValid && verificationHash && expiresAt) {
    const tokenPayload = `${email}:${otp}:${expiresAt}:${purpose}`;
    const expectedHash = crypto.createHmac('sha256', JWT_SECRET).update(tokenPayload).digest('hex');
    if (expectedHash === verificationHash && Date.now() <= Number(expiresAt)) {
      isOtpValid = true;
    }
  }

  if (!isOtpValid) {
    return res.status(400).json({ error: 'INVALID_OTP', message: 'Invalid or expired OTP code. Please request a new code.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const existing = global.__mtech_users[email] || {};
  const user = {
    id: existing.id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    email,
    passwordHash,
    name: name || existing.name || 'Faculty Member',
    institution: existing.institution || 'Manchester Technologies',
    subject,
    role: 'teacher',
    paperCredits: existing.paperCredits !== undefined ? existing.paperCredits : 10,
    papersCreatedCount: existing.papersCreatedCount || 0,
    updatedAt: new Date().toISOString(),
  };

  global.__mtech_users[email] = user;

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, subject: user.subject },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const subscription = {
    isActive: true,
    status: 'active',
    plan: 'Pro Faculty Pass',
    amount: 299,
    daysRemaining: 30,
  };

  return res.json({
    success: true,
    message: purpose === 'SIGNUP' ? 'Faculty account verified & password created!' : 'Password reset successfully!',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      institution: user.institution,
      subject: user.subject,
      role: user.role,
      paperCredits: user.paperCredits,
      papersCreatedCount: user.papersCreatedCount,
    },
    subscription,
  });
};
