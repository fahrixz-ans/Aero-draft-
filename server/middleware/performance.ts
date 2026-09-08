import { Request, Response, NextFunction } from 'express';

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

class PerformanceTracker {
  private metrics: PerformanceMetricRecord[] = [];
  private maxHistory = 1000;

  public slowThresholdMs = Number(process.env.PERFORMANCE_SLOW_THRESHOLD_MS) || 500;
  public criticalThresholdMs = Number(process.env.PERFORMANCE_CRITICAL_THRESHOLD_MS) || 1000;

  record(metric: PerformanceMetricRecord) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxHistory) {
      this.metrics.shift();
    }
  }

  getMetrics() {
    return [...this.metrics];
  }

  getSummary() {
    if (this.metrics.length === 0) {
      return { totalRequests: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, errorRate: 0, cacheHitRatio: 0 };
    }

    const durations = this.metrics.map(m => m.durationMs).sort((a, b) => a - b);
    const count = durations.length;
    const p50Ms = durations[Math.floor(count * 0.5)] || 0;
    const p95Ms = durations[Math.floor(count * 0.95)] || 0;
    const p99Ms = durations[Math.floor(count * 0.99)] || 0;

    const errors = this.metrics.filter(m => m.statusCode >= 400).length;
    const hits = this.metrics.filter(m => m.cacheHit).length;

    return {
      totalRequests: count,
      p50Ms,
      p95Ms,
      p99Ms,
      errorRate: Number(((errors / count) * 100).toFixed(2)),
      cacheHitRatio: Number(((hits / count) * 100).toFixed(2))
    };
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceTracker = new PerformanceTracker();

export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const requestId = (req as any).id || 'req_unknown';

  // Intercept writeHead to set Server-Timing before headers are sent
  const originalWriteHead = res.writeHead;
  res.writeHead = function (this: any, statusCode: any, ...args: any[]) {
    if (!res.headersSent) {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      res.setHeader('Server-Timing', `total;dur=${durationMs.toFixed(2)}`);
    }
    return originalWriteHead.apply(this, [statusCode, ...args] as any);
  };

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    let category: 'FAST' | 'NORMAL' | 'SLOW' | 'CRITICAL' = 'FAST';
    if (durationMs > performanceTracker.criticalThresholdMs) {
      category = 'CRITICAL';
    } else if (durationMs > performanceTracker.slowThresholdMs) {
      category = 'SLOW';
    } else if (durationMs > 300) {
      category = 'NORMAL';
    }

    const cacheHit = res.getHeader('X-Cache-Status') === 'HIT';

    performanceTracker.record({
      requestId,
      endpoint: req.baseUrl + req.path,
      method: req.method,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      category,
      cacheHit,
      timestamp: new Date().toISOString()
    });
  });

  next();
}
