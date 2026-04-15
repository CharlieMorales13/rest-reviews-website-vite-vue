import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { ReviewController } from '@/infrastructure/http/controllers/ReviewController';

describe('ReviewController', () => {
    it('should return 200 and success response when replying to review', async () => {
        // Mock UseCases
        const mockCreate = {} as any;
        const mockListEst = {} as any;
        const mockListAll = {} as any;

        // Setup mock for Reply to Review
        const mockReply = {
            execute: vi.fn().mockResolvedValue({
                id: '123',
                managerReply: 'Hello there',
                managerReplyAt: new Date()
            })
        };

        const controller = new ReviewController(
            mockCreate, mockListEst, mockListAll,
            {} as any,       // listUserReviewsUseCase
            mockReply as any,
            {} as any,       // updateReviewUseCase
            {} as any,       // deleteReviewUseCase
            {} as any,       // classifyReviewUseCase
        );

        const req = {
            params: { id: '123e4567-e89b-12d3-a456-426614174000' },
            body: { reply: 'Hello there' },
            user: { userId: '123e4567-e89b-12d3-a456-426614174001', role: 'manager' }
        } as unknown as Request;

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        } as unknown as Response;

        const next = vi.fn();

        await controller.reply(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ managerReply: 'Hello there' })
        }));
    });
});
