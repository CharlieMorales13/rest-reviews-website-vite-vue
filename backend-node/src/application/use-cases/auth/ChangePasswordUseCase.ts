import { injectable, inject } from 'tsyringe';
import * as argon2 from 'argon2';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { AppError } from '../../../infrastructure/http/errors/AppError';

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
}

@injectable()
export class ChangePasswordUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository,
    ) {}

    async execute(userId: string, dto: ChangePasswordDTO): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
        if (!valid) throw new AppError('La contraseña actual es incorrecta', 400);

        const newHash = await argon2.hash(dto.newPassword);
        user.updatePasswordHash(newHash);
        await this.userRepository.update(user);
    }
}
