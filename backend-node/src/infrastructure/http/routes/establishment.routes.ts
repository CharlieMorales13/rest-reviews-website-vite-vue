import { Router } from 'express';
import { container } from '../../config/container';
import { EstablishmentController } from '../controllers/EstablishmentController';
import { ReviewController } from '../controllers/ReviewController';
import { authenticateToken, requireRole } from '../middlewares/AuthMiddleware';

const establishmentRouter = Router();
const controller = container.resolve(EstablishmentController);
const reviewController = container.resolve(ReviewController);

// Public Routes
establishmentRouter.get('/', controller.getAll);
establishmentRouter.get('/:id', controller.getOne);
establishmentRouter.get('/:id/reviews', reviewController.getByEstablishment);

// Protected Routes
establishmentRouter.post('/', authenticateToken, requireRole(['admin']), controller.create);
establishmentRouter.put('/:id', authenticateToken, requireRole(['admin', 'manager']), controller.update);
establishmentRouter.delete('/:id', authenticateToken, requireRole(['admin']), controller.delete);

export default establishmentRouter;
