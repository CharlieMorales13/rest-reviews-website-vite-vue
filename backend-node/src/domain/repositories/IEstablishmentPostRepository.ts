import { EstablishmentPost } from '../entities/EstablishmentPost';

export interface IEstablishmentPostRepository {
    findByEstablishmentId(
        establishmentId: string,
        pagination?: { page: number; limit: number }
    ): Promise<{ data: EstablishmentPost[]; total: number }>;
    findById(id: string): Promise<EstablishmentPost | null>;
    save(post: EstablishmentPost): Promise<EstablishmentPost>;
    update(post: EstablishmentPost): Promise<EstablishmentPost>;
    delete(id: string): Promise<void>;
}
