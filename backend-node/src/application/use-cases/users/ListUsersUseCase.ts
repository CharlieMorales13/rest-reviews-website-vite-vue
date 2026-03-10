import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';

@injectable()
export class ListUsersUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository
    ) { }

    async execute(): Promise<User[]> {
        return await this.userRepository.findAll();
    }
}
