// Vercel Serverless Function: Send Email OTP
const app = require('../../backend/dist/server').default || require('../../backend/dist/server');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  req.url = '/api/auth/send-otp';
  return app(req, res);
};
