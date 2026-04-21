import rateLimit from 'express-rate-limit';
import { AuthRequest } from './AuthMiddleware';

/**
 * Rate limiter for sensitive endpoints (e.g., login, register)
 * Limits each IP to 10 requests per 15 minutes.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too many login attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for review creation.
 * Keyed by authenticated user ID — limits to 10 reviews per hour per user.
 * Must be placed AFTER authenticateToken middleware.
 */
export const reviewRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    keyGenerator: (req) => (req as AuthRequest).user?.userId ?? 'unauthenticated',
    message: {
        success: false,
        message: 'Has alcanzado el límite de reseñas por hora. Inténtalo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for file uploads.
 * Keyed by user ID — limits to 20 uploads per hour per user.
 * Must be placed AFTER authenticateToken middleware.
 */
export const uploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    keyGenerator: (req) => (req as AuthRequest).user?.userId ?? 'unauthenticated',
    message: {
        success: false,
        message: 'Has alcanzado el límite de subidas por hora. Inténtalo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
