import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { ListEstablishmentPostsUseCase } from './ListEstablishmentPostsUseCase';
import { IEstablishmentPostRepository } from '../../../domain/repositories/IEstablishmentPostRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { Establishment } from '../../../domain/entities/Establishment';
import { EstablishmentPost } from '../../../domain/entities/EstablishmentPost';

const mockEstablishment = Establishment.create({
    id: 'est-uuid',
    name: 'Cuckoo Box',
    slug: 'cuckoo-box',
    managerId: 'manager-uuid',
});

const mockPosts = [
    EstablishmentPost.create({ id: 'p1', establishmentId: 'est-uuid', authorId: 'manager-uuid', content: 'Post 1', imageUrls: [] }),
    EstablishmentPost.create({ id: 'p2', establishmentId: 'est-uuid', authorId: 'manager-uuid', content: 'Post 2', imageUrls: [] }),
];

const makePostRepo = (overrides?: Partial<IEstablishmentPostRepository>): IEstablishmentPostRepository => ({
    findByEstablishmentId: vi.fn().mockResolvedValue({ data: mockPosts, total: 2 }),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
});

const makeEstRepo = (overrides?: Partial<IEstablishmentRepository>): IEstablishmentRepository => ({
    findBySlug: vi.fn().mockResolvedValue(mockEstablishment),
    findById: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByManagerId: vi.fn(),
    ...overrides,
});

describe('ListEstablishmentPostsUseCase', () => {
    it('returns posts for a valid slug', async () => {
        const uc = new ListEstablishmentPostsUseCase(makePostRepo(), makeEstRepo());

        const result = await uc.execute('cuckoo-box', { page: 1, limit: 10 });

        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(2);
    });

    it('throws 404 when establishment does not exist', async () => {
        const uc = new ListEstablishmentPostsUseCase(
            makePostRepo(),
            makeEstRepo({ findBySlug: vi.fn().mockResolvedValue(null) })
        );

        await expect(uc.execute('no-existe')).rejects.toThrow('Establishment not found');
    });

    it('passes pagination to the repository', async () => {
        const postRepo = makePostRepo();
        const uc = new ListEstablishmentPostsUseCase(postRepo, makeEstRepo());

        await uc.execute('cuckoo-box', { page: 2, limit: 5 });

        expect(postRepo.findByEstablishmentId).toHaveBeenCalledWith('est-uuid', { page: 2, limit: 5 });
    });
});
