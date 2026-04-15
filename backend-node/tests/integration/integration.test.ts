import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/infrastructure/http/server';
import type { Server } from 'http';

let server: Server;

beforeAll(async () => {
    // Apply server listening on a dynamic port so tests don't clash
    await new Promise<void>((resolve) => {
        server = app.listen(0, () => resolve());
    });
});

afterAll(async () => {
    // Close HTTP server without destroying Supabase DB
    await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
    });
});

describe('Integration Tests - Auth API', () => {
    it('should fail login with non-existent email', async () => {
        const res = await request(server)
            .post('/api/auth/login')
            .send({
                email: 'noexiste@anahuac.mx',
                password: 'password123'
            });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
    });

    const testEmail = `student${Date.now()}@anahuac.mx`;

    it('should register a new student user and allow login', async () => {
        // Register
        const registerRes = await request(server)
            .post('/api/auth/register')
            .send({
                name: 'Integration Test Student',
                email: testEmail,
                password: 'Password123!',
                role: 'student',
                carrera: 'Ingeniería en Sistemas Computacionales',
            });

        expect(registerRes.status).toBe(201);
        expect(registerRes.body.success).toBe(true);

        // Login
        const loginRes = await request(server)
            .post('/api/auth/login')
            .send({
                email: testEmail,
                password: 'Password123!'
            });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.success).toBe(true);
        expect(loginRes.body.data).toHaveProperty('token');
    });
});

describe('Integration Tests - Establishments API', () => {
    it('should return 200 with list of establishments', async () => {
        const res = await request(server).get('/api/establishments');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return establishments with expected fields', async () => {
        const res = await request(server).get('/api/establishments');

        expect(res.status).toBe(200);
        const first = res.body.data[0];
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('name');
        expect(first).toHaveProperty('slug');
    });
});

describe('Integration Tests - Health Check', () => {
    it('should return 200 OK', async () => {
        const res = await request(server).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
    });
});
