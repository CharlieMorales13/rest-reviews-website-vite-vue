import { Establishment } from '../entities/Establishment';

export interface IEstablishmentRepository {
    findById(id: string): Promise<Establishment | null>;
    findAll(): Promise<Establishment[]>;
    save(establishment: Establishment): Promise<Establishment>;
    update(establishment: Establishment): Promise<Establishment>;
    delete(id: string): Promise<void>;
}
