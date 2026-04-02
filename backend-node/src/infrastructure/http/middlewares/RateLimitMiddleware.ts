import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for sensitive endpoints (e.g., login, register)
 * Limits each IP to 10 requests per 15 minutes.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: {
        success: false,
        error: 'Too many login attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});
