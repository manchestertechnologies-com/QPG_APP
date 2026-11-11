// Vercel Serverless Function: Send Email OTP (api/auth/send-otp.js)
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Global OTP memory store for warm serverless instances
global.__mtech_otps = global.__mtech_otps || {};

const JWT_SECRET = process.env.JWT_SECRET || 'mtech_qpg_secure_jwt_2026';

function getTransporter() {
  const user = process.env.SMTP_USER || Buffer.from('ZW1haWxvdHBtYW5jaGVzdGVydGVjaG5vbG9naWVzQGdtYWlsLmNvbQ==', 'base64').toString();
  const pass = process.env.SMTP_PASS || Buffer.from('cXByZCBpdW5nIGtqd2IgcXhoeg==', 'base64').toString();

  if (!user || !pass) return null;

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ''),
    },
  });
}

function getEmailHtml(otp, purpose, email) {
  const isSignup = purpose === 'SIGNUP';
  const title = isSignup ? 'Welcome to Manchester Technologies' : 'Account Recovery Verification';
  const subtitle = isSignup
    ? 'Thank you for joining Exam Architect OS. Verify your faculty email to complete your registration and create your secure password.'
    : 'We received a request to reset your Exam Architect OS password. Use the verification code below to authorize the change.';
  const codeLabel = isSignup ? 'Your One-Time Registration Passcode:' : 'Your One-Time Password Reset Code:';
  const note = isSignup
    ? 'After verifying this code, you will be prompted to create your permanent password (8–20 characters with uppercase, lowercase, number, and special character) for future logins.'
    : 'If you did not request this code, your account is safe and you can safely ignore this email. Do not share this OTP with anyone.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 25px 10px; background-color: #0D0D0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F3F4F6; }
    .container { max-width: 520px; margin: 0 auto; background-color: #141414; border: 1px solid rgba(200, 169, 106, 0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1C1914 0%, #121212 100%); padding: 28px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .logo-badge { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: linear-gradient(135deg, #C8A96A, #A68B4F); color: #0D0D0D; font-size: 22px; font-weight: 900; border-radius: 12px; margin-bottom: 10px; text-align: center; }
    .brand-title { color: #FFFFFF; font-size: 18px; font-weight: 800; margin: 0; }
    .brand-subtitle { color: #C8A96A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 4px; }
    .content { padding: 28px 24px; color: #E5E7EB; }
    .hero-title { font-size: 17px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px 0; }
    .hero-text { font-size: 13px; line-height: 1.5; color: #9CA3AF; margin: 0 0 20px 0; }
    .otp-card { background: #0D0D0D; border: 1px solid rgba(200, 169, 106, 0.4); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #D4B87A; margin-bottom: 8px; }
    .otp-code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #C8A96A; }
    .otp-exp { font-size: 11px; color: #6B7280; margin-top: 8px; }
    .note-box { background: rgba(255,255,255,0.03); border-left: 3px solid #C8A96A; padding: 12px 14px; border-radius: 6px; font-size: 12px; line-height: 1.5; color: #9CA3AF; margin-top: 20px; }
    .footer { padding: 18px; text-align: center; font-size: 11px; color: #4B5563; border-top: 1px solid rgba(255,255,255,0.06); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">M</div>
      <div class="brand-title">Manchester Technologies</div>
      <div class="brand-subtitle">Exam Architect OS</div>
    </div>
    <div class="content">
      <div class="hero-title">${title}</div>
      <div class="hero-text">${subtitle}</div>
      <div class="otp-card">
        <div class="otp-label">${codeLabel}</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-exp">Expires in 10 minutes • Single-use verification code</div>
      </div>
      <div class="note-box">${note}</div>
    </div>
    <div class="footer">
      Sent to <strong>${email}</strong> • Manchester Technologies Exam Architect OS
    </div>
  </div>
</body>
</html>
  `;
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
  const purpose = body.purpose || 'SIGNUP';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Please provide a valid email address.' });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  global.__mtech_otps[email] = { code: otpCode, expiresAt, purpose };

  const tokenPayload = `${email}:${otpCode}:${expiresAt}:${purpose}`;
  const verificationHash = crypto.createHmac('sha256', JWT_SECRET).update(tokenPayload).digest('hex');

  const transporter = getTransporter();
  const fromEmail = process.env.EMAIL_FROM || '"Manchester Technologies" <emailotpmanchestertechnologies@gmail.com>';
  const subject = purpose === 'SIGNUP'
    ? `Welcome to Exam Architect OS - Your Verification Code is ${otpCode}`
    : `Password Reset Request - Your Verification Code is ${otpCode}`;

  if (!transporter) {
    console.log(`[SIMULATED DELIVERY] OTP for ${email}: ${otpCode}`);
    return res.json({
      success: true,
      message: `Verification code generated for ${email}.`,
      verificationHash,
      expiresAt,
    });
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject,
      html: getEmailHtml(otpCode, purpose, email),
    });

    console.log(`✅ [MAIL SUCCESS] Delivered ${purpose} OTP to ${email}`);
    return res.json({
      success: true,
      message: `Verification code sent to ${email}.`,
      verificationHash,
      expiresAt,
    });
  } catch (err) {
    console.error(`❌ [MAIL ERROR] ${err.message}`);
    return res.status(500).json({
      error: 'MAIL_DELIVERY_FAILED',
      message: `Failed to dispatch email: ${err.message}`,
    });
  }
};
