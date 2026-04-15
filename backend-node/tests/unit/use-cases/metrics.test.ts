import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { GetHistoricalMetricsUseCase } from '@/application/use-cases/metrics/GetHistoricalMetricsUseCase';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';
import { IEstablishmentRepository } from '@/domain/repositories/IEstablishmentRepository';

describe('Metrics Use Cases', () => {
    describe('GetHistoricalMetricsUseCase', () => {
        it('should ensure the mathematical data is formatted properly', async () => {
            const mockEstRepo: IEstablishmentRepository = {
                findById: vi.fn().mockResolvedValue({ id: 'est-1' })
            } as any;

            const mockMetricsRepo: IMetricsRepository = {
                getHistoricalMetrics: vi.fn().mockResolvedValue([
                    { snapshotDate: new Date('2026-04-01'), ige: 80.5, avgFood: 5, avgService: 5, avgPrice: 5, totalReviews: 1 }
                ])
            } as any;

            const useCase = new GetHistoricalMetricsUseCase(mockMetricsRepo, mockEstRepo);
            const result = await useCase.execute('est-1', 30);

            expect(result.series.length).toBe(1);
            expect(result.series[0].ige).toBe(80.5);
            expect(mockMetricsRepo.getHistoricalMetrics).toHaveBeenCalledWith('est-1', 30);
        });
    });
});
