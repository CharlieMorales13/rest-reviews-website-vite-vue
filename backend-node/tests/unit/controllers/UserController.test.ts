import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { UserController } from '@/infrastructure/http/controllers/UserController';

describe('UserController', () => {
    describe('getProfile', () => {
        it('should return 200 and user data', async () => {
            const mockGetUser = {
                execute: vi.fn().mockResolvedValue({
                    id: 'usr1',
                    name: 'Test'
                })
            } as any;

            // @ts-ignore
            const controller = new UserController({} as any, {} as any, {} as any, {} as any, mockGetUser);

            const req = {
                user: { userId: 'usr1' },
                params: { id: 'usr1' }
            } as any;

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            } as unknown as Response;

            await controller.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'usr1',
                    name: 'Test'
                }
            });
        });
    });
});
