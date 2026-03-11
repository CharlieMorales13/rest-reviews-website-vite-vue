import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { ListEstablishmentReviewsUseCase } from './ListEstablishmentReviewsUseCase';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';

describe('ListEstablishmentReviewsUseCase', () => {
    it('should return reviews for an existing establishment', async () => {
        const mockEstRepo: IEstablishmentRepository = {
            findById: vi.fn().mockResolvedValue({ id: 'est-1', name: 'Test' }),
        } as unknown as IEstablishmentRepository;

        const mockReviewRepo: IReviewRepository = {
            findByEstablishmentId: vi.fn().mockResolvedValue({
                data: [
                    { id: 'rev-1', comment: 'Good', foodScore: 5 },
                    { id: 'rev-2', comment: 'Bad', foodScore: 2 }
                ],
                total: 2
            }),
        } as unknown as IReviewRepository;

        const useCase = new ListEstablishmentReviewsUseCase(mockReviewRepo, mockEstRepo);
        const result = await useCase.execute('est-1');

        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(mockEstRepo.findById).toHaveBeenCalledWith('est-1');
        expect(mockReviewRepo.findByEstablishmentId).toHaveBeenCalledWith('est-1', undefined);
    });

    it('should throw 404 if establishment does not exist', async () => {
        const mockEstRepo: IEstablishmentRepository = {
            findById: vi.fn().mockResolvedValue(null),
        } as unknown as IEstablishmentRepository;

        const mockReviewRepo: IReviewRepository = {} as any;

        const useCase = new ListEstablishmentReviewsUseCase(mockReviewRepo, mockEstRepo);

        await expect(useCase.execute('invalid-id')).rejects.toThrow('Establishment not found');
    });
});
