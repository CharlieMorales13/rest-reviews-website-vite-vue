export interface AnalyticsResult {
    accuracy: number;
    f1: number;
    ige_avg: number;
    count: number;
    message?: string;
    status?: string;
}

export interface IAnalyticsService {
    runSentimentAnalysis(): Promise<AnalyticsResult>;
}
