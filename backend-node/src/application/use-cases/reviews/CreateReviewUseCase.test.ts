import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { CreateReviewUseCase } from './CreateReviewUseCase';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';

describe('CreateReviewUseCase', () => {
    it('should throw an error if the user does not exist or is inactive', async () => {
        const mockUserRepository: IUserRepository = {
            findById: vi.fn().mockResolvedValue(null),
            findByEmail: vi.fn(),
            save: vi.fn(),
        } as unknown as IUserRepository;

        const mockEstablishmentRepo: IEstablishmentRepository = {} as any;
        const mockReviewRepo: IReviewRepository = {} as any;

        const useCase = new CreateReviewUseCase(mockReviewRepo, mockUserRepository, mockEstablishmentRepo);

        await expect(
            useCase.execute({
                userId: 'user-id',
                establishmentId: 'est-id',
                foodScore: 5,
                serviceScore: 5,
                priceScore: 5,
                comment: 'Test comment'
            })
        ).rejects.toThrow('User not found or inactive');
    });

    it('should create a review successfully when all checks pass', async () => {
        const mockUserRepository: IUserRepository = {
            findById: vi.fn().mockResolvedValue({ id: 'user-id', isActive: true }),
        } as unknown as IUserRepository;

        const mockEstablishmentRepo: IEstablishmentRepository = {
            findById: vi.fn().mockResolvedValue({ id: 'est-id', isActive: true }),
        } as unknown as IEstablishmentRepository;

        const mockReviewRepo: IReviewRepository = {
            save: vi.fn().mockImplementation((review) => Promise.resolve(review)),
        } as unknown as IReviewRepository;

        const useCase = new CreateReviewUseCase(mockReviewRepo, mockUserRepository, mockEstablishmentRepo);

        const result = await useCase.execute({
            userId: 'user-id',
            establishmentId: 'est-id',
            foodScore: 4,
            serviceScore: 5,
            priceScore: 3,
            comment: 'Great place!'
        });

        expect(result).toBeDefined();
        expect(result.foodScore).toBe(4);
        expect(mockReviewRepo.save).toHaveBeenCalled();
    });
});
