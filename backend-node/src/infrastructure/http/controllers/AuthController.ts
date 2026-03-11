import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/use-cases/auth/LoginUserUseCase';
import { RegisterUserSchema, LoginUserSchema } from '../../../application/dtos/AuthDTO';
import { injectable, inject } from 'tsyringe';

import { AuthRequest } from '../middlewares/AuthMiddleware';
import { GetUserUseCase } from '../../../application/use-cases/users/GetUserUseCase';
import { UpdateUserUseCase } from '../../../application/use-cases/users/UpdateUserUseCase';
import { UpdateUserSchema } from '../../../application/dtos/UserDTO';

@injectable()
export class AuthController {
    constructor(
        @inject(RegisterUserUseCase) private registerUserUseCase: RegisterUserUseCase,
        @inject(LoginUserUseCase) private loginUserUseCase: LoginUserUseCase,
        @inject(GetUserUseCase) private getUserUseCase: GetUserUseCase,
        @inject(UpdateUserUseCase) private updateUserUseCase: UpdateUserUseCase
    ) { }

    /**
     * @swagger
     * /auth/me:
     *   patch:
     *     summary: Update current authenticated user profile
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateUserDTO'
     *     responses:
     *       200:
     *         description: Profile updated successfully
     */
    public updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const validatedData = UpdateUserSchema.parse(req.body);
        const user = await this.updateUserUseCase.execute(userId, validatedData);

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                universityId: user.universityId,
                updatedAt: user.updatedAt
            }
        });
    };

    /**
     * @swagger
     * /auth/me:
     *   get:
     *     summary: Get current authenticated user info
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Current user profile
     */
    public getMe = async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const user = await this.getUserUseCase.execute(userId);
        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                universityId: user.universityId,
                createdAt: user.createdAt
            }
        });
    };

    public register = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const validatedData = RegisterUserSchema.parse(req.body);
        const user = await this.registerUserUseCase.execute(validatedData);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    };

    public login = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const validatedData = LoginUserSchema.parse(req.body);
        const result = await this.loginUserUseCase.execute(validatedData);

        res.status(200).json({
            success: true,
            data: result
        });
    };
}
