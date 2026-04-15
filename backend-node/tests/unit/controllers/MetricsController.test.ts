import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { MetricsController } from '@/infrastructure/http/controllers/MetricsController';

describe('MetricsController', () => {
    describe('getSummary', () => {
        it('should return 200 with global metrics data', async () => {
            const mockGlobalMetrics = {
                execute: vi.fn().mockResolvedValue({
                    totalReviews: 100,
                    averageIGE: 85.5
                })
            } as any;

            // @ts-ignore
            const controller = new MetricsController(mockGlobalMetrics, {} as any, {} as any, {} as any);

            const req = {
                user: { role: 'admin' }
            } as any;
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            } as unknown as Response;

            await controller.getSummary(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    totalReviews: 100,
                    averageIGE: 85.5
                }
            });
        });
    });
});
