import { Router } from 'express';
import { container } from '../../config/container';
import { EstablishmentController } from '../controllers/EstablishmentController';
import { ReviewController } from '../controllers/ReviewController';
import { EstablishmentPostController } from '../controllers/EstablishmentPostController';
import { authenticateToken, requireRole } from '../middlewares/AuthMiddleware';

const establishmentRouter = Router();
const controller = container.resolve(EstablishmentController);
const reviewController = container.resolve(ReviewController);
const postController = container.resolve(EstablishmentPostController);

// Public Routes
establishmentRouter.get('/', controller.getAll);
establishmentRouter.get('/:slug', controller.getOne);
establishmentRouter.get('/:slug/reviews', reviewController.getByEstablishment);
establishmentRouter.get('/:slug/posts', postController.list);

// Protected Routes
establishmentRouter.post('/', authenticateToken, requireRole(['admin']), controller.create);
establishmentRouter.put('/:id', authenticateToken, requireRole(['admin', 'manager']), controller.update);
establishmentRouter.delete('/:id', authenticateToken, requireRole(['admin']), controller.delete);
establishmentRouter.post('/:slug/posts', authenticateToken, requireRole(['admin', 'manager']), postController.create);
establishmentRouter.put('/:slug/posts/:postId', authenticateToken, requireRole(['admin', 'manager']), postController.update);
establishmentRouter.delete('/:slug/posts/:postId', authenticateToken, requireRole(['admin', 'manager']), postController.delete);

export default establishmentRouter;
