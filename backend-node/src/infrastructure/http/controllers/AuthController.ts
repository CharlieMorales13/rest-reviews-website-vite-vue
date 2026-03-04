import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/use-cases/auth/LoginUserUseCase';
import { RegisterUserSchema, LoginUserSchema } from '../../../application/dtos/AuthDTO';

export class AuthController {
    constructor(
        private registerUserUseCase: RegisterUserUseCase,
        private loginUserUseCase: LoginUserUseCase
    ) { }

    public register = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        // 1. Validate Input (DTO)
        const validatedData = RegisterUserSchema.parse(req.body);

        // 2. Execute Application Use Case
        const user = await this.registerUserUseCase.execute(validatedData);

        // 3. Return Infrastructure Response
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
