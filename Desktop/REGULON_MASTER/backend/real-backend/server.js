/**
 * REGULON Real Backend API Server
 * Production-ready backend with Supabase integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

// Enhanced security middleware
import { securityHeaders } from './middleware/security.js';

// Route imports
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import caRoutes from './routes/ca.js';
import caDashboardRoutes from './routes/ca-dashboard.js';
import aiAgentRoutes from './routes/ai-agent.js';
import adminRoutes from './routes/admin.js';
import documentRoutes from './routes/documents.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/uploads.js';
import auditRoutes from './routes/audit.js';
import securityRoutes from './routes/security.js';
import monitoringRoutes from './routes/monitoring.js';
import regulatoryRoutes from './routes/regulatory.js';

// Load environment variables
dotenv.config();

// Initialize Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend
);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'regulon-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Security middleware
app.use(securityHeaders);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/company`, companyRoutes);
app.use(`/api/${apiVersion}/ca`, caRoutes);
app.use(`/api/${apiVersion}/ca`, caDashboardRoutes); // CA Dashboard routes
app.use(`/api/${apiVersion}/ai`, aiAgentRoutes); // Autonomous AI Agent routes
app.use(`/api/${apiVersion}/admin`, adminRoutes);
app.use(`/api/${apiVersion}/documents`, documentRoutes);
app.use(`/api/${apiVersion}/notifications`, notificationRoutes);
app.use(`/api/${apiVersion}/reports`, reportRoutes);
app.use(`/api/${apiVersion}/uploads`, uploadRoutes);
app.use(`/api/${apiVersion}/audit`, auditRoutes);
app.use(`/api/${apiVersion}/security`, securityRoutes);
app.use(`/api/${apiVersion}/monitoring`, monitoringRoutes);
app.use(`/api/${apiVersion}/regulatory`, regulatoryRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 REGULON Backend API running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔌 API Base URL: http://localhost:${PORT}/api/${apiVersion}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;