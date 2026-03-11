import { Establishment } from '../entities/Establishment';

export interface IEstablishmentRepository {
    findById(id: string): Promise<Establishment | null>;
    findAll(filters?: { name?: string; universityId?: string }): Promise<Establishment[]>;
    save(establishment: Establishment): Promise<Establishment>;
    update(establishment: Establishment): Promise<Establishment>;
    delete(id: string): Promise<void>;
    findByManagerId(managerId: string): Promise<Establishment[]>;
}
