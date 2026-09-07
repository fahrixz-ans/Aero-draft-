// ---------------------------------------------------------------------------
// AERO RECONCILIATION WORKER (STAGE 8.9)
// Periodically audits consistency between Firestore, Cloudflare R2, and Queue
// ---------------------------------------------------------------------------

import { appsDb, versionsDb, jobsDb, uploadsDb } from './repositories';
import { verifyR2Object } from './cloudflareR2';

export interface ReconciliationReport {
  timestamp: string;
  orphanedUploads: number;
  missingStorageObjects: string[];
  staleProcessingJobs: string[];
  status: 'clean' | 'anomalies_detected';
  details: any[];
}

export async function runReconciliation(): Promise<ReconciliationReport> {
  const missingObjects: string[] = [];
  const staleJobs: string[] = [];
  const details: any[] = [];

  // 1. Audit Published Versions: Ensure R2 object actually exists
  for (const ver of versionsDb) {
    if (ver.status === 'PUBLISHED' && ver.r2ObjectKey) {
      const obj = await verifyR2Object(ver.r2ObjectKey);
      if (!obj) {
        missingObjects.push(ver.r2ObjectKey);
        details.push({
          type: 'MISSING_R2_OBJECT',
          versionId: ver.id,
          appId: ver.appId,
          key: ver.r2ObjectKey
        });
      }
    }
  }

  // 2. Audit Stale Processing Jobs (processing for > 15 minutes)
  const now = Date.now();
  for (const job of jobsDb) {
    if (job.status === 'PROCESSING' && job.startedAt) {
      const elapsed = now - new Date(job.startedAt).getTime();
      if (elapsed > 15 * 60 * 1000) {
        staleJobs.push(job.jobId);
        details.push({
          type: 'STALE_PROCESSING_JOB',
          jobId: job.jobId,
          elapsedMs: elapsed
        });
        // Auto-recover: mark as queued for retry if attempts remaining
        if (job.attempt < job.maxAttempts) {
          job.status = 'QUEUED';
        }
      }
    }
  }

  // 3. Audit Uploads without jobs
  let orphanedUploadCount = 0;
  for (const upload of uploadsDb) {
    if (upload.status === 'QUEUED') {
      const hasJob = jobsDb.some(j => j.uploadId === upload.uploadId);
      if (!hasJob) {
        orphanedUploadCount += 1;
        details.push({
          type: 'ORPHANED_QUEUED_UPLOAD',
          uploadId: upload.uploadId
        });
      }
    }
  }

  const report: ReconciliationReport = {
    timestamp: new Date().toISOString(),
    orphanedUploads: orphanedUploadCount,
    missingStorageObjects: missingObjects,
    staleProcessingJobs: staleJobs,
    status: (missingObjects.length > 0 || staleJobs.length > 0) ? 'anomalies_detected' : 'clean',
    details
  };

  return report;
}
