import { Router } from 'express';
import { container } from '../../config/container';
import { UserController } from '../controllers/UserController';
import { authenticateToken, requireRole } from '../middlewares/AuthMiddleware';

const userRouter = Router();
const controller = container.resolve(UserController);

// All user management routes are protected
userRouter.use(authenticateToken);

userRouter.get('/:id/profile', controller.getProfile);

// Admin-only routes
userRouter.post('/', requireRole(['admin']), controller.create);
userRouter.get('/', requireRole(['admin']), controller.getAll);
userRouter.get('/:id', requireRole(['admin']), controller.getById);
userRouter.put('/:id', requireRole(['admin']), controller.update);
userRouter.delete('/:id', requireRole(['admin']), controller.delete);

export default userRouter;
