import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  body: any;
  headers: Record<string, string>;
  expiresAt: number;
}

class CacheManager {
  private store = new Map<string, CacheEntry>();
  private defaultTTL = Number(process.env.CACHE_TTL) || 300;

  set(key: string, body: any, ttlSeconds: number = this.defaultTTL, headers: Record<string, string> = {}) {
    this.store.set(key, {
      body,
      headers,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  get(key: string): CacheEntry | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  invalidate(pattern?: string | RegExp) {
    if (!pattern) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) this.store.delete(key);
      } else if (pattern.test(key)) {
        this.store.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.store.size,
      enabled: process.env.CACHE_ENABLED !== 'false'
    };
  }
}

export const apiCacheManager = new CacheManager();

export function cacheMiddleware(ttlSeconds: number = 300, isPersonalized = false) {
  return (req: Request, res: Response, next: NextFunction) => {
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

    const cached = apiCacheManager.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache-Status', 'HIT');
      res.setHeader('Cache-Control', isPersonalized ? 'private, max-age=' + ttlSeconds : 'public, max-age=' + ttlSeconds);
      return res.status(200).json(cached.body);
    }

    res.setHeader('X-Cache-Status', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200 && body?.success !== false) {
        apiCacheManager.set(cacheKey, body, ttlSeconds);
      }
      res.setHeader('Cache-Control', isPersonalized ? 'private, max-age=' + ttlSeconds : 'public, max-age=' + ttlSeconds);
      return originalJson(body);
    };

    next();
  };
}
