import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { db } from './database/db';
import { runSeeder } from './database/seed';
import { errorHandler } from './middlewares/errorHandler';
import { sendSuccess } from './utils/response';

// Route Imports
import authRouter from './routes/auth.routes';
import usersRouter from './routes/users.routes';
import activitiesRouter from './routes/activities.routes';
import registrationsRouter from './routes/registrations.routes';
import attendanceRouter from './routes/attendance.routes';
import achievementsRouter from './routes/achievements.routes';
import certificatesRouter from './routes/certificates.routes';
import announcementsRouter from './routes/announcements.routes';
import notificationsRouter from './routes/notifications.routes';
import recommendationsRouter from './routes/recommendations.routes';
import portfolioRouter from './routes/portfolio.routes';
import analyticsRouter from './routes/analytics.routes';
import auditRouter from './routes/audit.routes';

const app = express();

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true, // Reflect request origin so Access-Control-Allow-Credentials: true is valid in all browsers
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.options('*', cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ONLINE',
    system: config.institution.systemName,
    institution: config.institution.name,
    location: config.institution.location,
    environment: config.nodeEnv,
    databaseEngine: db.isPostgres ? 'PostgreSQL' : 'Embedded Relational (LibSQL)',
    timestamp: new Date().toISOString(),
  }, 'CNHS Extracurricular API is operational');
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit-logs', auditRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: [${req.method}] ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Bootstrap & Start Server
async function startServer() {
  try {
    console.log('🚀 Initializing Centrala National High School System Database...');
    await runSeeder();

    const server = app.listen(config.port, () => {
      console.log(`
========================================================================
🏫  Centrala National High School (CNHS) - Surallah, South Cotabato
✨  Extracurricular Activities and Student Development System REST API
🚀  Server running on: http://localhost:${config.port}
🩺  Health Check:     http://localhost:${config.port}/api/health
========================================================================
      `);
    });

    const gracefulShutdown = async () => {
      console.log('\n🛑 Gracefully terminating server...');
      server.close(async () => {
        await db.close();
        console.log('👋 Database connection closed. Server exited cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
