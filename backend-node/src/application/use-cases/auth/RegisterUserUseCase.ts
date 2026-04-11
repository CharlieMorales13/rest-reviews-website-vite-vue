import { injectable, inject } from 'tsyringe';
import { User, UserRole } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { RegisterUserDTO } from '../../dtos/AuthDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { env } from '../../../infrastructure/config/env.config';

interface RegisterResponse {
    user: {
        id: string;
        email: string;
        role: string;
        name: string;
    };
    token: string;
}

@injectable()
export class RegisterUserUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository
    ) { }

    async execute(dto: RegisterUserDTO): Promise<RegisterResponse> {
        const existingUser = await this.userRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new AppError('User with this email already exists', 409);
        }

        const hashedPassword = await argon2.hash(dto.password);

        const newUser = User.create({
            name: dto.name,
            email: dto.email,
            passwordHash: hashedPassword,
            role: UserRole.STUDENT,
            isVerified: true,
            carrera: dto.carrera,
        });

        const savedUser = await this.userRepository.save(newUser);

        if (!savedUser.id) {
            throw new AppError('Error creating user', 500);
        }

        const token = jwt.sign(
            { userId: savedUser.id, role: savedUser.role, email: savedUser.email },
            env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            user: {
                id: savedUser.id,
                email: savedUser.email,
                name: savedUser.name,
                role: savedUser.role
            },
            token
        };
    }
}
