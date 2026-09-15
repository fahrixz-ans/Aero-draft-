// ---------------------------------------------------------------------------
// PUBLIC API ROUTER (/api/public/*) (STAGE 8.8 & 8.9)
// Read-only discovery, download, search, homepage
// ---------------------------------------------------------------------------

import { Router } from 'express';
import {
  PublicAppService,
  CategoryService,
  CollectionService,
  AnalyticsService
} from '../services';
import { SecurityService, createRateLimiter } from '../services/securityService';
import { sendSuccess, sendList, sendError, ERROR_CODES } from '../errors';
import fs from 'fs';
import path from 'path';

export const publicRouter = Router();

// GET /api/public/apps
publicRouter.get('/apps', async (req, res) => {
  try {
    const result = await PublicAppService.list(req.query);
    return sendList(res, result.data, result.page, result.pageSize, result.total);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/apps/:slug
publicRouter.get('/apps/:slug', async (req, res) => {
  try {
    const app = await PublicAppService.getBySlug(req.params.slug);
    if (!app) {
      return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);
    }
    return sendSuccess(res, app);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/apps/:slug/versions
publicRouter.get('/apps/:slug/versions', async (req, res) => {
  try {
    const versions = await PublicAppService.getVersions(req.params.slug);
    if (!versions) {
      return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);
    }
    return sendSuccess(res, versions);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/apps/:slug/versions/:versionId/download
publicRouter.get('/apps/:slug/versions/:versionId/download', createRateLimiter('DOWNLOAD'), async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const sessionId = (req.headers['x-session-id'] as string) || 'guest_session';
    const userId = (req as any).user?.id || undefined;

    const result = await PublicAppService.getVersionDownloadTarget(req.params.slug, req.params.versionId, { ip, sessionId, userId });
    if (result.error) {
      const statusCode = result.error === 'APP_NOT_FOUND' ? 404 :
        result.error === 'VERSION_NOT_FOUND' ? 404 :
        result.error === 'VERSION_REVOKED' ? 403 :
        result.error === 'APK_QUARANTINED' ? 403 : 403;
      return sendError(res, result.error, result.message || 'Gagal mengunduh versi APK.', statusCode);
    }

    const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
    if (acceptsJson) {
      return sendSuccess(res, result.data);
    }

    // Direct redirection to the GCS Signed URL to prevent server streaming
    return res.redirect(result.data!.downloadUrl);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/apps/:slug/download
publicRouter.get('/apps/:slug/download', createRateLimiter('DOWNLOAD'), async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const sessionId = (req.headers['x-session-id'] as string) || 'guest_session';
    const userId = (req as any).user?.id || undefined;

    const result = await PublicAppService.getDownloadTarget(req.params.slug, { ip, sessionId, userId });
    if (result.error) {
      const statusCode = result.error === 'APP_NOT_FOUND' ? 404 :
        result.error === 'VERSION_NOT_FOUND' ? 404 :
        result.error === 'APK_QUARANTINED' ? 403 :
        result.error === 'SECURITY_CHECK_REQUIRED' ? 403 :
        result.error === 'APP_NOT_PUBLISHED' ? 403 : 403;
      return sendError(res, result.error, result.message || 'Gagal mengunduh APK.', statusCode);
    }

    const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
    if (acceptsJson) {
      return sendSuccess(res, result.data);
    }

    // Direct redirection to the GCS Signed URL to prevent server streaming
    return res.redirect(result.data!.downloadUrl);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/apps/:slug/official
publicRouter.get('/apps/:slug/official', async (req, res) => {
  try {
    const result = await PublicAppService.getOfficialUrl(req.params.slug);
    if (result.error) {
      return sendError(res, result.error, result.message || 'URL situs resmi tidak tersedia.', 404);
    }
    return sendSuccess(res, { url: result.url });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/categories
publicRouter.get('/categories', async (req, res) => {
  try {
    const list = await CategoryService.listPublic();
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/categories/:slug
publicRouter.get('/categories/:slug', async (req, res) => {
  try {
    const cat = await CategoryService.getBySlug(req.params.slug);
    if (!cat) {
      return sendError(res, ERROR_CODES.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);
    }
    return sendSuccess(res, cat);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/categories/:slug/apps
publicRouter.get('/categories/:slug/apps', async (req, res) => {
  try {
    const result = await CategoryService.getCategoryApps(req.params.slug, req.query);
    if (!result) {
      return sendError(res, ERROR_CODES.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);
    }
    return sendList(res, result.data, result.page, result.pageSize, result.total);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/collections
publicRouter.get('/collections', async (req, res) => {
  try {
    const list = await CollectionService.listPublic();
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/collections/:slug
publicRouter.get('/collections/:slug', async (req, res) => {
  try {
    const result = await CollectionService.getBySlug(req.params.slug, req.query);
    if (!result) {
      return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Koleksi tidak ditemukan.', 404);
    }
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/homepage
publicRouter.get('/homepage', async (req, res) => {
  try {
    const appsResult = await PublicAppService.list({ pageSize: 20 });
    const categories = await CategoryService.listPublic();
    const collections = await CollectionService.listPublic();
    const trending = await AnalyticsService.getTrending(6);

    const data = {
      hero: {
        title: 'Temukan & Unduh Aplikasi Android Terbaik',
        subtitle: 'Aman, terverifikasi SHA-256, bebas malware, dan berkecepatan tinggi.',
        ctaText: 'Jelajahi Katalog',
        ctaLink: '#catalog'
      },
      featuredApps: appsResult.data.slice(0, 5),
      trending,
      newReleases: appsResult.data.slice(0, 6),
      recentlyUpdated: appsResult.data.slice(0, 6),
      categories,
      collections
    };

    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/search
publicRouter.get('/search', createRateLimiter('SEARCH'), async (req, res) => {
  try {
    const rawQuery = (req.query.q as string) || '';
    const cleanQuery = SecurityService.sanitizeSearchQuery(rawQuery);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));

    const result = await PublicAppService.list({
      search: cleanQuery,
      category: req.query.category as string,
      sort: req.query.sort as string,
      page: req.query.page,
      pageSize
    });
    return sendList(res, result.data, result.page, result.pageSize, result.total);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// POST /api/public/analytics/event (Protected by Stage 9.11 Analytics Validator)
publicRouter.post('/analytics/event', createRateLimiter('ANALYTICS'), async (req, res) => {
  try {
    const payload = req.body || {};
    const validation = await SecurityService.validateAnalyticsEvent(payload);
    if (!validation.valid) {
      SecurityService.recordSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        severity: 'LOW',
        ip: (req.ip || '').replace(/^.*:/, ''),
        userAgent: req.headers['user-agent'],
        requestId: (req as any).id || `req_${Date.now()}`,
        endpoint: '/api/public/analytics/event',
        metadata: { reason: validation.reason, payload }
      });
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, validation.reason || 'Event analitik tidak valid.', 400);
    }

    return sendSuccess(res, { recorded: true, eventId: payload.eventId });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/trending
publicRouter.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const category = req.query.category as string;
    const list = await AnalyticsService.getTrending(limit, category);
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/recently-updated
publicRouter.get('/recently-updated', async (req, res) => {
  try {
    const result = await PublicAppService.list({ sort: 'recently_updated', pageSize: 20 });
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/new-releases
publicRouter.get('/new-releases', async (req, res) => {
  try {
    const result = await PublicAppService.list({ sort: 'new_releases', pageSize: 20 });
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/public/download-modstation-client
publicRouter.get('/download-modstation-client', (req, res) => {
  try {
    const apkPath = path.join(process.cwd(), 'uploads', 'apks', 'mod-station.apk');
    if (fs.existsSync(apkPath)) {
      return res.download(apkPath, 'mod-station.apk');
    }
    return sendError(res, 'APK_NOT_FOUND', 'Aplikasi belum tersedia untuk diunduh.', 404);
  } catch (err: any) {
    return sendError(res, 'INTERNAL_ERROR', err.message, 500);
  }
});
  
