export interface AnalyticsResult {
  accuracy: number;
  f1Score: number;
  sentiment_label: string;
  ige_global: number;
  error?: string;
}

export interface PredictResult {
  review_id: string;
  label: string;
  probability: number;
  model_ready: boolean;
}

export interface IAnalyticsService {
  /** Full pipeline: retrain model + classify all reviews + IGE snapshots. */
  runSentimentAnalysis(): Promise<AnalyticsResult>;

  /** Single-review inference: classify one review immediately at submission time. */
  classifyReview(
    reviewId: string,
    text: string,
    foodScore?: number,
    serviceScore?: number,
    priceScore?: number,
  ): Promise<PredictResult>;
}
