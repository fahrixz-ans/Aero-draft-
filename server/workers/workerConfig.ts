export interface WorkerConfig {
  concurrency: number;
  timeoutMs: number;
  maxRetries: number;
  batchSize: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
}

export const workerConfig: WorkerConfig = {
  concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  timeoutMs: Number(process.env.WORKER_TIMEOUT_MS) || 60000,
  maxRetries: Number(process.env.WORKER_MAX_RETRIES) || 3,
  batchSize: Number(process.env.WORKER_BATCH_SIZE) || 10,
  backoffBaseMs: 1000,
  backoffMaxMs: 30000
};

export type JobState = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';

export interface BackgroundJob<T = any> {
  id: string; // Idempotency key
  type: string;
  payload: T;
  state: JobState;
  attempts: number;
  maxRetries: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export function calculateBackoffWithJitter(attempt: number, baseMs = workerConfig.backoffBaseMs, maxMs = workerConfig.backoffMaxMs): number {
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt - 1));
  const jitter = Math.random() * 0.3 * exponential; // 30% jitter
  return Math.floor(exponential + jitter);
}
