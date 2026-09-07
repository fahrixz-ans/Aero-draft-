// ---------------------------------------------------------------------------
// ADMIN INTELLIGENCE & OBSERVABILITY ROUTER (/api/admin/intelligence/*)
// Stage 9.10 implementation
// ---------------------------------------------------------------------------

import { Router } from 'express';
import { requireAuth, requirePermission } from '../auth';
import { IntelligenceService } from '../services/intelligence/intelligenceService';
import { sendSuccess, sendList, sendError, ERROR_CODES } from '../errors';

export const adminIntelligenceRouter = Router();

// Require authenticated administrator
adminIntelligenceRouter.use(requireAuth);

/**
 * GET /api/admin/intelligence/overview
 */
adminIntelligenceRouter.get('/overview', requirePermission('analytics.read'), (req, res) => {
  try {
    const period = (req.query.period as string) || '7D';
    const result = IntelligenceService.getOverviewMetrics(period);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/funnel/discovery
 */
adminIntelligenceRouter.get('/funnel/discovery', requirePermission('analytics.read'), (req, res) => {
  try {
    const period = (req.query.period as string) || '7D';
    const result = IntelligenceService.getDiscoveryFunnel(period);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/funnel/search
 */
adminIntelligenceRouter.get('/funnel/search', requirePermission('analytics.read'), (req, res) => {
  try {
    const period = (req.query.period as string) || '7D';
    const result = IntelligenceService.getSearchFunnel(period);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/apps
 */
adminIntelligenceRouter.get('/apps', requirePermission('analytics.read'), (req, res) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = IntelligenceService.getAppsIntelligence({ page, limit, category, status, search });
    return sendList(res, result.items, result.page, result.pageSize, result.total);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/apps/:appId
 */
adminIntelligenceRouter.get('/apps/:appId', requirePermission('analytics.read'), (req, res) => {
  try {
    const item = IntelligenceService.getAppDetailIntelligence(req.params.appId);
    if (!item) {
      return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan dalam katalog intelligence.', 404);
    }
    return sendSuccess(res, item);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/developers
 */
adminIntelligenceRouter.get('/developers', requirePermission('analytics.read'), (req, res) => {
  try {
    const filter = req.query.developer as string;
    const result = IntelligenceService.getDevelopersIntelligence(filter);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/search
 */
adminIntelligenceRouter.get('/search', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getSearchIntelligence();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/recommendations
 */
adminIntelligenceRouter.get('/recommendations', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getRecommendationIntelligence();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/ranking
 */
adminIntelligenceRouter.get('/ranking', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getRankingIntelligence();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/downloads
 */
adminIntelligenceRouter.get('/downloads', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getDownloadIntelligence();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/security
 */
adminIntelligenceRouter.get('/security', requirePermission('security.read'), (req, res) => {
  try {
    const result = IntelligenceService.getSecurityIntelligence();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/versions
 */
adminIntelligenceRouter.get('/versions', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getVersionsIntelligence();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/anomalies
 */
adminIntelligenceRouter.get('/anomalies', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.evaluateAnomalies();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/actions
 */
adminIntelligenceRouter.get('/actions', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getActionCenter();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * POST /api/admin/intelligence/actions/:actionId/status
 */
adminIntelligenceRouter.post('/actions/:actionId/status', requirePermission('apps.update'), (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status || !['IN_PROGRESS', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Status aksi tidak valid.', 400);
    }
    const actor = (req as any).user;
    const updated = IntelligenceService.updateActionStatus(req.params.actionId, status, note, actor);
    if (!updated) {
      return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Item aksi tidak ditemukan.', 404);
    }
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/health
 */
adminIntelligenceRouter.get('/health', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getHealthAndQuality();
    return sendSuccess(res, result.health);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/data-quality
 */
adminIntelligenceRouter.get('/data-quality', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getHealthAndQuality();
    return sendSuccess(res, result.dataQuality);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/operations
 */
adminIntelligenceRouter.get('/operations', requirePermission('analytics.read'), (req, res) => {
  try {
    const result = IntelligenceService.getHealthAndQuality();
    return sendSuccess(res, {
      health: result.health,
      dataQuality: result.dataQuality,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/audit
 */
adminIntelligenceRouter.get('/audit', requirePermission('audit.read'), (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const result = IntelligenceService.getAuditLogs(limit);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/intelligence/emergency
 */
adminIntelligenceRouter.get('/emergency', requirePermission('settings.read'), (req, res) => {
  try {
    const result = IntelligenceService.getEmergencyControls();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * POST /api/admin/intelligence/emergency
 */
adminIntelligenceRouter.post('/emergency', requirePermission('settings.update'), (req, res) => {
  try {
    const { updates, reason } = req.body;
    if (!reason || typeof reason !== 'string') {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Alasan perubahan kontrol darurat wajib diisi.', 400);
    }
    const actor = (req as any).user;
    const result = IntelligenceService.updateEmergencyControls(updates || {}, actor, reason);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});
