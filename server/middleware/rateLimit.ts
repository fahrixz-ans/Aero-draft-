import { Request, Response, NextFunction } from 'express';
import { sendError, ERROR_CODES } from '../errors';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

export function createRateLimiter(options: { windowMs: number; max: number; keyPrefix?: string }) {
  const { windowMs, max, keyPrefix = 'rl' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitMap.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      return sendError(
        res,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Batas request terlampaui. Silakan tunggu beberapa saat.',
        429,
        { retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000) }
      );
    }

    next();
  };
}
