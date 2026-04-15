import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { CreateEstablishmentUseCase } from '@/application/use-cases/establishments/CreateEstablishmentUseCase';
import { IEstablishmentRepository } from '@/domain/repositories/IEstablishmentRepository';
import { Establishment } from '@/domain/entities/Establishment';

describe('CreateEstablishmentUseCase', () => {
    it('should create an establishment successfully', async () => {
        const mockRepo: IEstablishmentRepository = {
            save: vi.fn().mockImplementation((est: Establishment) => Promise.resolve(est)),
        } as unknown as IEstablishmentRepository;

        const useCase = new CreateEstablishmentUseCase(mockRepo);
        const dto = {
            name: 'Test Restaurant',
            description: 'A great place',
            category: 'Fast Food',
            universityId: 'Uni-123'
        };

        const result = await useCase.execute(dto);

        expect(result).toBeDefined();
        expect(result.name).toBe(dto.name);
        expect(result.universityId).toBe(dto.universityId);
        expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw an error if validation fails in entity', async () => {
        const mockRepo: IEstablishmentRepository = {
            save: vi.fn(),
        } as unknown as IEstablishmentRepository;

        const useCase = new CreateEstablishmentUseCase(mockRepo);

        // Empty name should trigger domain validation error
        await expect(
            useCase.execute({ name: '', description: '...' })
        ).rejects.toThrow('Establishment name cannot be empty');
    });
});
