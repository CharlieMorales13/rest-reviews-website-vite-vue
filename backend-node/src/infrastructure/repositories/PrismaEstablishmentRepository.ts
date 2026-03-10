import { IEstablishmentRepository } from '../../domain/repositories/IEstablishmentRepository';
import { Establishment } from '../../domain/entities/Establishment';
import { PrismaClient } from '@prisma/client';
import { injectable } from 'tsyringe';

@injectable()
export class PrismaEstablishmentRepository implements IEstablishmentRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async findById(id: string): Promise<Establishment | null> {
        const data = await this.prisma.establishment.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Establishment[]> {
        const data = await this.prisma.establishment.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return data.map(this.mapToEntity);
    }

    async save(establishment: Establishment): Promise<Establishment> {
        const data = await this.prisma.establishment.create({
            data: {
                name: establishment.name,
                description: establishment.description,
                category: establishment.category,
                managerId: establishment.managerId,
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
                isActive: establishment.isActive,
            }
        });
        return this.mapToEntity(data);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.establishment.delete({ where: { id } });
    }

    private mapToEntity(data: any): Establishment {
        return Establishment.create({
            id: data.id,
            name: data.name,
            description: data.description,
            category: data.category,
            managerId: data.managerId,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
