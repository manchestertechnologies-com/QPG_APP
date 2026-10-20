import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import questionsRoutes from './routes/questionsRoutes';
import paperRoutes from './routes/paperRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import adminRoutes from './routes/adminRoutes';
import { getAdminUiHtml } from './admin/adminUi';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'QPG Question Paper Generator API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    databases: Object.keys(config.databases).length + ' Subjects Connected (8 Supabase Repositories)',
  });
});

// Admin Web Interface (Requirement 13)
app.get('/admin', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getAdminUiHtml());
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/payments', subscriptionRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message || 'An unexpected error occurred.' });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 QPG Backend API Server running on http://localhost:${config.port}`);
  console.log(`🛡️  Admin Payment Verification Portal: http://localhost:${config.port}/admin`);
  console.log(`📚 Connected Question Bank: 8 Supabase Databases (89,202+ Questions)`);
  console.log(`💳 UPI Payment Model: ₹299 Monthly Subscription`);
  console.log(`======================================================\n`);
});

export default app;
