import { injectable, inject } from 'tsyringe';
import { Review } from '../../../domain/entities/Review';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { ReplyReviewDTO } from '../../dtos/ReviewDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class ReplyToReviewUseCase {
    constructor(
        @inject('IReviewRepository') private reviewRepository: IReviewRepository,
        @inject('IEstablishmentRepository') private establishmentRepository: IEstablishmentRepository
    ) { }

    async execute(dto: ReplyReviewDTO, userRole: string): Promise<Review> {
        // 1. Verify Review exists
        const review = await this.reviewRepository.findById(dto.reviewId);
        if (!review) {
            throw new AppError('Review not found', 404);
        }

        // 2. Fetch the establishment to verify ownership
        const establishment = await this.establishmentRepository.findById(review.establishmentId);
        if (!establishment) {
            throw new AppError('Establishment not found', 404);
        }

        // 3. Verify user is authorized (must be admin or the manager of THIS establishment)
        if (userRole !== 'admin' && establishment.managerId?.toString() !== dto.managerId) {
            throw new AppError('You are not authorized to reply to reviews for this establishment', 403);
        }

        // 4. Update Domain Entity
        review.addManagerReply(dto.reply);

        // 5. Save to database
        return await this.reviewRepository.update(review);
    }
}
