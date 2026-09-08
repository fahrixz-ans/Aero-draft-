import { Router } from 'express';
import { sendSuccess } from '../errors';
import { performanceTracker } from '../middleware/performance';
import { apiCacheManager } from '../middleware/cache';

export const healthRouter = Router();

healthRouter.get('/liveness', (req, res) => {
  return sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/readiness', (req, res) => {
  const memory = process.memoryUsage();
  const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024);

  const status = heapUsedMB > 1500 ? 'degraded' : 'healthy';

  return sendSuccess(res, {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      memory: { status: heapUsedMB > 1500 ? 'warning' : 'ok', heapUsedMB, heapTotalMB },
      cache: apiCacheManager.getStats()
    }
  });
});

healthRouter.get('/', (req, res) => {
  const memory = process.memoryUsage();
  const performanceSummary = performanceTracker.getSummary();
  const cacheStats = apiCacheManager.getStats();

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (performanceSummary.errorRate > 5 || performanceSummary.p95Ms > 2000) {
    overallStatus = 'degraded';
  }

  return sendSuccess(res, {
    status: overallStatus,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      rssMB: Math.round(memory.rss / 1024 / 1024)
    },
    performance: performanceSummary,
    cache: cacheStats,
    environment: process.env.NODE_ENV || 'development'
  });
});
