import { injectable, inject } from 'tsyringe';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { Establishment } from '../../../domain/entities/Establishment';

@injectable()
export class ListEstablishmentsUseCase {
    constructor(
        @inject('IEstablishmentRepository') private repository: IEstablishmentRepository
    ) { }

    async execute(
        filters?: { name?: string; universityId?: string },
        pagination?: { page: number; limit: number }
    ): Promise<{ data: Establishment[]; total: number }> {
        return await this.repository.findAll(filters, pagination);
    }
}
