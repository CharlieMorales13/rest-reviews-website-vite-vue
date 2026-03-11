import { IEstablishmentRepository } from '../../domain/repositories/IEstablishmentRepository';
import { Establishment } from '../../domain/entities/Establishment';
import prisma from '../database/prisma.service';
import { injectable } from 'tsyringe';

@injectable()
export class PrismaEstablishmentRepository implements IEstablishmentRepository {
    private prisma = prisma;

    async findById(id: string): Promise<Establishment | null> {
        const data = await this.prisma.establishment.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToEntity(data);
    }

    async findAll(
        filters?: { name?: string; universityId?: string },
        pagination?: { page: number; limit: number }
    ): Promise<{ data: Establishment[]; total: number }> {
        const where: any = {};

        if (filters?.name) {
            where.name = {
                contains: filters.name,
                mode: 'insensitive'
            };
        }

        if (filters?.universityId) {
            where.universityId = filters.universityId;
        }

        const skip = pagination ? (pagination.page - 1) * pagination.limit : undefined;
        const take = pagination ? pagination.limit : undefined;

        const [data, total] = await Promise.all([
            this.prisma.establishment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            this.prisma.establishment.count({ where })
        ]);

        return {
            data: data.map(this.mapToEntity),
            total
        };
    }

    async save(establishment: Establishment): Promise<Establishment> {
        const data = await this.prisma.establishment.create({
            data: {
                name: establishment.name,
                description: establishment.description,
                category: establishment.category,
                managerId: establishment.managerId,
                universityId: establishment.universityId,
                locationDetails: establishment.locationDetails,
                openingHours: establishment.openingHours,
                galleryUrls: establishment.galleryUrls,
                menuUrls: establishment.menuUrls,
                isActive: establishment.isActive,
            }
        });
        return this.mapToEntity(data);
    }

    async update(establishment: Establishment): Promise<Establishment> {
        if (!establishment.id) throw new Error('Establishment ID is required for update');

        const data = await this.prisma.establishment.update({
            where: { id: establishment.id },
            data: {
                name: establishment.name,
                description: establishment.description,
                category: establishment.category,
                managerId: establishment.managerId,
                universityId: establishment.universityId,
                locationDetails: establishment.locationDetails,
                openingHours: establishment.openingHours,
                galleryUrls: establishment.galleryUrls,
                menuUrls: establishment.menuUrls,
                isActive: establishment.isActive,
            }
        });
        return this.mapToEntity(data);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.establishment.delete({ where: { id } });
    }

    async findByManagerId(managerId: string): Promise<Establishment[]> {
        const data = await this.prisma.establishment.findMany({
            where: { managerId },
            orderBy: { createdAt: 'desc' }
        });
        return data.map(this.mapToEntity);
    }

    private mapToEntity(data: any): Establishment {
        return Establishment.create({
            id: data.id,
            name: data.name,
            description: data.description,
            category: data.category,
            managerId: data.managerId,
            universityId: data.universityId,
            locationDetails: data.locationDetails,
            openingHours: data.openingHours,
            galleryUrls: data.galleryUrls,
            menuUrls: data.menuUrls,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
