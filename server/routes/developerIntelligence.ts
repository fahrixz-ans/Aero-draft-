// ---------------------------------------------------------------------------
// DEVELOPER INTELLIGENCE ROUTER (/api/developer/intelligence/*)
// Scoped to developer's own apps only (Section 6 & 26)
// Strictly forbids leaking other developers' metrics or user PII
// ---------------------------------------------------------------------------

import { Router } from 'express';
import { requireAuth } from '../auth';
import { IntelligenceService } from '../services/intelligence/intelligenceService';
import { appsDb } from '../repositories';
import { sendSuccess, sendError, ERROR_CODES } from '../errors';

export const developerIntelligenceRouter = Router();

developerIntelligenceRouter.use(requireAuth);

/**
 * GET /api/developer/intelligence
 * Returns metrics and performance strictly for current developer
 */
developerIntelligenceRouter.get('/', (req, res) => {
  try {
    const user = (req as any).user;
    const developerName = user.developerName || user.name || user.email?.split('@')[0];

    // Filter developer summary
    const devSummaries = IntelligenceService.getDevelopersIntelligence(developerName);
    const summary = devSummaries[0] || {
      developerId: `dev_${user.id}`,
      developerName,
      totalApps: 0,
      publishedApps: 0,
      pendingApps: 0,
      rejectedApps: 0,
      totalDownloads: 0,
      totalViews: 0,
      uploadSuccessRate: 100,
      securityIncidentCount: 0,
      avgProcessingDurationSeconds: 12,
      activeStatus: 'ACTIVE'
    };

    // Filter apps owned by this developer
    const allApps = IntelligenceService.getAppsIntelligence({ limit: 500 }).items;
    const myApps = allApps.filter(a => 
      a.developerName.toLowerCase() === developerName.toLowerCase() ||
      (a as any).developerId === user.id
    );

    return sendSuccess(res, {
      summary,
      apps: myApps,
      dataFreshness: {
        status: 'FRESH',
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/developer/intelligence/apps/:appId
 * Detailed intelligence for a specific app owned by the developer
 */
developerIntelligenceRouter.get('/apps/:appId', (req, res) => {
  try {
    const user = (req as any).user;
    const developerName = user.developerName || user.name || user.email?.split('@')[0];

    const appEntity = appsDb.find(a => a.id === req.params.appId || a.slug === req.params.appId);
    if (!appEntity) {
      return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);
    }

    // Strict ownership verification: developer can only view their own app
    const appDev = appEntity.developerName || (appEntity as any).developer || '';
    const isOwner = appDev.toLowerCase() === developerName.toLowerCase() ||
      (appEntity as any).developerId === user.id ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN';

    if (!isOwner) {
      return sendError(res, ERROR_CODES.FORBIDDEN, 'Anda tidak memiliki akses ke analytics aplikasi pengembang lain.', 403);
    }

    const item = IntelligenceService.getAppDetailIntelligence(req.params.appId);
    return sendSuccess(res, item);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});
