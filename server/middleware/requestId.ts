import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId || `req_${crypto.randomBytes(12).toString('hex')}`;
  (req as any).id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}
