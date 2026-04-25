import { injectable, inject } from "tsyringe";
import { IReviewRepository } from "../../../domain/repositories/IReviewRepository";
import { CreateNotificationUseCase } from "../notifications/CreateNotificationUseCase";
import { AppError } from "../../../infrastructure/http/errors/AppError";

interface LikeReviewDTO {
  userId: string;
  reviewId: string;
}

@injectable()
export class LikeReviewUseCase {
  constructor(
    @inject("IReviewRepository") private reviewRepository: IReviewRepository,
    @inject(CreateNotificationUseCase)
    private createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    dto: LikeReviewDTO,
  ): Promise<{ likesCount: number; likedByMe: true }> {
    const review = await this.reviewRepository.findById(dto.reviewId);
    if (!review) throw new AppError("Review not found", 404);
    if (review.userId === dto.userId)
      throw new AppError("No puedes dar like a tu propia reseña", 403);
    const already = await this.reviewRepository.hasLiked(
      dto.userId,
      dto.reviewId,
    );
    if (already) throw new AppError("Ya diste like a esta reseña", 409);
    const likesCount = await this.reviewRepository.addLike(
      dto.userId,
      dto.reviewId,
    );
    this.createNotificationUseCase
      .execute({ userId: review.userId, reviewId: dto.reviewId, type: "like" })
      .catch(() => {});
    return { likesCount, likedByMe: true };
  }
}
