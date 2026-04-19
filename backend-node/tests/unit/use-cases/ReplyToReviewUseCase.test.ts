import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReplyToReviewUseCase } from '../../../src/application/use-cases/reviews/ReplyToReviewUseCase';
import { CreateNotificationUseCase } from '../../../src/application/use-cases/notifications/CreateNotificationUseCase';
import type { IReviewRepository } from '../../../src/domain/repositories/IReviewRepository';
import type { IEstablishmentRepository } from '../../../src/domain/repositories/IEstablishmentRepository';
import { AppError } from '../../../src/infrastructure/http/errors/AppError';
import { Review } from '../../../src/domain/entities/Review';

const makeReview = () => Review.create({
  id: 'rev-1',
  userId: 'student-1',
  establishmentId: 'est-1',
  foodScore: 4,
  serviceScore: 4,
  priceScore: 4,
  comment: 'Great food here!',
});

const mockReviewRepo = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findByEstablishmentId: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as IReviewRepository;

const mockEstablishmentRepo = {
  findById: vi.fn(),
  findAll: vi.fn(),
  findBySlug: vi.fn(),
  findByManagerId: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as IEstablishmentRepository;

const mockCreateNotification = {
  execute: vi.fn().mockResolvedValue({}),
} as unknown as CreateNotificationUseCase;

describe('ReplyToReviewUseCase', () => {
  let useCase: ReplyToReviewUseCase;

  beforeEach(() => {
    useCase = new ReplyToReviewUseCase(mockReviewRepo, mockEstablishmentRepo, mockCreateNotification);
    vi.clearAllMocks();
    vi.mocked(mockCreateNotification.execute).mockResolvedValue({} as any);
  });

  it('should throw an error if the review does not exist', async () => {
    vi.mocked(mockReviewRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ reviewId: '123', managerId: 'mgr-1', reply: 'Thanks' }, 'manager')
    ).rejects.toThrow(AppError);
  });

  it('should throw an error if user is not authorized', async () => {
    const fakeReview = Review.create({
      id: '123',
      userId: 'student-1',
      establishmentId: 'est-1',
      foodScore: 5, serviceScore: 5, priceScore: 5,
      comment: 'Very good place.'
    });

    vi.mocked(mockReviewRepo.findById).mockResolvedValue(fakeReview);
    vi.mocked(mockEstablishmentRepo.findById).mockResolvedValue({ id: 'est-1', managerId: 'mgr-2' } as any);

    await expect(
      useCase.execute({ reviewId: '123', managerId: 'mgr-1', reply: 'Thanks!' }, 'manager')
    ).rejects.toThrow('You are not authorized to reply to reviews for this establishment');
  });

  it('should update review with manager reply successfully', async () => {
    const fakeReview = Review.create({
      id: '123',
      userId: 'student-1',
      establishmentId: 'est-1',
      foodScore: 5, serviceScore: 5, priceScore: 5,
      comment: 'Very good place.'
    });

    vi.mocked(mockReviewRepo.findById).mockResolvedValue(fakeReview);
    vi.mocked(mockEstablishmentRepo.findById).mockResolvedValue({ id: 'est-1', managerId: 'mgr-1' } as any);
    vi.mocked(mockReviewRepo.update).mockImplementation((r) => Promise.resolve(r));

    const result = await useCase.execute({ reviewId: '123', managerId: 'mgr-1', reply: 'Thank you so much!' }, 'manager');

    expect(result).toBeDefined();
    expect(result.managerReply).toBe('Thank you so much!');
    expect(result.managerReplyAt).toBeInstanceOf(Date);
    expect(mockReviewRepo.update).toHaveBeenCalled();
  });

  it('fires CreateNotificationUseCase for the review author', async () => {
    const review = makeReview();
    vi.mocked(mockReviewRepo.findById).mockResolvedValue(review);
    vi.mocked(mockEstablishmentRepo.findById).mockResolvedValue({ managerId: 'manager-1', id: 'est-1' } as any);
    vi.mocked(mockReviewRepo.update).mockResolvedValue(review);

    await useCase.execute({ reviewId: 'rev-1', managerId: 'manager-1', reply: 'Thank you!' }, 'manager');

    // Wait a tick for the fire-and-forget promise
    await new Promise(r => setTimeout(r, 0));

    expect(mockCreateNotification.execute).toHaveBeenCalledWith({
      userId: 'student-1',
      reviewId: 'rev-1',
    });
  });

  it('does not abort the reply when notification creation fails', async () => {
    const review = makeReview();
    vi.mocked(mockReviewRepo.findById).mockResolvedValue(review);
    vi.mocked(mockEstablishmentRepo.findById).mockResolvedValue({ managerId: 'manager-1', id: 'est-1' } as any);
    vi.mocked(mockReviewRepo.update).mockResolvedValue(review);
    vi.mocked(mockCreateNotification.execute).mockRejectedValue(new Error('DB error'));

    await expect(
      useCase.execute({ reviewId: 'rev-1', managerId: 'manager-1', reply: 'Thank you!' }, 'manager')
    ).resolves.toBeDefined();
  });
});
