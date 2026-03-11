import { injectable, inject } from 'tsyringe';
import { Review } from '../../../domain/entities/Review';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { CreateReviewDTO } from '../../dtos/ReviewDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class CreateReviewUseCase {
    constructor(
        @inject('IReviewRepository') private reviewRepository: IReviewRepository,
        @inject('IUserRepository') private userRepository: IUserRepository,
        @inject('IEstablishmentRepository') private establishmentRepository: IEstablishmentRepository
    ) { }

    async execute(dto: CreateReviewDTO): Promise<Review> {
        // 1. Verify User exists and is active
        const user = await this.userRepository.findById(dto.userId);
        if (!user || user.isActive === false) {
            throw new AppError('User not found or inactive', 404);
        }

        // 2. Verify Establishment exists and is active
        const establishment = await this.establishmentRepository.findById(dto.establishmentId);
        if (!establishment || establishment.isActive === false) {
            throw new AppError('Establishment not found or inactive', 404);
        }

        // 3. Verify Business Constraint PRD: One review per user per establishment
        const hasReviewed = await this.reviewRepository.hasUserReviewedEstablishment(dto.userId, dto.establishmentId);
        if (hasReviewed) {
            throw new AppError('User has already reviewed this establishment', 409);
        }

        // 4. Create Entity (this validates scores and comment length internally)
        const newReview = Review.create({
            userId: dto.userId,
            establishmentId: dto.establishmentId,
            foodScore: dto.foodScore,
            serviceScore: dto.serviceScore,
            priceScore: dto.priceScore,
            comment: dto.comment,
            imageUrl: dto.imageUrl,
        });

        // 5. Save to database
        return await this.reviewRepository.save(newReview);
    }
}
