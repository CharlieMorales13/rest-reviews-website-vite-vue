import { injectable, inject } from 'tsyringe';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { Establishment } from '../../../domain/entities/Establishment';

@injectable()
export class GetManagerEstablishmentsUseCase {
    constructor(
        @inject('IEstablishmentRepository') private repository: IEstablishmentRepository
    ) { }

    async execute(managerId: string): Promise<Establishment[]> {
        return await this.repository.findByManagerId(managerId);
    }
}
