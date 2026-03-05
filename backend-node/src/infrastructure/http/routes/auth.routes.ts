import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { PrismaUserRepository } from '../../repositories/PrismaUserRepository';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/use-cases/auth/LoginUserUseCase';

const authRouter = Router();

// Instantiate dependencies (Dependency Injection)
const userRepository = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRepository);
const loginUseCase = new LoginUserUseCase(userRepository);

const authController = new AuthController(registerUseCase, loginUseCase);

// Routes
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);

export default authRouter;
