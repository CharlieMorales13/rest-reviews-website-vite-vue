import { Router } from 'express';
import { container } from '../../config/container';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middlewares/AuthMiddleware';

const authRouter = Router();
const authController = container.resolve(AuthController);

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);

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

export default authRouter;
