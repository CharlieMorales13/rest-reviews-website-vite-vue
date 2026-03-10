import { Router } from 'express';
import { container } from '../../config/container';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middlewares/AuthMiddleware';

const userRouter = Router();
const controller = container.resolve(UserController);

// All user management routes are protected
// In a next step we might add a checkRole('admin') middleware
userRouter.use(authenticateToken);

userRouter.get('/:id/profile', controller.getProfile);
userRouter.get('/', controller.getAll);
userRouter.get('/:id', controller.getById);
userRouter.put('/:id', controller.update);
userRouter.delete('/:id', controller.delete);

export default userRouter;
