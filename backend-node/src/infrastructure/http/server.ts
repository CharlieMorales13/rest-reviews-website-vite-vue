import 'reflect-metadata'; // Must be imported before everything else for DI to work properly
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

// Application Imports
import { env } from '../config/env.config';
import { logger } from '../config/logger';
import { swaggerSpec } from '../config/swagger.config';
import authRouter from './routes/auth.routes';
import reviewRouter from './routes/review.routes';
import establishmentRouter from './routes/establishment.routes';
import userRouter from './routes/user.routes';
import metricsRouter from './routes/metrics.routes';
import uploadRouter from './routes/upload.routes';
import notificationRouter from './routes/notification.routes';
import { globalErrorHandler } from './middlewares/ErrorMiddleware';
import { requestLoggerMiddleware } from './middlewares/RequestLoggerMiddleware';

const app = express();
const PORT = env.PORT;

// Security & Utility Middlewares
app.use(helmet());
const corsOrigins = env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:4173'];
const corsOrigin = corsOrigins.includes('*') ? true : corsOrigins;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Replace Morgan with Pino for structured logging
app.use(pinoHttp({ logger }));

// In-memory request log store (admin monitoring)
app.use(requestLoggerMiddleware);

// Health Check
app.get('/health', (_req: Request, res: Response) => {
    logger.info('Health check called');
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Swagger Documentation Route — disabled in production
if (env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/establishments', establishmentRouter);
app.use('/api/users', userRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/notifications', notificationRouter);

// Global Error Handler
app.use(globalErrorHandler);

// Start Server (If explicitly run, not exported)
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📚 Swagger docs available at: http://localhost:${PORT}/api/docs`);
        logger.info(`💓 Check health at: http://localhost:${PORT}/health`);
    });
}

export default app;
