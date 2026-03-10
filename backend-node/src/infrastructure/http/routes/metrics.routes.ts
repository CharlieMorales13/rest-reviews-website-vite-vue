import { Router } from 'express';
import { container } from '../../config/container';
import { MetricsController } from '../controllers/MetricsController';

const metricsRouter = Router();
const controller = container.resolve(MetricsController);

metricsRouter.get('/summary', controller.getSummary);

export default metricsRouter;
