import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { LoginUserDTO } from '../../dtos/AuthDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { env } from '../../../infrastructure/config/env.config';
import prisma from '../../../infrastructure/database/prisma.service';

interface LoginResponse {
    user: {
        id: string;
        email: string;
        role: string;
        name: string;
    };
    token: string;
    refreshToken: string;
}

@injectable()
export class LoginUserUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository
    ) { }

    async execute(dto: LoginUserDTO): Promise<LoginResponse> {
        const user = await this.userRepository.findByEmail(dto.email);

        if (!user || !user.isActive || !user.id) {
            throw new AppError('Invalid credentials or inactive account', 401);
        }

        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, type: 'refresh' },
            env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.userSession.create({
            data: {
                userId: user.id,
                refreshToken,
                expiresAt
            }
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token,
            refreshToken
        };
    }
}
