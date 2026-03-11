import { injectable, inject } from 'tsyringe';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { Establishment } from '../../../domain/entities/Establishment';
import { UpdateEstablishmentDTO } from '../../dtos/EstablishmentDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class UpdateEstablishmentUseCase {
    constructor(
        @inject('IEstablishmentRepository') private repository: IEstablishmentRepository
    ) { }

    async execute(id: string, dto: UpdateEstablishmentDTO, requester?: { id: string; role: string }): Promise<Establishment> {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new AppError('Establishment not found', 404);
        }

        // Ownership Check: Only admin or the assigned manager can update
        if (requester && requester.role !== 'admin' && existing.managerId !== requester.id) {
            throw new AppError('You do not have permission to update this establishment', 403);
        }

        const establishment = Establishment.create({
            id: id,
            name: dto.name ?? existing.name,
            description: dto.description ?? existing.description,
            category: dto.category ?? existing.category,
            managerId: dto.managerId ?? existing.managerId,
            universityId: dto.universityId ?? existing.universityId,
            locationDetails: dto.locationDetails ?? existing.locationDetails,
            openingHours: dto.openingHours ?? existing.openingHours,
            galleryUrls: dto.galleryUrls ?? existing.galleryUrls,
            menuUrls: dto.menuUrls ?? existing.menuUrls,
            isActive: dto.isActive ?? existing.isActive,
            createdAt: existing.createdAt,
        });

        return await this.repository.update(establishment);
    }
}
