import { Request, Response, NextFunction } from 'express';
import { sendError, ERROR_CODES } from '../errors';
import { RateLimitRepository } from '../repositories';

export function createRateLimiter(options: { windowMs: number; max: number; keyPrefix?: string }) {
  const { windowMs, max, keyPrefix = 'rl' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userId = (req as any).user?.id || 'anonymous';
      const key = `${keyPrefix}:${userId}:${ip}:${req.method}:${req.path}`;
      const result = await RateLimitRepository.consume(key, windowMs, max);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - result.current));
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

      if (!result.allowed) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds);
        return sendError(
          res,
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'Batas request terlampaui. Silakan tunggu beberapa saat.',
          429,
          { retryAfterSeconds }
        );
      }

      next();
    } catch (error) {
      // Fail closed for security-sensitive rate limits. A database failure must
      // never silently disable abuse protection.
      console.error('[rate-limit] Firestore error:', error);
      return sendError(
        res,
        ERROR_CODES.INTERNAL_ERROR,
        'Sistem pembatasan permintaan sedang tidak tersedia.',
        503
      );
    }
  };
}
