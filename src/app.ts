import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Middlewares
import { errorHandler } from './middlewares/errorHandler';
import { idempotency } from './middlewares/idempotency';

// Route Handlers
import authRoutes from './modules/auth/route';
import masterRoutes from './modules/masters/route';
import procurementRoutes from './modules/procurement/route';
import salesRoutes from './modules/sales/route';
import inventoryRoutes from './modules/inventory/route';
import crmRoutes from './modules/crm/route';
import financeRoutes from './modules/finance/route';
import reportRoutes from './modules/reports/route';

const app = express();

// 1. Security & Parsers (Section 58)
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Idempotency Middleware (Section 57)
app.use(idempotency as any);

// Serve static upload backups
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 2. Base Modular Routing (Section 63)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/masters', masterRoutes);
app.use('/api/v1/procurement', procurementRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ERP API Server Healthy', timestamp: new Date() });
});

// 3. Centralized Error Handler (Section 53)
app.use(errorHandler as any);

export default app;
