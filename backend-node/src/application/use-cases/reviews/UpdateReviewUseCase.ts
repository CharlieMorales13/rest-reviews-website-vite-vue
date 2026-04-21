import { injectable, inject } from "tsyringe";
import { IReviewRepository } from "../../../domain/repositories/IReviewRepository";
import { UpdateReviewDTO } from "../../dtos/ReviewDTO";
import { Review } from "../../../domain/entities/Review";
import { AppError } from "../../../infrastructure/http/errors/AppError";

@injectable()
export class UpdateReviewUseCase {
  constructor(
    @inject("IReviewRepository") private reviewRepository: IReviewRepository,
  ) {}

  async execute(
    reviewId: string,
    userId: string,
    dto: UpdateReviewDTO,
  ): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new AppError("Review not found", 404);
    if (review.userId !== userId)
      throw new AppError("Forbidden: this review does not belong to you", 403);

    review.updateContent({
      foodScore: dto.foodScore,
      serviceScore: dto.serviceScore,
      priceScore: dto.priceScore,
      title: dto.title,
      comment: dto.comment,
    });

    return this.reviewRepository.update(review);
  }
}
