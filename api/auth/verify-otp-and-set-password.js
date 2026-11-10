// Vercel Serverless Function: Verify OTP & Set Strong Password
const app = require('../../backend/dist/server').default || require('../../backend/dist/server');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  req.url = '/api/auth/verify-otp-and-set-password';
  return app(req, res);
};
