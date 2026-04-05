import { Request, Response, NextFunction } from 'express';
import { addLog } from './RequestLogStore';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startMs = Date.now();

    res.on('finish', () => {
        // Skip health checks and swagger docs
        if (req.path === '/health' || req.path.startsWith('/api/docs')) return;

        addLog({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTimeMs: Date.now() - startMs,
            timestamp: new Date().toISOString(),
        });
    });

    next();
}
