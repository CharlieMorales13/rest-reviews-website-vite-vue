import { injectable, inject } from 'tsyringe';
import { Review } from '../../../domain/entities/Review';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IEstablishmentRepository } from '../../../domain/repositories/IEstablishmentRepository';
import { ClassifyReviewUseCase } from './ClassifyReviewUseCase';
import { CreateReviewDTO } from '../../dtos/ReviewDTO';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class CreateReviewUseCase {
    constructor(
        @inject('IReviewRepository') private reviewRepository: IReviewRepository,
        @inject('IUserRepository') private userRepository: IUserRepository,
        @inject('IEstablishmentRepository') private establishmentRepository: IEstablishmentRepository,
        @inject(ClassifyReviewUseCase) private classifyReviewUseCase: ClassifyReviewUseCase,
    ) { }

    async execute(dto: CreateReviewDTO): Promise<Review> {
        // 1. Verify user exists and is active
        const user = await this.userRepository.findById(dto.userId);
        if (!user || user.isActive === false) {
            throw new AppError('User not found or inactive', 404);
        }

        // 2. Verify establishment exists and is active
        const establishment = await this.establishmentRepository.findById(dto.establishmentId);
        if (!establishment || establishment.isActive === false) {
            throw new AppError('Establishment not found or inactive', 404);
        }

        // 3. Create and persist the review
        const newReview = Review.create({
            userId: dto.userId,
            establishmentId: dto.establishmentId,
            foodScore: dto.foodScore,
            serviceScore: dto.serviceScore,
            priceScore: dto.priceScore,
            comment: dto.comment,
            imageUrl: dto.imageUrl,
        });

        const saved = await this.reviewRepository.save(newReview);

        // 5. Fire-and-forget: classify sentiment immediately, never block the HTTP response
        this.classifyReviewUseCase.execute(saved.id!, dto.comment ?? '');

        return saved;
    }
}
