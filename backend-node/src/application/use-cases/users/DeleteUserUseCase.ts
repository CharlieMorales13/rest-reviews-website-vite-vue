import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class DeleteUserUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository
    ) { }

    async execute(id: string): Promise<void> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        await this.userRepository.delete(id);
    }
}
