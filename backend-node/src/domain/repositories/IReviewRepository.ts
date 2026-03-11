import { Review } from '../entities/Review';

export interface IReviewRepository {
    findById(id: string): Promise<Review | null>;
    findByEstablishmentId(establishmentId: string, pagination?: { page: number; limit: number }): Promise<{ data: Review[]; total: number }>;
    findByUserId(userId: string): Promise<Review[]>;
    save(review: Review): Promise<Review>;

    /**
     * PRD Requirement: Verify if a user has already reviewed an establishment
     */
    hasUserReviewedEstablishment(userId: string, establishmentId: string): Promise<boolean>;
}
