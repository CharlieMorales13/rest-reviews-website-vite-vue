import { injectable, inject } from 'tsyringe';
import { User, UserRole } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { RegisterUserDTO } from '../../dtos/AuthDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';
import * as argon2 from 'argon2';

@injectable()
export class RegisterUserUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository
    ) { }

    async execute(dto: RegisterUserDTO): Promise<User> {
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
            isVerified: true // Set to true by default as requested
        });

        return await this.userRepository.save(newUser);
    }
}
