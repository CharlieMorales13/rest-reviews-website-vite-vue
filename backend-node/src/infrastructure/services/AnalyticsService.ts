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
    async classifyReview(
        reviewId: string,
        text: string,
        foodScore?: number,
        serviceScore?: number,
        priceScore?: number,
    ): Promise<PredictResult> {
        const result = await this._post('/predict', {
            review_id: reviewId,
            text,
            food_score: foodScore ?? null,
            service_score: serviceScore ?? null,
            price_score: priceScore ?? null,
        });
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
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (env.ANALYTICS_API_KEY) headers['X-API-Key'] = env.ANALYTICS_API_KEY;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
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
