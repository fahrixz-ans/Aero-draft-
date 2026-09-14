import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { PerformanceMetricRepository } from '../repositories';

export interface PerformanceMetricRecord {
  requestId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  category: 'FAST' | 'NORMAL' | 'SLOW' | 'CRITICAL';
  cacheHit: boolean;
  timestamp: string;
}

export const performanceTracker = {
  slowThresholdMs: Number(process.env.PERFORMANCE_SLOW_THRESHOLD_MS) || 500,
  criticalThresholdMs: Number(process.env.PERFORMANCE_CRITICAL_THRESHOLD_MS) || 1000,

  async record(metric: PerformanceMetricRecord) {
    return PerformanceMetricRepository.create({
      id: `perf_${crypto.randomUUID()}`,
      requestId: metric.requestId,
      endpoint: metric.endpoint,
      method: metric.method,
      statusCode: metric.statusCode,
      durationMs: metric.durationMs,
      category: metric.category,
      cacheHit: metric.cacheHit,
    });
  },

  async getMetrics() {
    return PerformanceMetricRepository.list(1000);
  },

  async getSummary() {
    return PerformanceMetricRepository.stats(1000);
  },

  async clear() {
    // Production metrics should not be silently deleted from an HTTP request.
    // Retention is handled by Firestore TTL/operational cleanup.
    return;
  },
};

export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const requestId = (req as any).id || 'req_unknown';

  const originalWriteHead = res.writeHead;
  res.writeHead = function (this: any, statusCode: any, ...args: any[]) {
    if (!res.headersSent) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      res.setHeader('Server-Timing', `total;dur=${durationMs.toFixed(2)}`);
    }
    return originalWriteHead.apply(this, [statusCode, ...args] as any);
  };

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const category: PerformanceMetricRecord['category'] =
      durationMs > performanceTracker.criticalThresholdMs ? 'CRITICAL' :
      durationMs > performanceTracker.slowThresholdMs ? 'SLOW' :
      durationMs > 300 ? 'NORMAL' : 'FAST';

    void performanceTracker.record({
      requestId,
      endpoint: req.baseUrl + req.path,
      method: req.method,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      category,
      cacheHit: res.getHeader('X-Cache-Status') === 'HIT',
      timestamp: new Date().toISOString(),
    }).catch(error => console.error('[performance] Firestore write failed:', error));
  });

  next();
}
