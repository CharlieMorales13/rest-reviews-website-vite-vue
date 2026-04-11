export interface SentimentSummary {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
}

export interface NegativeTerm {
    term: string;
    mentions: number;
}

/** Distribution of reviews per score (1–5) for one dimension. Index 0 = score 1. */
export type ScoreBins = [number, number, number, number, number];

export interface ScoreDistribution {
    food: ScoreBins;
    service: ScoreBins;
    price: ScoreBins;
}

export interface EstablishmentMetric {
    id: string;
    name: string;
    avgFood: number;
    avgService: number;
    avgPrice: number;
    reviewCount: number;
    sentimentScore: number; // 0-100 based on positive ratio
}

export interface GlobalMetrics {
    sentimentDistribution: SentimentSummary;
    topEstablishments: EstablishmentMetric[];
    totalReviews: number;
    totalUsers: number;
}

export interface EstablishmentMetricSummary extends EstablishmentMetric {
    sentimentDistribution: SentimentSummary;
    reviewsThisMonth: number;
    reviewsLastMonth: number;
    nps: number;
    criticalMentionsCount: number;
    scoreDistribution: ScoreDistribution;
    negativeTerms: NegativeTerm[];
}

export interface IMetricsRepository {
    getGlobalSummary(): Promise<GlobalMetrics>;
    getEstablishmentSummary(id: string): Promise<EstablishmentMetricSummary | null>;
    getHistoricalMetrics(id: string, days: number): Promise<any[]>;
}
