import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { DeleteEstablishmentUseCase } from '@/application/use-cases/establishments/DeleteEstablishmentUseCase';
import { UpdateEstablishmentUseCase } from '@/application/use-cases/establishments/UpdateEstablishmentUseCase';
import { IEstablishmentRepository } from '@/domain/repositories/IEstablishmentRepository';

describe('Establishments Use Cases', () => {
    describe('DeleteEstablishmentUseCase', () => {
        it('should throw if establishment not found', async () => {
            const repo: IEstablishmentRepository = {
                findById: vi.fn().mockResolvedValue(null)
            } as any;

            const useCase = new DeleteEstablishmentUseCase(repo);
            await expect(useCase.execute('invalid-id')).rejects.toThrow('Establishment not found');
        });

        it('should call delete on repository', async () => {
            const repo: IEstablishmentRepository = {
                findById: vi.fn().mockResolvedValue({ id: 'valid-id' }),
                delete: vi.fn().mockResolvedValue(undefined)
            } as any;

            const useCase = new DeleteEstablishmentUseCase(repo);
            await useCase.execute('valid-id');
            expect(repo.delete).toHaveBeenCalledWith('valid-id');
        });
    });

    describe('UpdateEstablishmentUseCase', () => {
        it('should update successfully', async () => {
            const repo: IEstablishmentRepository = {
                findById: vi.fn().mockResolvedValue({
                    id: 'e-1',
                    name: 'Old Name',
                    managerId: 'm-1',
                    isActive: true,
                 }),
                update: vi.fn().mockImplementation((e) => Promise.resolve(e))
            } as any;

            const useCase = new UpdateEstablishmentUseCase(repo);
            const result = await useCase.execute('e-1', { name: 'New Name' });
            expect(result).toBeDefined();
            expect(repo.update).toHaveBeenCalled();
        });

        it('should block manager from changing managerId', async () => {
            const repo: IEstablishmentRepository = {
                findById: vi.fn().mockResolvedValue({
                    id: 'e-1',
                    name: 'Old Name',
                    managerId: 'm-1',
                    isActive: true,
                 }),
            } as any;

            const useCase = new UpdateEstablishmentUseCase(repo);
            await expect(
                useCase.execute('e-1', { managerId: 'm-2' }, { id: 'm-1', role: 'manager' })
            ).rejects.toThrow('Only administrators can change the manager');
        });

        it('should block manager from changing isActive status', async () => {
            const repo: IEstablishmentRepository = {
                findById: vi.fn().mockResolvedValue({
                    id: 'e-1',
                    name: 'Old Name',
                    managerId: 'm-1',
                    isActive: true,
                 }),
            } as any;

            const useCase = new UpdateEstablishmentUseCase(repo);
            await expect(
                useCase.execute('e-1', { isActive: false }, { id: 'm-1', role: 'manager' })
            ).rejects.toThrow('Only administrators can change the active state');
        });

        it('should allow admin to change managerId and isActive status', async () => {
            const repo: IEstablishmentRepository = {
                findById: vi.fn().mockResolvedValue({
                    id: 'e-1',
                    name: 'Old Name',
                    managerId: 'm-1',
                    isActive: true,
                 }),
                update: vi.fn().mockImplementation((e) => Promise.resolve(e))
            } as any;

            const useCase = new UpdateEstablishmentUseCase(repo);
            const result = await useCase.execute(
                'e-1',
                { managerId: 'm-2', isActive: false },
                { id: 'admin-1', role: 'admin' }
            );
            expect(result).toBeDefined();
            expect(repo.update).toHaveBeenCalled();
        });
    });
});
