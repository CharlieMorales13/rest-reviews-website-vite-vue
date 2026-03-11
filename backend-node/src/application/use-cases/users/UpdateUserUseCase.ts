import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { UpdateUserDTO } from '../../dtos/UserDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';
import * as argon2 from 'argon2';

@injectable()
export class UpdateUserUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository
    ) { }

    async execute(id: string, dto: UpdateUserDTO): Promise<User> {
        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        let passwordHash = existingUser.passwordHash;
        if (dto.password) {
            passwordHash = await argon2.hash(dto.password);
        }

        const updatedUser = User.create({
            id: id,
            name: dto.name ?? existingUser.name,
            email: dto.email ?? existingUser.email,
            passwordHash: passwordHash,
            role: dto.role ?? existingUser.role,
            isActive: dto.isActive ?? existingUser.isActive,
            avatarUrl: dto.avatarUrl ?? existingUser.avatarUrl,
            bio: dto.bio ?? existingUser.bio,
            universityId: dto.universityId ?? existingUser.universityId,
            createdAt: existingUser.createdAt,
        });

        return await this.userRepository.update(updatedUser);
    }
}
