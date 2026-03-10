import prisma from '../database/prisma.service';
import { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import { Review } from '../../domain/entities/Review';
import { injectable } from 'tsyringe';

@injectable()
export class PrismaReviewRepository implements IReviewRepository {
    async findById(id: string): Promise<Review | null> {
        const data = await prisma.review.findUnique({ where: { id } });
        if (!data) return null;
        return this.mapToDomain(data);
    }

    async findByEstablishmentId(establishmentId: string): Promise<Review[]> {
        const data = await prisma.review.findMany({
            where: { establishmentId },
            orderBy: { createdAt: 'desc' }
        });
        return data.map(this.mapToDomain);
    }

    async findByUserId(userId: string): Promise<Review[]> {
        const data = await prisma.review.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return data.map(this.mapToDomain);
    }

    async save(review: Review): Promise<Review> {
        const data = await prisma.review.create({
            data: {
                id: review.id,
                userId: review.userId,
                establishmentId: review.establishmentId,
                foodScore: review.foodScore,
                serviceScore: review.serviceScore,
                priceScore: review.priceScore,
                comment: review.comment,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            },
        });
        return this.mapToDomain(data);
    }

    async hasUserReviewedEstablishment(userId: string, establishmentId: string): Promise<boolean> {
        // Relying on the DB unique constraint [userId, establishmentId] check efficiency via a query
        const count = await prisma.review.count({
            where: {
                userId,
                establishmentId,
            },
        });
        return count > 0;
    }

    private mapToDomain(data: any): Review {
        return Review.create({
            id: data.id,
            userId: data.userId,
            establishmentId: data.establishmentId,
            foodScore: data.foodScore,
            serviceScore: data.serviceScore,
            priceScore: data.priceScore,
            comment: data.comment,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
