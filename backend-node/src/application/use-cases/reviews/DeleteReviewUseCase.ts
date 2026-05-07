import { injectable, inject } from "tsyringe";
import { IReviewRepository } from "../../../domain/repositories/IReviewRepository";
import { IAnalyticsService } from "../../../domain/services/IAnalyticsService";
import { AppError } from "../../../infrastructure/http/errors/AppError";
import pino from "pino";

const logger = pino({ name: "DeleteReviewUseCase" });

@injectable()
export class DeleteReviewUseCase {
  constructor(
    @inject("IReviewRepository") private reviewRepository: IReviewRepository,
    @inject("IAnalyticsService") private analyticsService: IAnalyticsService,
  ) {}

  async execute(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new AppError("Review not found", 404);
    if (review.userId !== userId)
      throw new AppError("Forbidden: this review does not belong to you", 403);
    await this.reviewRepository.delete(reviewId);

    this.analyticsService.runSentimentAnalysis().catch((err) => {
      logger.warn(
        { reviewId, err },
        "Snapshot refresh after delete failed silently",
      );
    });
  }
}
