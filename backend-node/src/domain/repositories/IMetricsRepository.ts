export interface SentimentSummary {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
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
}

export interface IMetricsRepository {
    getGlobalSummary(): Promise<GlobalMetrics>;
    getEstablishmentSummary(id: string): Promise<EstablishmentMetricSummary | null>;
}
