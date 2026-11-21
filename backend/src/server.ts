import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import questionsRoutes from './routes/questionsRoutes';
import paperRoutes from './routes/paperRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import adminRoutes from './routes/adminRoutes';
import classroomRoutes from './routes/classroomRoutes';
import studentRoutes from './routes/studentRoutes';
import { blockStudentTokens } from './middleware/authMiddleware';
import { db } from './db/database';
import { classroomStore } from './db/classroomStore';
import { getAdminUiHtml } from './admin/adminUi';

const app = express();

// Middleware
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Wait for the database (Postgres hydration) before serving API requests.
// On serverless cold starts the first request would otherwise see an empty user list.
app.use(async (req, _res, next) => {
  if (req.path !== '/api/health' && req.path !== '/admin') await db.readyPromise;
  next();
});

// Classroom tables are only required by the classroom / student routes, so a problem
// there never takes down login, papers or payments.
app.use(['/api/classrooms', '/classrooms', '/api/student', '/student'], async (_req, res, next) => {
  try {
    await classroomStore.ready();
    next();
  } catch (err: any) {
    console.error('Classroom store not ready:', err.message);
    res.status(503).json({
      error: 'CLASSROOMS_UNAVAILABLE',
      message: 'Classrooms are temporarily unavailable. Please retry in a moment.',
    });
  }
});

// Health Check
app.get('/api/health', async (_req, res) => {
  let classrooms = 'ready';
  try {
    await db.readyPromise;
    await classroomStore.ready();
  } catch {
    classrooms = `error ${classroomStore.lastErrorCode || 'unknown'}`;
  }
  res.json({
    status: 'ONLINE',
    app: 'QPG Question Paper Generator API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    commit: (process.env.RENDER_GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || undefined,
    storage: db.pool ? 'postgres' : 'file',
    classrooms,
    databases: Object.keys(config.databases).length + ' Subjects Connected (8 Supabase Repositories)',
  });
});

// Admin Web Interface (Requirement 13)
app.get('/admin', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getAdminUiHtml());
});

// Mount API Routes (Support both /api/* and /* for local & Vercel serverless)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Teacher-only feature groups refuse student tokens.
app.use(['/api/questions', '/questions', '/api/papers', '/papers', '/api/subscription', '/subscription', '/api/payments', '/payments'], blockStudentTokens);

// Online classrooms (teacher) and student portal
app.use('/api/classrooms', classroomRoutes);
app.use('/classrooms', classroomRoutes);
app.use('/api/student', studentRoutes);
app.use('/student', studentRoutes);

app.use('/api/questions', questionsRoutes);
app.use('/questions', questionsRoutes);

app.use('/api/papers', paperRoutes);
app.use('/papers', paperRoutes);

app.use('/api/subscription', subscriptionRoutes);
app.use('/subscription', subscriptionRoutes);

app.use('/api/payments', subscriptionRoutes);
app.use('/payments', subscriptionRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message || 'An unexpected error occurred.' });
});

// Start Server locally if not running as a Vercel serverless function
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 QPG Backend API Server running on http://localhost:${config.port}`);
    console.log(`🛡️  Admin Payment Verification Portal: http://localhost:${config.port}/admin`);
    console.log(`📚 Connected Question Bank: 8 Supabase Databases (89,202+ Questions)`);
    console.log(`💳 UPI Payment Model: ₹299 Monthly Subscription`);
    console.log(`======================================================\n`);
  });
}

export default app;
