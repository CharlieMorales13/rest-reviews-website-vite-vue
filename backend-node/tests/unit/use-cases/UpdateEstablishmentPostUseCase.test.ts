import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { UpdateEstablishmentPostUseCase } from '@/application/use-cases/posts/UpdateEstablishmentPostUseCase';
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
    content: 'Texto original',
    imageUrls: [],
});

const makePostRepo = (overrides?: Partial<IEstablishmentPostRepository>): IEstablishmentPostRepository => ({
    findById: vi.fn().mockResolvedValue(mockPost),
    update: vi.fn().mockImplementation((p: EstablishmentPost) => Promise.resolve(p)),
    save: vi.fn(),
    findByEstablishmentId: vi.fn(),
    delete: vi.fn(),
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

describe('UpdateEstablishmentPostUseCase', () => {
    it('allows the manager to update content', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new UpdateEstablishmentPostUseCase(postRepo, estRepo);

        const result = await uc.execute('post-uuid', { content: 'Texto nuevo' }, { id: 'manager-uuid', role: 'manager' });

        expect(result.content).toBe('Texto nuevo');
        expect(postRepo.update).toHaveBeenCalled();
    });

    it('allows the manager to update images', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new UpdateEstablishmentPostUseCase(postRepo, estRepo);

        const result = await uc.execute(
            'post-uuid',
            { imageUrls: ['https://a.com/new.jpg'] },
            { id: 'manager-uuid', role: 'manager' }
        );

        expect(result.imageUrls).toEqual(['https://a.com/new.jpg']);
    });

    it('throws 403 when a different manager tries to update', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new UpdateEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('post-uuid', { content: 'Hack' }, { id: 'other-manager', role: 'manager' })
        ).rejects.toThrow('You do not have permission to edit this post');
    });

    it('throws 404 when post does not exist', async () => {
        const postRepo = makePostRepo({ findById: vi.fn().mockResolvedValue(null) });
        const estRepo = makeEstRepo();
        const uc = new UpdateEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('no-existe', { content: 'Hi' }, { id: 'manager-uuid', role: 'manager' })
        ).rejects.toThrow('Post not found');
    });

    it('allows admin to update any post', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new UpdateEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('post-uuid', { content: 'Admin edit' }, { id: 'admin-uuid', role: 'admin' })
        ).resolves.toBeDefined();
    });
});
