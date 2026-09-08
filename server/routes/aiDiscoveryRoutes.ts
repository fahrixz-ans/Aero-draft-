import { Router } from 'express';
import { classifyQueryIntent } from '../ai/intentClassifier';
import { rankAndFilterDiscoveryCandidates } from '../ai/recommendationLayer';
import { buildAiDiscoveryReportObject, generateHumanReadableAiReportText } from '../ai/reports';
import { getAiFeatureFlags, updateAiFeatureFlags } from '../ai/config';
import { appsDb } from '../repositories';
import { resolveUserSession, requireAuth } from '../middleware/auth';
import { submitBackgroundJob } from '../events';

export const aiDiscoveryRouter = Router();

// -----------------------------------------------------------------------------
// PUBLIC DISCOVERY ENDPOINTS
// -----------------------------------------------------------------------------

// GET /api/discovery/intent
aiDiscoveryRouter.get('/api/discovery/intent', (req, res) => {
  const query = (req.query.q as string) || '';
  const intent = classifyQueryIntent(query);
  res.json({
    status: 'success',
    data: intent
  });
});

// POST /api/discovery/recommendations
aiDiscoveryRouter.post('/api/discovery/recommendations', resolveUserSession, (req, res) => {
  const { query, limit } = req.body;
  const user = (req as any).user;
  const result = rankAndFilterDiscoveryCandidates(query || '', appsDb, user);
  
  const limitedApps = limit ? result.apps.slice(0, Number(limit)) : result.apps;

  res.json({
    status: 'success',
    data: {
      apps: limitedApps,
      intent: result.intent,
      confidence: result.confidence,
      explanations: result.explanations,
      fallbackUsed: result.fallbackUsed
    }
  });
});

// GET /api/discovery/similar/:appId
aiDiscoveryRouter.get('/api/discovery/similar/:appId', (req, res) => {
  const { appId } = req.params;
  const targetApp = appsDb.find(a => a.id === appId || a.slug === appId);

  if (!targetApp) {
    return res.status(404).json({ status: 'error', error: 'App not found' });
  }

  const queryStr = `${targetApp.category} ${targetApp.name}`;
  const result = rankAndFilterDiscoveryCandidates(queryStr, appsDb.filter(a => a.id !== targetApp.id));

  res.json({
    status: 'success',
    data: {
      apps: result.apps.slice(0, 6),
      relevanceExplanation: `Aplikasi serupa dalam kategori '${targetApp.category}'`
    }
  });
});

// -----------------------------------------------------------------------------
// ADMIN AI DISCOVERY INTELLIGENCE & CONTROL
// -----------------------------------------------------------------------------

// GET /api/admin/ai/health
aiDiscoveryRouter.get('/api/admin/ai/health', resolveUserSession, requireAuth, (req, res) => {
  const report = buildAiDiscoveryReportObject();
  res.json({
    status: 'success',
    data: {
      health: report.health,
      ai: report.ai,
      flags: getAiFeatureFlags()
    }
  });
});

// GET /api/admin/ai/opportunities
aiDiscoveryRouter.get('/api/admin/ai/opportunities', resolveUserSession, requireAuth, (req, res) => {
  const report = buildAiDiscoveryReportObject();
  res.json({
    status: 'success',
    data: {
      opportunities: report.opportunities,
      recommendations: report.recommendations
    }
  });
});

// GET /api/admin/ai/reports
aiDiscoveryRouter.get('/api/admin/ai/reports', resolveUserSession, requireAuth, (req, res) => {
  const format = req.query.format || 'json';
  const reportObj = buildAiDiscoveryReportObject();

  if (format === 'text') {
    res.header('Content-Type', 'text/plain');
    return res.send(generateHumanReadableAiReportText(reportObj));
  }

  res.json({
    status: 'success',
    data: reportObj
  });
});

// POST /api/admin/ai/flags
aiDiscoveryRouter.post('/api/admin/ai/flags', resolveUserSession, requireAuth, (req, res) => {
  const newFlags = updateAiFeatureFlags(req.body);
  res.json({
    status: 'success',
    data: newFlags
  });
});

// POST /api/admin/ai/jobs/trigger
aiDiscoveryRouter.post('/api/admin/ai/jobs/trigger', resolveUserSession, requireAuth, async (req, res) => {
  const { jobType, entityId } = req.body;
  
  if (!jobType) {
    return res.status(400).json({ status: 'error', error: 'jobType is required' });
  }

  const job = await submitBackgroundJob({ type: jobType as any, entityId });
  res.json({
    status: 'success',
    data: {
      message: `AI Job ${jobType} submitted successfully`,
      jobId: job.jobId
    }
  });
});
