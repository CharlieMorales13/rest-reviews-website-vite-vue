import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { EstablishmentController } from '../../../infrastructure/http/controllers/EstablishmentController';

describe('EstablishmentController', () => {
    describe('getAll', () => {
        it('should return 200 with paginated establishments', async () => {
            const mockListUseCase = {
                execute: vi.fn().mockResolvedValue({
                    data: [{ id: 'e-1', name: 'Test' }],
                    total: 1
                })
            } as any;
            
            // @ts-ignore
            const controller = new EstablishmentController({} as any, {} as any, mockListUseCase, {} as any, {} as any);
            
            const req = {
                query: { page: '1', limit: '10' }
            } as unknown as Request;
            
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            } as unknown as Response;
            
            await controller.getAll(req, res);
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.any(Array),
                meta: expect.objectContaining({
                    totalPages: 1
                })
            }));
        });
    });
});
