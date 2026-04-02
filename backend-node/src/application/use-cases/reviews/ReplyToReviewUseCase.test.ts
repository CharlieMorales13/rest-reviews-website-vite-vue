import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { ReplyToReviewUseCase } from './ReplyToReviewUseCase';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { AppError } from '../../../infrastructure/http/errors/AppError';
import { Review } from '../../../domain/entities/Review';

describe('ReplyToReviewUseCase', () => {
    it('should throw an error if the review does not exist', async () => {
        const mockReviewRepo: IReviewRepository = {
            findById: vi.fn().mockResolvedValue(null),
        } as unknown as IReviewRepository;

        const mockEstablishmentRepo: IEstablishmentRepository = {} as any;

        const useCase = new ReplyToReviewUseCase(mockReviewRepo, mockEstablishmentRepo);

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

        const mockReviewRepo: IReviewRepository = {
            findById: vi.fn().mockResolvedValue(fakeReview),
        } as unknown as IReviewRepository;

        const mockEstablishmentRepo: IEstablishmentRepository = {
            findById: vi.fn().mockResolvedValue({ id: 'est-1', managerId: 'mgr-2' }) // Different manager!
        } as unknown as IEstablishmentRepository;

        const useCase = new ReplyToReviewUseCase(mockReviewRepo, mockEstablishmentRepo);

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

        const mockReviewRepo: IReviewRepository = {
            findById: vi.fn().mockResolvedValue(fakeReview),
            update: vi.fn().mockImplementation((r) => Promise.resolve(r)),
        } as unknown as IReviewRepository;

        const mockEstablishmentRepo: IEstablishmentRepository = {
            findById: vi.fn().mockResolvedValue({ id: 'est-1', managerId: 'mgr-1' })
        } as unknown as IEstablishmentRepository;

        const useCase = new ReplyToReviewUseCase(mockReviewRepo, mockEstablishmentRepo);

        const result = await useCase.execute({ reviewId: '123', managerId: 'mgr-1', reply: 'Thank you so much!' }, 'manager');

        expect(result).toBeDefined();
        expect(result.managerReply).toBe('Thank you so much!');
        expect(result.managerReplyAt).toBeInstanceOf(Date);
        expect(mockReviewRepo.update).toHaveBeenCalled();
    });
});
