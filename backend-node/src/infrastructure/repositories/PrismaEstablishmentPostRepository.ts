import { injectable } from 'tsyringe';
import { IEstablishmentPostRepository } from '../../domain/repositories/IEstablishmentPostRepository';
import { EstablishmentPost } from '../../domain/entities/EstablishmentPost';
import prisma from '../database/prisma.service';

@injectable()
export class PrismaEstablishmentPostRepository implements IEstablishmentPostRepository {
    private prisma = prisma;

    async findByEstablishmentId(
        establishmentId: string,
        pagination?: { page: number; limit: number }
    ): Promise<{ data: EstablishmentPost[]; total: number }> {
        const where = { establishmentId, isPublished: true };
        const skip = pagination ? (pagination.page - 1) * pagination.limit : undefined;
        const take = pagination ? pagination.limit : undefined;

        const [data, total] = await Promise.all([
            this.prisma.establishmentPost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            this.prisma.establishmentPost.count({ where }),
        ]);

        return { data: data.map(this.mapToEntity), total };
    }

    async findById(id: string): Promise<EstablishmentPost | null> {
        const data = await this.prisma.establishmentPost.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToEntity(data);
    }

    async save(post: EstablishmentPost): Promise<EstablishmentPost> {
        const data = await this.prisma.establishmentPost.create({
            data: {
                establishmentId: post.establishmentId,
                authorId: post.authorId,
                content: post.content,
                imageUrls: post.imageUrls,
                isPublished: post.isPublished,
            },
        });
        return this.mapToEntity(data);
    }

    async update(post: EstablishmentPost): Promise<EstablishmentPost> {
        if (!post.id) throw new Error('Post ID is required for update');
        const data = await this.prisma.establishmentPost.update({
            where: { id: post.id },
            data: {
                content: post.content,
                imageUrls: post.imageUrls,
            },
        });
        return this.mapToEntity(data);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.establishmentPost.delete({ where: { id } });
    }

    private mapToEntity(data: any): EstablishmentPost {
        return EstablishmentPost.create({
            id: data.id,
            establishmentId: data.establishmentId,
            authorId: data.authorId,
            content: data.content,
            imageUrls: data.imageUrls,
            isPublished: data.isPublished,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
