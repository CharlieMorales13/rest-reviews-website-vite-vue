import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { AuthController } from '@/infrastructure/http/controllers/AuthController';

describe('AuthController', () => {
    describe('login', () => {
        it('should return 200 and tokens upon successful login', async () => {
            const mockLoginUseCase = {
                execute: vi.fn().mockResolvedValue({
                    token: 'fake-jwt-token',
                    refreshToken: 'fake-refresh-token'
                })
            } as any;

            const controller = new AuthController({} as any, mockLoginUseCase, {} as any, {} as any, {} as any);

            const req = {
                body: { email: 'student@anahuac.mx', password: 'password123' }
            } as Request;

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
                cookie: vi.fn()
            } as unknown as Response;

            const next = vi.fn();

            await controller.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ token: 'fake-jwt-token' })
            }));
        });
    });
});
