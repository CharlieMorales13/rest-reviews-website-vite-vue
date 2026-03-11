import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { AppError } from '../../../infrastructure/http/errors/AppError';

@injectable()
export class GetUserProfileUseCase {
    constructor(
        @inject('IUserRepository') private userRepository: IUserRepository,
        @inject('IReviewRepository') private reviewRepository: IReviewRepository
    ) { }

    async execute(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const reviews = await this.reviewRepository.findByUserId(userId);

        return {
            id: user.id,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            universityId: user.universityId,
            verified: user.role === 'student' && !!user.universityId,
            stats: {
                totalReviews: reviews.length,
            },
            reviews: reviews.map(r => ({
                id: r.id,
                establishmentId: r.establishmentId,
                comment: r.comment,
                foodScore: r.foodScore,
                imageUrl: r.imageUrl,
                createdAt: r.createdAt
            }))
        };
    }
}
