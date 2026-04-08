import { injectable } from 'tsyringe';
import { IAnalyticsService, AnalyticsResult, PredictResult } from '../../domain/services/IAnalyticsService';
import { AppError } from '../http/errors/AppError';
import { env } from '../config/env.config';

@injectable()
export class AnalyticsService implements IAnalyticsService {

    /** Full pipeline — triggered manually by admin via POST /api/metrics/run */
    async runSentimentAnalysis(): Promise<AnalyticsResult> {
        const result = await this._post('/train', {});
        if (result.error) {
            throw new AppError(result.error, 500);
        }
        return result as AnalyticsResult;
    }

    /**
     * Single-review inference — called automatically on every POST /reviews.
     * Non-blocking from the caller's perspective (fire-and-forget pattern).
     */
    async classifyReview(reviewId: string, text: string): Promise<PredictResult> {
        const result = await this._post('/predict', { review_id: reviewId, text });
        if (result.error) {
            return {
                review_id: reviewId,
                label: 'neutral',
                probability: 0,
                model_ready: false,
            };
        }
        return result as PredictResult;
    }

    private async _post(path: string, body: Record<string, unknown>): Promise<Record<string, any>> {
        const url = `${env.ANALYTICS_URL}${path}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new AppError(`Analytics service error ${response.status}: ${text.slice(0, 200)}`, 500);
            }
            return await response.json();
        } catch (err: any) {
            if (err instanceof AppError) throw err;
            throw new AppError(`Analytics service unreachable: ${err.message}`, 500);
        }
    }
}
