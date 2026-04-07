import { injectable, inject } from 'tsyringe';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { Review } from '../../../domain/entities/Review';

@injectable()
export class ListUserReviewsUseCase {
    constructor(
        @inject('IReviewRepository') private reviewRepository: IReviewRepository
    ) { }

    async execute(userId: string): Promise<Review[]> {
        return this.reviewRepository.findByUserId(userId);
    }
}
