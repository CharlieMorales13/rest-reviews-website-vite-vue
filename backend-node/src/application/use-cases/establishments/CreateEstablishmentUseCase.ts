import { injectable, inject } from 'tsyringe';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { Establishment } from '../../../domain/entities/Establishment';
import { CreateEstablishmentDTO } from '../../dtos/EstablishmentDTO';

@injectable()
export class CreateEstablishmentUseCase {
    constructor(
        @inject('IEstablishmentRepository') private repository: IEstablishmentRepository
    ) { }

    async execute(dto: CreateEstablishmentDTO): Promise<Establishment> {
        const establishment = Establishment.create({
            name: dto.name,
            description: dto.description,
            category: dto.category,
            managerId: dto.managerId,
            universityId: dto.universityId,
            locationDetails: dto.locationDetails,
            openingHours: dto.openingHours,
            galleryUrls: dto.galleryUrls,
            menuUrls: dto.menuUrls,
        });

        return await this.repository.save(establishment);
    }
}
