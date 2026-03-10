import { Router } from 'express';
import { container } from '../../config/container';
import { EstablishmentController } from '../controllers/EstablishmentController';
import { ReviewController } from '../controllers/ReviewController';
import { authenticateToken } from '../middlewares/AuthMiddleware';

const establishmentRouter = Router();
const controller = container.resolve(EstablishmentController);
const reviewController = container.resolve(ReviewController);

// Public Routes
establishmentRouter.get('/', controller.getAll);
establishmentRouter.get('/:id', controller.getById);
establishmentRouter.get('/:id/reviews', reviewController.getByEstablishment);

// Protected Routes
establishmentRouter.post('/', authenticateToken, controller.create);
establishmentRouter.put('/:id', authenticateToken, controller.update);
establishmentRouter.delete('/:id', authenticateToken, controller.delete);

export default establishmentRouter;
