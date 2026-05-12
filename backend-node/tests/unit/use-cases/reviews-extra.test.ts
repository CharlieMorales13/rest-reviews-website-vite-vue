import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { DeleteReviewUseCase } from '@/application/use-cases/reviews/DeleteReviewUseCase';
import { ListReviewsUseCase } from '@/application/use-cases/reviews/ListReviewsUseCase';
import { ListUserReviewsUseCase } from '@/application/use-cases/reviews/ListUserReviewsUseCase';
import { ClassifyReviewUseCase } from '@/application/use-cases/reviews/ClassifyReviewUseCase';
import { IReviewRepository } from '@/domain/repositories/IReviewRepository';
import { IAnalyticsService } from '@/domain/services/IAnalyticsService';

describe('DeleteReviewUseCase', () => {
  const mockRepo = (review: any): IReviewRepository =>
    ({ findById: vi.fn().mockResolvedValue(review), delete: vi.fn().mockResolvedValue(undefined) } as any);
  const mockAnalytics = (): IAnalyticsService =>
    ({ runSentimentAnalysis: vi.fn().mockResolvedValue({}), classifyReview: vi.fn() } as any);

  it('deletes when user owns the review', async () => {
    const review = { id: 'r1', userId: 'u1' };
    const repo = mockRepo(review);
    await new DeleteReviewUseCase(repo, mockAnalytics()).execute('r1', 'u1');
    expect(repo.delete).toHaveBeenCalledWith('r1');
  });

  it('throws 404 when review not found', async () => {
    const repo = mockRepo(null);
    await expect(new DeleteReviewUseCase(repo, mockAnalytics()).execute('r1', 'u1')).rejects.toThrow('Review not found');
  });

  it('throws 403 when user does not own review', async () => {
    const repo = mockRepo({ id: 'r1', userId: 'u2' });
    await expect(new DeleteReviewUseCase(repo, mockAnalytics()).execute('r1', 'u1')).rejects.toThrow('Forbidden');
  });
});

describe('ListReviewsUseCase', () => {
  it('returns paginated reviews', async () => {
    const repo: IReviewRepository = {
      findAll: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    } as any;
    const result = await new ListReviewsUseCase(repo).execute({ page: 1, limit: 10 });
    expect(result.total).toBe(0);
    expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('works without pagination', async () => {
    const repo: IReviewRepository = {
      findAll: vi.fn().mockResolvedValue({ data: [], total: 5 }),
    } as any;
    const result = await new ListReviewsUseCase(repo).execute();
    expect(result.total).toBe(5);
  });
});

describe('ListUserReviewsUseCase', () => {
  it('returns reviews for a user', async () => {
    const repo: IReviewRepository = {
      findByUserId: vi.fn().mockResolvedValue([{ id: 'r1' }]),
    } as any;
    const result = await new ListUserReviewsUseCase(repo).execute('u1');
    expect(result).toHaveLength(1);
  });
});

describe('ClassifyReviewUseCase', () => {
  it('classifies successfully', async () => {
    const svc: IAnalyticsService = {
      classifyReview: vi.fn().mockResolvedValue({ model_ready: true, label: 'POS', probability: 0.9 }),
    } as any;
    await expect(new ClassifyReviewUseCase(svc).execute('r1', 'Great food', 5, 4, 3)).resolves.toBeUndefined();
  });

  it('handles model not ready without throwing', async () => {
    const svc: IAnalyticsService = {
      classifyReview: vi.fn().mockResolvedValue({ model_ready: false }),
    } as any;
    await expect(new ClassifyReviewUseCase(svc).execute('r1', 'text')).resolves.toBeUndefined();
  });

  it('swallows errors silently', async () => {
    const svc: IAnalyticsService = {
      classifyReview: vi.fn().mockRejectedValue(new Error('network error')),
    } as any;
    await expect(new ClassifyReviewUseCase(svc).execute('r1', 'text')).resolves.toBeUndefined();
  });
});
