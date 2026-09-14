import { Request, Response, NextFunction } from 'express';
import { ApiCacheRepository } from '../repositories';

export const apiCacheManager = {
  async get(key: string) {
    return ApiCacheRepository.get(key);
  },
  async set(key: string, body: unknown, ttlSeconds = Number(process.env.CACHE_TTL) || 300, headers: Record<string, string> = {}) {
    return ApiCacheRepository.set(key, body, ttlSeconds, headers);
  },
  async invalidate(pattern?: string | RegExp) {
    return ApiCacheRepository.invalidate(pattern);
  },
  async getStats() {
    return ApiCacheRepository.stats();
  },
};

export function cacheMiddleware(ttlSeconds: number = Number(process.env.CACHE_TTL) || 300, isPersonalized = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.CACHE_ENABLED === 'false' || req.method !== 'GET') {
      res.setHeader('X-Cache-Status', 'BYPASS');
      return next();
    }

    const user = (req as any).user;
    if (isPersonalized && !user) {
      res.setHeader('Cache-Control', 'private, no-cache');
      res.setHeader('X-Cache-Status', 'BYPASS');
      return next();
    }

    const cacheKey = isPersonalized
      ? `pers:${user?.id || 'anon'}:${req.originalUrl}`
      : `pub:${req.originalUrl}`;

    try {
      const cached = await apiCacheManager.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        res.setHeader('Cache-Control', isPersonalized ? `private, max-age=${ttlSeconds}` : `public, max-age=${ttlSeconds}`);
        return res.status(200).json(cached.body);
      }

      res.setHeader('X-Cache-Status', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        if (res.statusCode === 200 && body?.success !== false) {
          void apiCacheManager.set(cacheKey, body, ttlSeconds).catch(error => {
            console.error('[api-cache] Firestore write failed:', error);
          });
        }
        res.setHeader('Cache-Control', isPersonalized ? `private, max-age=${ttlSeconds}` : `public, max-age=${ttlSeconds}`);
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('[api-cache] Firestore read failed:', error);
      res.setHeader('X-Cache-Status', 'ERROR');
      // Cache is an optimization, never a source of truth.
      next();
    }
  };
}
