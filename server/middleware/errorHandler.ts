import { Request, Response, NextFunction } from 'express';
import { sendError, ERROR_CODES } from '../errors';

export function errorHandlerMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).id || 'req_unknown';
  console.error(`[Error] Request ID ${requestId}:`, err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  sendError(
    res,
    err.code || ERROR_CODES.INTERNAL_ERROR,
    message,
    statusCode,
    err.details || {}
  );
}
