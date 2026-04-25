import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnlikeReviewUseCase } from '../../../src/application/use-cases/reviews/UnlikeReviewUseCase';
import type { IReviewRepository } from '../../../src/domain/repositories/IReviewRepository';
import { AppError } from '../../../src/infrastructure/http/errors/AppError';

const mockReviewRepo = {
  findById: vi.fn(), hasLiked: vi.fn(), removeLike: vi.fn(), getLikesCount: vi.fn(),
  findAll: vi.fn(), findByEstablishmentId: vi.fn(), findByUserId: vi.fn(),
  save: vi.fn(), update: vi.fn(), delete: vi.fn(), addLike: vi.fn(), getReviewAuthorId: vi.fn(),
} as unknown as IReviewRepository;

describe('UnlikeReviewUseCase', () => {
  let useCase: UnlikeReviewUseCase;
  beforeEach(() => { useCase = new UnlikeReviewUseCase(mockReviewRepo); vi.clearAllMocks(); });

  it('should throw 404 if like does not exist', async () => {
    vi.mocked(mockReviewRepo.hasLiked).mockResolvedValue(false);
    await expect(useCase.execute({ userId: 'u1', reviewId: 'r1' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should remove like and return updated count', async () => {
    vi.mocked(mockReviewRepo.hasLiked).mockResolvedValue(true);
    vi.mocked(mockReviewRepo.removeLike).mockResolvedValue(3);
    const result = await useCase.execute({ userId: 'u1', reviewId: 'r1' });
    expect(mockReviewRepo.removeLike).toHaveBeenCalledWith('u1', 'r1');
    expect(result).toEqual({ likesCount: 3, likedByMe: false });
  });
});
