import { injectable, inject } from "tsyringe";
import { IReviewRepository } from "../../../domain/repositories/IReviewRepository";
import { AppError } from "../../../infrastructure/http/errors/AppError";

interface UnlikeReviewDTO {
  userId: string;
  reviewId: string;
}

@injectable()
export class UnlikeReviewUseCase {
  constructor(
    @inject("IReviewRepository") private reviewRepository: IReviewRepository,
  ) {}

  async execute(
    dto: UnlikeReviewDTO,
  ): Promise<{ likesCount: number; likedByMe: false }> {
    const liked = await this.reviewRepository.hasLiked(
      dto.userId,
      dto.reviewId,
    );
    if (!liked) throw new AppError("No habías dado like a esta reseña", 404);
    const likesCount = await this.reviewRepository.removeLike(
      dto.userId,
      dto.reviewId,
    );
    return { likesCount, likedByMe: false };
  }
}
