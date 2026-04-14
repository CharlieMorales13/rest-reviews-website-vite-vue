import { Establishment } from '../entities/Establishment';

export interface IEstablishmentRepository {
    findById(id: string): Promise<Establishment | null>;
    findBySlug(slug: string): Promise<Establishment | null>;
    findAll(filters?: { name?: string; universityId?: string }, pagination?: { page: number; limit: number }): Promise<{ data: Establishment[]; total: number }>;
    save(establishment: Establishment): Promise<Establishment>;
    update(establishment: Establishment): Promise<Establishment>;
    delete(id: string): Promise<void>;
    findByManagerId(managerId: string): Promise<Establishment[]>;
}
