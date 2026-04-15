import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { DeleteEstablishmentPostUseCase } from '@/application/use-cases/posts/DeleteEstablishmentPostUseCase';
import { IEstablishmentPostRepository } from '@/domain/repositories/IEstablishmentPostRepository';
import { IEstablishmentRepository } from '@/domain/repositories/IEstablishmentRepository';
import { Establishment } from '@/domain/entities/Establishment';
import { EstablishmentPost } from '@/domain/entities/EstablishmentPost';

const mockEstablishment = Establishment.create({
    id: 'est-uuid',
    name: 'Cuckoo Box',
    slug: 'cuckoo-box',
    managerId: 'manager-uuid',
});

const mockPost = EstablishmentPost.create({
    id: 'post-uuid',
    establishmentId: 'est-uuid',
    authorId: 'manager-uuid',
    content: 'Texto de prueba',
    imageUrls: [],
});

const makePostRepo = (overrides?: Partial<IEstablishmentPostRepository>): IEstablishmentPostRepository => ({
    findById: vi.fn().mockResolvedValue(mockPost),
    delete: vi.fn().mockResolvedValue(undefined),
    save: vi.fn(),
    update: vi.fn(),
    findByEstablishmentId: vi.fn(),
    ...overrides,
});

const makeEstRepo = (overrides?: Partial<IEstablishmentRepository>): IEstablishmentRepository => ({
    findById: vi.fn().mockResolvedValue(mockEstablishment),
    findBySlug: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByManagerId: vi.fn(),
    ...overrides,
});

describe('DeleteEstablishmentPostUseCase', () => {
    it('allows the assigned manager to delete a post', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new DeleteEstablishmentPostUseCase(postRepo, estRepo);

        await uc.execute('post-uuid', { id: 'manager-uuid', role: 'manager' });

        expect(postRepo.delete).toHaveBeenCalledWith('post-uuid');
    });

    it('allows admin to delete any post', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new DeleteEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('post-uuid', { id: 'admin-uuid', role: 'admin' })
        ).resolves.toBeUndefined();
    });

    it('throws 403 when a different manager tries to delete', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new DeleteEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('post-uuid', { id: 'other-manager', role: 'manager' })
        ).rejects.toThrow('You do not have permission to delete this post');
    });

    it('throws 404 when post does not exist', async () => {
        const postRepo = makePostRepo({ findById: vi.fn().mockResolvedValue(null) });
        const estRepo = makeEstRepo();
        const uc = new DeleteEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('no-existe', { id: 'manager-uuid', role: 'manager' })
        ).rejects.toThrow('Post not found');
    });
});
