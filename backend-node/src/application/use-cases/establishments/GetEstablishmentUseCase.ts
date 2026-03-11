import { injectable, inject } from 'tsyringe';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { Establishment } from '../../../domain/entities/Establishment';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class GetEstablishmentUseCase {
    constructor(
        @inject('IEstablishmentRepository') private repository: IEstablishmentRepository
    ) { }

    async execute(id: string): Promise<Establishment> {
        const establishment = await this.repository.findById(id);
        if (!establishment) {
            throw new AppError('Establishment not found', 404);
        }
        return establishment;
    }
}
