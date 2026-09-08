import { Request, Response, NextFunction } from 'express';
import { sendError, ERROR_CODES } from '../errors';

export function timeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        sendError(
          res,
          ERROR_CODES.PERFORMANCE_TIMEOUT || ('PERFORMANCE_TIMEOUT' as any),
          'Request timed out',
          504,
          { timeoutMs, retryable: true }
        );
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}
