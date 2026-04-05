import { Router } from 'express';
import { container } from '../../config/container';
import { MetricsController } from '../controllers/MetricsController';
import { authenticateToken, requireRole } from '../middlewares/AuthMiddleware';

const metricsRouter = Router();
const controller = container.resolve(MetricsController);

metricsRouter.post('/run', authenticateToken, requireRole(['admin']), controller.runPipeline);
metricsRouter.get('/request-logs', authenticateToken, requireRole(['admin']), controller.getRequestLogs);
metricsRouter.get('/summary', authenticateToken, requireRole(['admin', 'manager']), controller.getSummary);
metricsRouter.get('/establishment/:id', authenticateToken, requireRole(['admin', 'manager']), controller.getByEstablishmentId);
metricsRouter.get('/establishment/:id/history', authenticateToken, requireRole(['admin', 'manager']), controller.getHistory);

export default metricsRouter;
