import { Review } from '../entities/Review';

export interface IReviewRepository {
    findById(id: string): Promise<Review | null>;
    findAll(pagination?: { page: number; limit: number }): Promise<{ data: Review[]; total: number }>;
    findByEstablishmentId(establishmentId: string, pagination?: { page: number; limit: number }): Promise<{ data: Review[]; total: number }>;
    findByUserId(userId: string): Promise<Review[]>;
    save(review: Review): Promise<Review>;
    update(review: Review): Promise<Review>;
    delete(id: string): Promise<void>;
}
