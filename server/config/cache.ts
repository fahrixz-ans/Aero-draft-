export type CachePolicy = {
  keyPrefix: string;
  ttlSeconds: number;
  staleWhileRevalidateSeconds?: number;
  maxEntries?: number;
  cacheable: boolean;
  personalized: boolean;
  securitySensitive: boolean;
  invalidateOn: string[];
};

export const cacheConfig: Record<string, CachePolicy> = {
  apps: {
    keyPrefix: "aero:apps",
    ttlSeconds: Number(process.env.CACHE_TTL_APPS) || 300,
    staleWhileRevalidateSeconds: 60,
    cacheable: true,
    personalized: false,
    securitySensitive: false,
    invalidateOn: [
      "app.updated",
      "app.published",
      "app.unpublished",
      "app.archived"
    ]
  },

  appDetail: {
    keyPrefix: "aero:app-detail",
    ttlSeconds: Number(process.env.CACHE_TTL_APP_DETAIL) || 300,
    staleWhileRevalidateSeconds: 60,
    cacheable: true,
    personalized: false,
    securitySensitive: false,
    invalidateOn: [
      "app.updated",
      "version.published",
      "version.revoked"
    ]
  },

  search: {
    keyPrefix: "aero:search",
    ttlSeconds: Number(process.env.CACHE_TTL_SEARCH) || 60,
    staleWhileRevalidateSeconds: 30,
    cacheable: true,
    personalized: false,
    securitySensitive: false,
    invalidateOn: [
      "app.published",
      "app.unpublished",
      "search-index.updated"
    ]
  },

  trending: {
    keyPrefix: "aero:trending",
    ttlSeconds: Number(process.env.CACHE_TTL_TRENDING) || 300,
    staleWhileRevalidateSeconds: 120,
    cacheable: true,
    personalized: false,
    securitySensitive: false,
    invalidateOn: [
      "ranking.updated"
    ]
  },

  ranking: {
    keyPrefix: "aero:ranking",
    ttlSeconds: Number(process.env.CACHE_TTL_RANKING) || 300,
    staleWhileRevalidateSeconds: 120,
    cacheable: true,
    personalized: false,
    securitySensitive: false,
    invalidateOn: [
      "ranking.updated"
    ]
  },

  recommendations: {
    keyPrefix: "aero:recommendation",
    ttlSeconds: Number(process.env.CACHE_TTL_RECOMMENDATIONS) || 300,
    staleWhileRevalidateSeconds: 60,
    cacheable: true,
    personalized: true,
    securitySensitive: false,
    invalidateOn: [
      "recommendation.updated",
      "user.preference.updated"
    ]
  },

  collections: {
    keyPrefix: "aero:collections",
    ttlSeconds: Number(process.env.CACHE_TTL_COLLECTIONS) || 300,
    staleWhileRevalidateSeconds: 120,
    cacheable: true,
    personalized: false,
    securitySensitive: false,
    invalidateOn: [
      "collection.regenerated",
      "collection.updated"
    ]
  },

  security: {
    keyPrefix: "aero:security",
    ttlSeconds: 30,
    cacheable: false,
    personalized: false,
    securitySensitive: true,
    invalidateOn: [
      "security.updated",
      "version.revoked",
      "version.quarantined"
    ]
  },

  admin: {
    keyPrefix: "aero:admin",
    ttlSeconds: 30,
    cacheable: false,
    personalized: true,
    securitySensitive: true,
    invalidateOn: [
      "admin.data.updated"
    ]
  }
};
