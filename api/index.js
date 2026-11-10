// Vercel Serverless Function entry point for Manchester Technologies Exam Architect OS API
const app = require('../backend/dist/server').default || require('../backend/dist/server');

module.exports = (req, res) => {
  // If Vercel rewrote the path and passed the route in query (e.g. req.query['0'] or req.query.path)
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
