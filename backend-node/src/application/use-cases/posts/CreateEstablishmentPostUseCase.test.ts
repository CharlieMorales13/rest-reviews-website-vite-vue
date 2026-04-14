import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { CreateEstablishmentPostUseCase } from './CreateEstablishmentPostUseCase';
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

const makePostRepo = (overrides?: Partial<IEstablishmentPostRepository>): IEstablishmentPostRepository => ({
    save: vi.fn().mockImplementation((p: EstablishmentPost) => Promise.resolve(p)),
    findById: vi.fn(),
    findByEstablishmentId: vi.fn(),
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

describe('CreateEstablishmentPostUseCase', () => {
    it('allows the assigned manager to create a post', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new CreateEstablishmentPostUseCase(postRepo, estRepo);

        const result = await uc.execute(
            'cuckoo-box',
            { content: 'Menú del día: tacos', imageUrls: [] },
            { id: 'manager-uuid', role: 'manager' }
        );

        expect(result.content).toBe('Menú del día: tacos');
        expect(postRepo.save).toHaveBeenCalled();
    });

    it('allows an admin to create a post for any establishment', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new CreateEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('cuckoo-box', { content: 'Admin post', imageUrls: [] }, { id: 'admin-uuid', role: 'admin' })
        ).resolves.toBeDefined();
    });

    it('throws 403 when a manager tries to post for a different establishment', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new CreateEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('cuckoo-box', { content: 'Hack', imageUrls: [] }, { id: 'other-manager', role: 'manager' })
        ).rejects.toThrow('You do not have permission to post for this establishment');
    });

    it('throws 404 when establishment does not exist', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo({ findBySlug: vi.fn().mockResolvedValue(null) });
        const uc = new CreateEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('no-existe', { content: 'Hi', imageUrls: [] }, { id: 'manager-uuid', role: 'manager' })
        ).rejects.toThrow('Establishment not found');
    });

    it('throws domain error when content is empty', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new CreateEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('cuckoo-box', { content: '', imageUrls: [] }, { id: 'manager-uuid', role: 'manager' })
        ).rejects.toThrow('Post content cannot be empty');
    });

    it('throws domain error when more than 4 images are provided', async () => {
        const postRepo = makePostRepo();
        const estRepo = makeEstRepo();
        const uc = new CreateEstablishmentPostUseCase(postRepo, estRepo);

        await expect(
            uc.execute('cuckoo-box', {
                content: 'Foto spam',
                imageUrls: ['https://a.com/1.jpg', 'https://a.com/2.jpg', 'https://a.com/3.jpg', 'https://a.com/4.jpg', 'https://a.com/5.jpg'],
            }, { id: 'manager-uuid', role: 'manager' })
        ).rejects.toThrow('Post cannot have more than 4 images');
    });
});
