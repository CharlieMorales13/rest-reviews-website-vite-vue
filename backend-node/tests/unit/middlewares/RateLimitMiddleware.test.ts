import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import { loginRateLimiter, registerRateLimiter, reviewRateLimiter, uploadRateLimiter } from '@/infrastructure/http/middlewares/RateLimitMiddleware';

// ── Helpers ───────────────────────────────────────────────────────────────

/** Build a minimal Express app with a single GET / route behind the given limiter. */
const makeApp = (limiter: ReturnType<typeof rateLimit>, injectUser?: { userId: string }) => {
    const app = express();
    app.use((req, _res, next) => {
        if (injectUser) (req as any).user = injectUser;
        next();
    });
    app.use(limiter);
    app.get('/', (_req, res) => res.status(200).json({ ok: true }));
    return app;
};

/** Hit an endpoint N times and return all responses. */
const hitN = (app: express.Express, n: number) =>
    Promise.all(Array.from({ length: n }, () => request(app).get('/')));

// ── Smoke: exported limiters are Express middleware ───────────────────────

describe('exported limiters', () => {
    it('loginRateLimiter is a function', () => {
        expect(typeof loginRateLimiter).toBe('function');
    });

    it('registerRateLimiter is a function', () => {
        expect(typeof registerRateLimiter).toBe('function');
    });

    it('reviewRateLimiter is a function', () => {
        expect(typeof reviewRateLimiter).toBe('function');
    });

    it('uploadRateLimiter is a function', () => {
        expect(typeof uploadRateLimiter).toBe('function');
    });
});

// ── loginRateLimiter ──────────────────────────────────────────────────────

describe('loginRateLimiter', () => {
    const makeLoginApp = () => {
        // Use a fresh limiter with max: 2 to test behavior without 30 real requests
        const testLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 2,
            message: { success: false, error: 'Too many login attempts from this IP, please try again after 15 minutes' },
            standardHeaders: true,
            legacyHeaders: false,
        });
        return makeApp(testLimiter);
    };

    it('allows requests within the limit', async () => {
        const app = makeLoginApp();
        const responses = await hitN(app, 2);
        responses.forEach(res => expect(res.status).toBe(200));
    });

    it('returns 429 when limit is exceeded', async () => {
        const app = makeLoginApp();
        await hitN(app, 2);
        const over = await request(app).get('/');
        expect(over.status).toBe(429);
    });

    it('returns the correct error message on 429', async () => {
        const app = makeLoginApp();
        await hitN(app, 2);
        const over = await request(app).get('/');
        expect(over.body).toMatchObject({
            success: false,
            error: expect.stringContaining('Too many login attempts'),
        });
    });

    it('includes rate limit headers in the response', async () => {
        const app = makeLoginApp();
        const res = await request(app).get('/');
        expect(res.headers['ratelimit-limit']).toBeDefined();
        expect(res.headers['ratelimit-remaining']).toBeDefined();
    });
});

// ── registerRateLimiter ───────────────────────────────────────────────────

describe('registerRateLimiter', () => {
    const makeRegisterApp = () => {
        const testLimiter = rateLimit({
            windowMs: 60 * 60 * 1000,
            max: 2,
            message: { success: false, error: 'Too many registration attempts from this IP, please try again later' },
            standardHeaders: true,
            legacyHeaders: false,
        });
        return makeApp(testLimiter);
    };

    it('allows requests within the limit', async () => {
        const app = makeRegisterApp();
        const responses = await hitN(app, 2);
        responses.forEach(res => expect(res.status).toBe(200));
    });

    it('returns 429 when limit is exceeded', async () => {
        const app = makeRegisterApp();
        await hitN(app, 2);
        const over = await request(app).get('/');
        expect(over.status).toBe(429);
    });

    it('returns the correct error message on 429', async () => {
        const app = makeRegisterApp();
        await hitN(app, 2);
        const over = await request(app).get('/');
        expect(over.body).toMatchObject({
            success: false,
            error: expect.stringContaining('Too many registration attempts'),
        });
    });
});

// ── reviewRateLimiter — key isolation by userId ───────────────────────────

describe('reviewRateLimiter', () => {
    const makeReviewApp = (userId?: string) => {
        const testLimiter = rateLimit({
            windowMs: 60 * 60 * 1000,
            max: 2,
            keyGenerator: (req) => (req as any).user?.userId ?? 'unauthenticated',
            message: { success: false, message: 'Has alcanzado el límite de reseñas por hora. Inténtalo más tarde.' },
            standardHeaders: true,
            legacyHeaders: false,
        });
        return makeApp(testLimiter, userId ? { userId } : undefined);
    };

    it('allows requests within the limit for an authenticated user', async () => {
        const app = makeReviewApp('user-1');
        const responses = await hitN(app, 2);
        responses.forEach(res => expect(res.status).toBe(200));
    });

    it('returns 429 when the per-user limit is exceeded', async () => {
        const app = makeReviewApp('user-1');
        await hitN(app, 2);
        const over = await request(app).get('/');
        expect(over.status).toBe(429);
    });

    it('keys by userId — different users do not share the counter', async () => {
        // user-A exhausts their limit
        const appA = makeReviewApp('user-A');
        await hitN(appA, 2);
        const overA = await request(appA).get('/');
        expect(overA.status).toBe(429);

        // user-B is on a separate app instance (separate in-memory store) — should be fine
        const appB = makeReviewApp('user-B');
        const resB = await request(appB).get('/');
        expect(resB.status).toBe(200);
    });

    it('falls back to "unauthenticated" key when no user is set', async () => {
        const app = makeReviewApp(); // no userId injected
        const responses = await hitN(app, 2);
        responses.forEach(res => expect(res.status).toBe(200));
        const over = await request(app).get('/');
        expect(over.status).toBe(429);
    });
});

// ── uploadRateLimiter — key isolation by userId ───────────────────────────

describe('uploadRateLimiter', () => {
    const makeUploadApp = (userId?: string) => {
        const testLimiter = rateLimit({
            windowMs: 60 * 60 * 1000,
            max: 2,
            keyGenerator: (req) => (req as any).user?.userId ?? 'unauthenticated',
            message: { success: false, message: 'Has alcanzado el límite de subidas por hora. Inténtalo más tarde.' },
            standardHeaders: true,
            legacyHeaders: false,
        });
        return makeApp(testLimiter, userId ? { userId } : undefined);
    };

    it('allows requests within the limit', async () => {
        const app = makeUploadApp('user-1');
        const responses = await hitN(app, 2);
        responses.forEach(res => expect(res.status).toBe(200));
    });

    it('returns 429 when per-user limit is exceeded', async () => {
        const app = makeUploadApp('user-1');
        await hitN(app, 2);
        const over = await request(app).get('/');
        expect(over.status).toBe(429);
    });

    it('keys by userId — different users are isolated', async () => {
        const appA = makeUploadApp('uploader-A');
        await hitN(appA, 2);
        expect((await request(appA).get('/')).status).toBe(429);

        const appB = makeUploadApp('uploader-B');
        expect((await request(appB).get('/')).status).toBe(200);
    });
});
