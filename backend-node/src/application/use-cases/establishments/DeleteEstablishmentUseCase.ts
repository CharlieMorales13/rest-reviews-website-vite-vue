import { injectable, inject } from 'tsyringe';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class DeleteEstablishmentUseCase {
    constructor(
        @inject('IEstablishmentRepository') private repository: IEstablishmentRepository
    ) { }

    async execute(id: string): Promise<void> {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new AppError('Establishment not found', 404);
        }
        await this.repository.delete(id);
    }
}
