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
import { globalErrorHandler } from './middlewares/ErrorMiddleware';

const app = express();
const PORT = env.PORT;

// Security & Utility Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Replace Morgan with Pino for structured logging
app.use(pinoHttp({ logger }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
    logger.info('Health check called');
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Swagger Documentation Route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/establishments', establishmentRouter);
app.use('/api/users', userRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/upload', uploadRouter);

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
