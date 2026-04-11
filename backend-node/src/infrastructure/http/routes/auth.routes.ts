import { Router } from 'express';
import { container } from '../../config/container';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middlewares/AuthMiddleware';
import { authRateLimiter } from '../middlewares/RateLimitMiddleware';

const authRouter = Router();
const authController = container.resolve(AuthController);

authRouter.post('/register', authRateLimiter, authController.register);
authRouter.post('/login', authRateLimiter, authController.login);
authRouter.post('/refresh', authRateLimiter, authController.refresh);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
authRouter.get('/me', authenticateToken, authController.getMe);
authRouter.patch('/me', authenticateToken, authController.updateMe);
authRouter.patch('/me/password', authenticateToken, authController.changePassword);

export default authRouter;
