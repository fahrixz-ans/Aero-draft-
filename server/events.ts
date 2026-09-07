// ---------------------------------------------------------------------------
// AERO ASYNCHRONOUS EVENT BUS & BACKGROUND QUEUE SYSTEM (STAGE 8.8 & 8.9)
// Provides event dispatching, exponential backoff, jitter, and dead-letter queue
// ---------------------------------------------------------------------------

import { EventEmitter } from 'events';
import { isRetryableError } from './errors';
import { jobsDb, deadLetterJobsDb, JobEntity } from './repositories';

export const aeroEventBus = new EventEmitter();

export type AeroEventType =
  | 'APP_CREATED'
  | 'APP_UPDATED'
  | 'APP_PUBLISHED'
  | 'APP_ARCHIVED'
  | 'VERSION_CREATED'
  | 'VERSION_PUBLISHED'
  | 'CATEGORY_UPDATED'
  | 'COLLECTION_UPDATED'
  | 'MODERATION_APPROVED'
  | 'MODERATION_REJECTED'
  | 'SECURITY_SCAN_COMPLETED'
  | 'APP_VIEW'
  | 'SEARCH_PERFORMED'
  | 'DOWNLOAD_RECORDED'
  | 'DOWNLOAD_ATTEMPT'
  | 'DOWNLOAD_AUTHORIZED'
  | 'DOWNLOAD_DENIED'
  | 'DOWNLOAD_STARTED'
  | 'version_view'
  | 'version_compare'
  | 'version_download_attempt'
  | 'version_download_authorized'
  | 'version_download_denied'
  | 'version_archived'
  | 'version_revoked'
  | 'version_restored';

export interface AeroEventPayload {
  type: AeroEventType;
  entityId: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export function emitAeroEvent(type: AeroEventType, entityId: string, metadata?: Record<string, any>) {
  const payload: AeroEventPayload = {
    type,
    entityId,
    metadata,
    timestamp: new Date().toISOString()
  };
  aeroEventBus.emit(type, payload);
  aeroEventBus.emit('*', payload);
}

// ---------------------------------------------------------------------------
// Background Queue with Exponential Backoff & Jitter
// ---------------------------------------------------------------------------

export type JobHandler = (job: JobEntity) => Promise<void>;
const registeredHandlers = new Map<string, JobHandler>();

export function registerJobHandler(type: string, handler: JobHandler) {
  registeredHandlers.set(type, handler);
}

export function calculateBackoffDelay(attempt: number): number {
  // Baseline: 1s, 2s, 4s, 8s, 16s + jitter (0 - 500ms)
  const baseSeconds = Math.pow(2, Math.max(0, attempt - 1));
  const maxDelaySeconds = 30;
  const clampedDelay = Math.min(baseSeconds, maxDelaySeconds);
  const jitterMs = Math.floor(Math.random() * 500);
  return clampedDelay * 1000 + jitterMs;
}

export async function submitBackgroundJob(params: {
  type: 'APK_PROCESSING' | 'SECURITY_SCAN' | 'SEARCH_INDEX' | 'RECONCILIATION';
  uploadId?: string;
  appId?: string;
  versionId?: string;
  maxAttempts?: number;
}): Promise<JobEntity> {
  const existingJob = jobsDb.find(j => 
    j.type === params.type &&
    j.uploadId === params.uploadId &&
    (j.status === 'QUEUED' || j.status === 'PROCESSING')
  );
  if (existingJob) {
    return existingJob; // Idempotent submission
  }

  const job: JobEntity = {
    jobId: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: params.type,
    status: 'QUEUED',
    uploadId: params.uploadId,
    appId: params.appId,
    versionId: params.versionId,
    attempt: 0,
    maxAttempts: params.maxAttempts || 5,
    createdAt: new Date().toISOString()
  };

  jobsDb.push(job);

  // Trigger execution asynchronously without blocking the caller
  setImmediate(() => executeJobWithRetry(job));

  return job;
}

async function executeJobWithRetry(job: JobEntity) {
  job.attempt += 1;
  job.status = 'PROCESSING';
  job.startedAt = new Date().toISOString();

  const handler = registeredHandlers.get(job.type);
  if (!handler) {
    console.warn(`[Queue] No registered handler for job type: ${job.type}`);
    job.status = 'COMPLETED';
    job.completedAt = new Date().toISOString();
    return;
  }

  try {
    await handler(job);
    job.status = 'COMPLETED';
    job.completedAt = new Date().toISOString();
  } catch (err: any) {
    const errorCode = err.code || 'JOB_FAILED';
    const errorMessage = err.message || 'Background execution failed';
    job.lastErrorCode = errorCode;
    job.lastErrorMessage = errorMessage;

    const retryable = isRetryableError(errorCode) && job.attempt < job.maxAttempts;

    if (retryable) {
      const delayMs = calculateBackoffDelay(job.attempt);
      job.status = 'QUEUED';
      job.nextRetryAt = new Date(Date.now() + delayMs).toISOString();
      console.log(`[Queue] Retrying job ${job.jobId} (attempt ${job.attempt}/${job.maxAttempts}) in ${delayMs}ms`);
      setTimeout(() => executeJobWithRetry(job), delayMs);
    } else {
      // Job has exhausted retry attempts or failed with non-retryable error -> Move to Dead-Letter
      job.status = 'DEAD_LETTERED';
      job.failedAt = new Date().toISOString();

      const deadLetterItem = {
        jobId: job.jobId,
        type: job.type,
        uploadId: job.uploadId,
        appId: job.appId,
        versionId: job.versionId,
        attempts: job.attempt,
        maxAttempts: job.maxAttempts,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
        status: 'DEAD_LETTERED',
        createdAt: job.createdAt,
        failedAt: job.failedAt,
        resolvedAt: null,
        resolvedBy: null
      };

      deadLetterJobsDb.push(deadLetterItem);
      console.error(`[Queue] Job ${job.jobId} DEAD-LETTERED: ${errorCode} - ${errorMessage}`);
    }
  }
}
