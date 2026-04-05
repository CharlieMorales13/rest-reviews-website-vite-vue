import { spawn } from 'child_process';
import path from 'path';
import { injectable } from 'tsyringe';
import { IAnalyticsService, AnalyticsResult, PredictResult } from '../../domain/services/IAnalyticsService';
import { AppError } from '../http/errors/AppError';

const PYTHON_PATH = path.join(__dirname, '../../../../backend-analytics/venv/Scripts/python.exe');
const SCRIPT_PATH = path.join(__dirname, '../../../../backend-analytics/sentiment_model.py');

@injectable()
export class AnalyticsService implements IAnalyticsService {

    /** Full pipeline — triggered manually by admin via POST /api/metrics/run */
    async runSentimentAnalysis(): Promise<AnalyticsResult> {
        const result = await this._callPython({ mode: 'train' });
        if (result.error) {
            throw new AppError(result.error, 500);
        }
        return result as AnalyticsResult;
    }

    /**
     * Single-review inference — called automatically on every POST /reviews.
     * Non-blocking from the caller's perspective (fire-and-forget pattern).
     * Loads the cached model; does NOT retrain.
     */
    async classifyReview(reviewId: string, text: string): Promise<PredictResult> {
        const result = await this._callPython({ mode: 'predict', review_id: reviewId, text });
        if (result.error) {
            // Degraded gracefully — model may not be trained yet
            return {
                review_id: reviewId,
                label: 'neutral',
                probability: 0,
                model_ready: false,
            };
        }
        return result as PredictResult;
    }

    /** Spawn the Python process, write payload to stdin, collect stdout JSON. */
    private _callPython(payload: Record<string, string>): Promise<Record<string, any>> {
        return new Promise((resolve, reject) => {
            const python = spawn(PYTHON_PATH, [SCRIPT_PATH]);

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (d) => { stdout += d.toString(); });
            python.stderr.on('data', (d) => { stderr += d.toString(); });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new AppError(
                        `Analytics process exited with code ${code}: ${stderr.slice(0, 200)}`,
                        500,
                    ));
                    return;
                }
                try {
                    resolve(JSON.parse(stdout));
                } catch {
                    reject(new AppError('Analytics returned invalid JSON', 500));
                }
            });

            python.on('error', (err) => {
                reject(new AppError(`Failed to spawn analytics process: ${err.message}`, 500));
            });

            // Send payload via stdin and close the pipe
            python.stdin.write(JSON.stringify(payload));
            python.stdin.end();
        });
    }
}
