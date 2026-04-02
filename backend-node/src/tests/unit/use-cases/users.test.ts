import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { DeleteUserUseCase } from '../../../application/use-cases/users/DeleteUserUseCase';
import { GetUserProfileUseCase } from '../../../application/use-cases/users/GetUserProfileUseCase';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';

describe('Users Use Cases', () => {
    describe('DeleteUserUseCase', () => {
        it('should correctly call delete on repository', async () => {
            const mockUserRepo: IUserRepository = {
                findById: vi.fn().mockResolvedValue({ id: 'u-1' }),
                delete: vi.fn().mockResolvedValue(undefined)
            } as any;
            
            const useCase = new DeleteUserUseCase(mockUserRepo);
            await useCase.execute('u-1');
            
            expect(mockUserRepo.delete).toHaveBeenCalledWith('u-1');
        });
    });

    describe('GetUserProfileUseCase', () => {
        it('should throw if user not found', async () => {
            const mockUserRepo: IUserRepository = {
                findById: vi.fn().mockResolvedValue(null)
            } as any;
            
            const mockReviewRepo: IReviewRepository = {} as any;
            
            const useCase = new GetUserProfileUseCase(mockUserRepo, mockReviewRepo);
            
            await expect(useCase.execute('invalid')).rejects.toThrow('User not found');
        });
        
        it('should return profile and managed establishments if manager', async () => {
            const mockUserRepo: IUserRepository = {
                findById: vi.fn().mockResolvedValue({ id: 'u-1', role: 'student' })
            } as any;
            
            const mockReviewRepo: IReviewRepository = {
                findByUserId: vi.fn().mockResolvedValue([{ id: 'rev-1', establishmentId: 'est-1', comment: 'test', foodScore: 5, imageUrl: null, createdAt: new Date() }])
            } as any;
            
            const useCase = new GetUserProfileUseCase(mockUserRepo, mockReviewRepo);
            const result = await useCase.execute('u-1');
            
            expect(result.id).toBe('u-1');
            expect(result.stats.totalReviews).toBe(1);
            expect(result.reviews).toBeDefined();
        });
    });
});
