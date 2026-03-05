import { Router } from 'express';
import { container } from '../../config/container';
import { ReviewController } from '../controllers/ReviewController';
import { authenticateToken } from '../middlewares/AuthMiddleware';

const reviewRouter = Router();

// Resolve Controller with all its dependencies automatically
const reviewController = container.resolve(ReviewController);

// Routes
reviewRouter.post('/', authenticateToken, reviewController.create);

export default reviewRouter;
