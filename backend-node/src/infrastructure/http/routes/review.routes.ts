import { Router } from 'express';
import { container } from '../../config/container';
import { ReviewController } from '../controllers/ReviewController';
import { authenticateToken, requireRole } from '../middlewares/AuthMiddleware';

const reviewRouter = Router();

// Resolve Controller with all its dependencies automatically
const reviewController = container.resolve(ReviewController);

// Routes
reviewRouter.get('/', reviewController.getAll);
reviewRouter.get('/my', authenticateToken, reviewController.getMyReviews);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Invalid input
 */
reviewRouter.post('/', authenticateToken, reviewController.create);
reviewRouter.patch('/:id/reply', authenticateToken, requireRole(['admin', 'manager']), reviewController.reply);

export default reviewRouter;
