import prisma from '../database/prisma.service';
import { IMetricsRepository, GlobalMetrics, EstablishmentMetricSummary, NegativeTerm, ScoreBins } from '../../domain/repositories/IMetricsRepository';
import { injectable } from 'tsyringe';

@injectable()
export class PrismaMetricsRepository implements IMetricsRepository {
    async getGlobalSummary(): Promise<GlobalMetrics> {
        // 1. Sentiment Distribution
        const sentimentCounts = await prisma.sentimentResult.groupBy({
            by: ['predictedLabel'],
            _count: { _all: true },
        });

        // 2. Counts
        const reviewCount = await prisma.review.count();
        const userCount = await prisma.user.count();

        // 3. Top Establishments (with averages and positive sentiment)
        // We'll calculate this by joining establishments with reviews and their latest sentiment
        // For simplicity and performance, we'll use a raw query or a multi-step aggregation if needed
        const rawEstablishments = await prisma.establishment.findMany({
            include: {
                _count: { select: { reviews: true } },
                reviews: {
                    include: {
                        sentimentResults: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            },
            take: 10
        });

        const topEstablishments = rawEstablishments.map((e: any) => {
            const foodScores = e.reviews.map((r: any) => r.foodScore);
            const serviceScores = e.reviews.map((r: any) => r.serviceScore);
            const priceScores = e.reviews.map((r: any) => r.priceScore);

            const positiveReviews = e.reviews.filter((r: any) =>
                r.sentimentResults[0]?.predictedLabel === 'positive'
            ).length;

            return {
                id: e.id,
                name: e.name,
                avgFood: this.calculateAvg(foodScores),
                avgService: this.calculateAvg(serviceScores),
                avgPrice: this.calculateAvg(priceScores),
                reviewCount: e._count.reviews,
                sentimentScore: e._count.reviews > 0 ? (positiveReviews / e._count.reviews) * 100 : 0
            };
        }).sort((a: any, b: any) => b.sentimentScore - a.sentimentScore);

        return {
            sentimentDistribution: {
                positive: sentimentCounts.find((s: any) => s.predictedLabel === 'positive')?._count._all ?? 0,
                neutral: sentimentCounts.find((s: any) => s.predictedLabel === 'neutral')?._count._all ?? 0,
                negative: sentimentCounts.find((s: any) => s.predictedLabel === 'negative')?._count._all ?? 0,
                total: reviewCount
            },
            topEstablishments,
            totalReviews: reviewCount,
            totalUsers: userCount
        };
    }

    async getEstablishmentSummary(id: string): Promise<EstablishmentMetricSummary | null> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [e, reviewsThisMonth, latestSnapshot] = await Promise.all([
            prisma.establishment.findUnique({
                where: { id },
                include: {
                    _count: { select: { reviews: true } },
                    reviews: {
                        select: {
                            foodScore: true,
                            serviceScore: true,
                            priceScore: true,
                            sentimentResults: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                select: { predictedLabel: true },
                            },
                        },
                    },
                },
            }),
            prisma.review.count({
                where: { establishmentId: id, createdAt: { gte: startOfMonth } },
            }),
            prisma.metricsSnapshot.findFirst({
                where: { establishmentId: id },
                orderBy: { snapshotDate: 'desc' },
                select: { negativeTerms: true },
            }),
        ]);

        if (!e) return null;

        const foodScores = e.reviews.map((r: any) => r.foodScore);
        const serviceScores = e.reviews.map((r: any) => r.serviceScore);
        const priceScores = e.reviews.map((r: any) => r.priceScore);

        const sentimentCounts = {
            positive: e.reviews.filter((r: any) => r.sentimentResults[0]?.predictedLabel === 'positive').length,
            neutral: e.reviews.filter((r: any) => r.sentimentResults[0]?.predictedLabel === 'neutral').length,
            negative: e.reviews.filter((r: any) => r.sentimentResults[0]?.predictedLabel === 'negative').length,
            total: e._count.reviews,
        };

        const positiveRatio = e._count.reviews > 0 ? (sentimentCounts.positive / e._count.reviews) * 100 : 0;

        // Score distribution: bins[0] = # reviews with score 1, ..., bins[4] = score 5
        const foodBins: ScoreBins = [0, 0, 0, 0, 0];
        const serviceBins: ScoreBins = [0, 0, 0, 0, 0];
        const priceBins: ScoreBins = [0, 0, 0, 0, 0];
        for (const r of e.reviews) {
            foodBins[(r as any).foodScore - 1]++;
            serviceBins[(r as any).serviceScore - 1]++;
            priceBins[(r as any).priceScore - 1]++;
        }

        const negativeTerms: NegativeTerm[] =
            Array.isArray(latestSnapshot?.negativeTerms)
                ? (latestSnapshot.negativeTerms as unknown as NegativeTerm[])
                : [];

        return {
            id: e.id,
            name: e.name,
            avgFood: this.calculateAvg(foodScores),
            avgService: this.calculateAvg(serviceScores),
            avgPrice: this.calculateAvg(priceScores),
            reviewCount: e._count.reviews,
            sentimentScore: Number(positiveRatio.toFixed(1)),
            sentimentDistribution: sentimentCounts,
            reviewsThisMonth,
            scoreDistribution: { food: foodBins, service: serviceBins, price: priceBins },
            negativeTerms,
        };
    }

    async getHistoricalMetrics(id: string, days: number): Promise<any[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return await prisma.metricsSnapshot.findMany({
            where: {
                establishmentId: id,
                snapshotDate: {
                    gte: startDate
                }
            },
            orderBy: {
                snapshotDate: 'asc'
            }
        });
    }

    private calculateAvg(scores: number[]): number {
        if (scores.length === 0) return 0;
        const sum = scores.reduce((a, b) => a + b, 0);
        return Number((sum / scores.length).toFixed(2));
    }
}
