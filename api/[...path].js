// Vercel Serverless Function wildcard catch-all route handler
const app = require('../backend/dist/server').default || require('../backend/dist/server');

module.exports = (req, res) => {
  if (req.query && (req.query.path || req.query['0'])) {
    const sub = req.query.path
      ? (Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path)
      : req.query['0'];
    if (sub && !req.url.startsWith(`/api/${sub}`) && !req.url.startsWith(`/${sub}`)) {
      const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      req.url = `/api/${sub}${qs}`;
    }
  }
  return app(req, res);
};
