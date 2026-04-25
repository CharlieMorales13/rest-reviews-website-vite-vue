import prisma from "../database/prisma.service";
import { IReviewRepository } from "../../domain/repositories/IReviewRepository";
import { Review } from "../../domain/entities/Review";
import { injectable } from "tsyringe";

@injectable()
export class PrismaReviewRepository implements IReviewRepository {
  async findById(id: string): Promise<Review | null> {
    const data = await prisma.review.findUnique({ where: { id } });
    if (!data) return null;
    return this.mapToDomain(data);
  }

  async findAll(pagination?: {
    page: number;
    limit: number;
  }): Promise<{ data: Review[]; total: number }> {
    const skip = pagination
      ? (pagination.page - 1) * pagination.limit
      : undefined;
    const take = pagination ? pagination.limit : undefined;

    const [data, total] = await Promise.all([
      prisma.review.findMany({
        include: {
          user: { select: { name: true, carrera: true } },
          establishment: { select: { name: true } },
          sentimentResults: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { predictedLabel: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.review.count(),
    ]);

    return {
      data: data.map(this.mapToDomain),
      total,
    };
  }

  async findByEstablishmentId(
    establishmentId: string,
    pagination?: { page: number; limit: number },
    viewerId?: string,
  ): Promise<{ data: Review[]; total: number }> {
    const skip = pagination
      ? (pagination.page - 1) * pagination.limit
      : undefined;
    const take = pagination ? pagination.limit : undefined;

    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where: { establishmentId },
        include: {
          user: { select: { name: true, carrera: true } },
          sentimentResults: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { predictedLabel: true },
          },
          _count: { select: { likes: true } },
          ...(viewerId
            ? {
                likes: {
                  where: { userId: viewerId },
                  select: { userId: true },
                },
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.review.count({ where: { establishmentId } }),
    ]);

    return {
      data: data.map((d) =>
        this.mapToDomain(d, {
          likesCount: (d as any)._count?.likes ?? 0,
          likedByMe: viewerId ? ((d as any).likes?.length ?? 0) > 0 : false,
        }),
      ),
      total,
    };
  }

  async findByUserId(userId: string): Promise<Review[]> {
    const data = await prisma.review.findMany({
      where: { userId },
      include: {
        establishment: { select: { name: true } },
        sentimentResults: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { predictedLabel: true },
        },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return data.map((d) =>
      this.mapToDomain(d, { likesCount: (d as any)._count?.likes ?? 0 }),
    );
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
        title: review.title,
        comment: review.comment,
        imageUrl: review.imageUrl,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      } as any,
    });
    return this.mapToDomain(data);
  }

  async update(review: Review): Promise<Review> {
    const data = await prisma.review.update({
      where: { id: review.id },
      data: {
        foodScore: review.foodScore,
        serviceScore: review.serviceScore,
        priceScore: review.priceScore,
        title: review.title,
        comment: review.comment,
        managerReply: review.managerReply,
        managerReplyAt: review.managerReplyAt,
        updatedAt: review.updatedAt,
      } as any,
    });
    return this.mapToDomain(data);
  }

  async delete(id: string): Promise<void> {
    await prisma.review.delete({ where: { id } });
  }

  async addLike(userId: string, reviewId: string): Promise<number> {
    await prisma.reviewLike.create({ data: { userId, reviewId } });
    return prisma.reviewLike.count({ where: { reviewId } });
  }

  async removeLike(userId: string, reviewId: string): Promise<number> {
    await prisma.reviewLike.delete({
      where: { userId_reviewId: { userId, reviewId } },
    });
    return prisma.reviewLike.count({ where: { reviewId } });
  }

  async getLikesCount(reviewId: string): Promise<number> {
    return prisma.reviewLike.count({ where: { reviewId } });
  }

  async hasLiked(userId: string, reviewId: string): Promise<boolean> {
    const like = await prisma.reviewLike.findUnique({
      where: { userId_reviewId: { userId, reviewId } },
    });
    return like !== null;
  }

  async getReviewAuthorId(reviewId: string): Promise<string | null> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });
    return review?.userId ?? null;
  }

  private mapToDomain(
    data: any,
    extras?: { likesCount?: number; likedByMe?: boolean },
  ): Review {
    return Review.create({
      id: data.id,
      userId: data.userId,
      establishmentId: data.establishmentId,
      foodScore: data.foodScore,
      serviceScore: data.serviceScore,
      priceScore: data.priceScore,
      title: data.title,
      comment: data.comment,
      imageUrl: data.imageUrl,
      authorName: data.user?.name,
      authorCarrera: data.user?.carrera,
      establishmentName: data.establishment?.name,
      sentiment: data.sentimentResults?.[0]?.predictedLabel,
      managerReply: data.managerReply,
      managerReplyAt: data.managerReplyAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      likesCount: extras?.likesCount,
      likedByMe: extras?.likedByMe,
    });
  }
}
