import { injectable, inject } from 'tsyringe';
import { Review } from '../../../domain/entities/Review';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class ListEstablishmentReviewsUseCase {
    constructor(
        @inject('IReviewRepository') private reviewRepository: IReviewRepository,
        @inject('IEstablishmentRepository') private establishmentRepository: IEstablishmentRepository
    ) { }

    async execute(
        establishmentId: string,
        pagination?: { page: number; limit: number }
    ): Promise<{ data: Review[]; total: number }> {
        // 1. Verify Establishment exists
        const establishment = await this.establishmentRepository.findById(establishmentId);
        if (!establishment) {
            throw new AppError('Establishment not found', 404);
        }

        // 2. Fetch reviews (Rich data now included by repository)
        return await this.reviewRepository.findByEstablishmentId(establishmentId, pagination);
    }
}
