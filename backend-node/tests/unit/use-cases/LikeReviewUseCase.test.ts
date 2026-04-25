import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LikeReviewUseCase } from '../../../src/application/use-cases/reviews/LikeReviewUseCase';
import { CreateNotificationUseCase } from '../../../src/application/use-cases/notifications/CreateNotificationUseCase';
import type { IReviewRepository } from '../../../src/domain/repositories/IReviewRepository';
import { AppError } from '../../../src/infrastructure/http/errors/AppError';

const mockReviewRepo = {
  findById: vi.fn(), addLike: vi.fn(), hasLiked: vi.fn(), getReviewAuthorId: vi.fn(),
  getLikesCount: vi.fn(), findAll: vi.fn(), findByEstablishmentId: vi.fn(),
  findByUserId: vi.fn(), save: vi.fn(), update: vi.fn(), delete: vi.fn(), removeLike: vi.fn(),
} as unknown as IReviewRepository;

const mockCreateNotification = {
  execute: vi.fn().mockResolvedValue({}),
} as unknown as CreateNotificationUseCase;

describe('LikeReviewUseCase', () => {
  let useCase: LikeReviewUseCase;
  beforeEach(() => {
    useCase = new LikeReviewUseCase(mockReviewRepo, mockCreateNotification);
    vi.clearAllMocks();
  });

  it('should throw 404 if review does not exist', async () => {
    vi.mocked(mockReviewRepo.findById).mockResolvedValue(null);
    await expect(useCase.execute({ userId: 'u1', reviewId: 'r1' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw 403 if user tries to like their own review', async () => {
    const { Review } = await import('../../../src/domain/entities/Review');
    const review = Review.create({ id: 'r1', userId: 'u1', establishmentId: 'e1', foodScore: 4, serviceScore: 4, priceScore: 4 });
    vi.mocked(mockReviewRepo.findById).mockResolvedValue(review);
    await expect(useCase.execute({ userId: 'u1', reviewId: 'r1' })).rejects.toMatchObject({ statusCode: 403 });
  });

  it('should throw 409 if user already liked the review', async () => {
    const { Review } = await import('../../../src/domain/entities/Review');
    const review = Review.create({ id: 'r1', userId: 'author-1', establishmentId: 'e1', foodScore: 4, serviceScore: 4, priceScore: 4 });
    vi.mocked(mockReviewRepo.findById).mockResolvedValue(review);
    vi.mocked(mockReviewRepo.hasLiked).mockResolvedValue(true);
    await expect(useCase.execute({ userId: 'u1', reviewId: 'r1' })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('should add like and create notification on success', async () => {
    const { Review } = await import('../../../src/domain/entities/Review');
    const review = Review.create({ id: 'r1', userId: 'author-1', establishmentId: 'e1', foodScore: 4, serviceScore: 4, priceScore: 4 });
    vi.mocked(mockReviewRepo.findById).mockResolvedValue(review);
    vi.mocked(mockReviewRepo.hasLiked).mockResolvedValue(false);
    vi.mocked(mockReviewRepo.addLike).mockResolvedValue(5);
    const result = await useCase.execute({ userId: 'u1', reviewId: 'r1' });
    expect(mockReviewRepo.addLike).toHaveBeenCalledWith('u1', 'r1');
    expect(mockCreateNotification.execute).toHaveBeenCalledWith({ userId: 'author-1', reviewId: 'r1', type: 'like' });
    expect(result).toEqual({ likesCount: 5, likedByMe: true });
  });
});
