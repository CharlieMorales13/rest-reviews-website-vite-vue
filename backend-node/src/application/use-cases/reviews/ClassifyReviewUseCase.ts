import { injectable, inject } from "tsyringe";
import { IAnalyticsService } from "../../../domain/services/IAnalyticsService";
import pino from "pino";

const logger = pino({ name: "ClassifyReviewUseCase" });

@injectable()
export class ClassifyReviewUseCase {
  constructor(
    @inject("IAnalyticsService") private analyticsService: IAnalyticsService,
  ) {}

  /**
   * Classify the sentiment of a single review immediately after it is saved.
   * This method is called fire-and-forget — it never throws to the caller.
   */
  async execute(
    reviewId: string,
    text: string,
    foodScore?: number,
    serviceScore?: number,
    priceScore?: number,
  ): Promise<void> {
    try {
      const result = await this.analyticsService.classifyReview(
        reviewId,
        text ?? "",
        foodScore,
        serviceScore,
        priceScore,
      );
      if (!result.model_ready) {
        logger.warn(
          { reviewId },
          "Sentiment model not ready — classification skipped. " +
            "Run POST /api/metrics/run to train the model first.",
        );
        return;
      }
      logger.info(
        { reviewId, label: result.label, probability: result.probability },
        "Review classified successfully",
      );
      // Refresh metrics snapshot so the manager dashboard reflects the new review
      // immediately instead of waiting for the 2 AM cron.
      this.analyticsService.runSentimentAnalysis().catch((err) => {
        logger.warn({ reviewId, err }, "Snapshot refresh failed silently");
      });
    } catch (err) {
      // Never propagate — the review is already saved; classification is best-effort
      logger.error({ reviewId, err }, "classifyReview failed silently");
    }
  }
}
