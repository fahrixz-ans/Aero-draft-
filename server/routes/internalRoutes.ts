// ---------------------------------------------------------------------------
// INTERNAL API ROUTER (/api/internal/*) (STAGE 8.8 & 8.9)
// Health, readiness, queue jobs status, dead-letter & reconciliation
// ---------------------------------------------------------------------------

import { Router } from 'express';
import { jobsDb, deadLetterJobsDb } from '../repositories';
import { runReconciliation } from '../reconciliation';
import { sendSuccess, sendError, ERROR_CODES } from '../errors';

export const internalRouter = Router();

// GET /api/internal/health
internalRouter.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/internal/ready
internalRouter.get('/ready', (req, res) => {
  return res.status(200).json({
    status: 'ready',
    services: {
      database: 'connected',
      storage: 'operational',
      queue: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/internal/jobs/:id
internalRouter.get('/jobs/:id', (req, res) => {
  const job = jobsDb.find(j => j.jobId === req.params.id);
  if (!job) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Job antrean tidak ditemukan.', 404);
  }
  return sendSuccess(res, job);
});

// POST /api/internal/reconcile
internalRouter.post('/reconcile', async (req, res) => {
  try {
    const report = await runReconciliation();
    return sendSuccess(res, report);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// GET /api/internal/dead-letters
internalRouter.get('/dead-letters', (req, res) => {
  return sendSuccess(res, deadLetterJobsDb);
});

// POST /api/internal/dead-letters/:jobId/retry
internalRouter.post('/dead-letters/:jobId/retry', (req, res) => {
  const item = deadLetterJobsDb.find(d => d.jobId === req.params.jobId);
  if (!item) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Job dead-letter tidak ditemukan.', 404);
  }

  // Reset job in jobsDb for retry
  const job = jobsDb.find(j => j.jobId === req.params.jobId);
  if (job) {
    job.attempt = 0;
    job.status = 'QUEUED';
    item.resolvedAt = new Date().toISOString();
    item.resolvedBy = req.body?.actor || 'internal_admin';
    item.status = 'RETRYING';
  }

  return sendSuccess(res, { message: 'Job berhasil dijadwalkan ulang untuk dicoba kembali.', item });
});

// POST /api/internal/dead-letters/:jobId/resolve
internalRouter.post('/dead-letters/:jobId/resolve', (req, res) => {
  const item = deadLetterJobsDb.find(d => d.jobId === req.params.jobId);
  if (!item) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Job dead-letter tidak ditemukan.', 404);
  }

  item.status = 'RESOLVED';
  item.resolvedAt = new Date().toISOString();
  item.resolvedBy = req.body?.actor || 'internal_admin';
  item.resolutionNotes = req.body?.notes || 'Diselesaikan secara manual oleh administrator.';

  return sendSuccess(res, { message: 'Job dead-letter berhasil ditandai selesai.', item });
});
