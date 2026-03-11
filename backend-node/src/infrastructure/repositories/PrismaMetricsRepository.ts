import prisma from '../database/prisma.service';
import { IMetricsRepository, GlobalMetrics, EstablishmentMetricSummary } from '../../domain/repositories/IMetricsRepository';
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
        const e = await prisma.establishment.findUnique({
            where: { id },
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
            }
        });

        if (!e) return null;

        const foodScores = e.reviews.map((r: any) => r.foodScore);
        const serviceScores = e.reviews.map((r: any) => r.serviceScore);
        const priceScores = e.reviews.map((r: any) => r.priceScore);

        const sentimentCounts = {
            positive: e.reviews.filter((r: any) => r.sentimentResults[0]?.predictedLabel === 'positive').length,
            neutral: e.reviews.filter((r: any) => r.sentimentResults[0]?.predictedLabel === 'neutral').length,
            negative: e.reviews.filter((r: any) => r.sentimentResults[0]?.predictedLabel === 'negative').length,
            total: e._count.reviews
        };

        const positiveRatio = e._count.reviews > 0 ? (sentimentCounts.positive / e._count.reviews) * 100 : 0;

        return {
            id: e.id,
            name: e.name,
            avgFood: this.calculateAvg(foodScores),
            avgService: this.calculateAvg(serviceScores),
            avgPrice: this.calculateAvg(priceScores),
            reviewCount: e._count.reviews,
            sentimentScore: Number(positiveRatio.toFixed(1)),
            sentimentDistribution: sentimentCounts
        };
    }

    private calculateAvg(scores: number[]): number {
        if (scores.length === 0) return 0;
        const sum = scores.reduce((a, b) => a + b, 0);
        return Number((sum / scores.length).toFixed(2));
    }
}
