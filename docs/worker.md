# AERO APK — Async Worker Runtime & Job Queue

## Worker Architecture
Heavy computational tasks (APK parsing, VirusTotal verification, analytics rollups, smart collection generation) are handled asynchronously by worker loops governed by `server/workers/workerConfig.ts`.

## Job Lifecycle States
1. `QUEUED`: Job created with unique `id` (Idempotency Key).
2. `PROCESSING`: Claimed by worker under bounded concurrency limit (`WORKER_CONCURRENCY=5`).
3. `COMPLETED`: Result written to Firestore and metrics updated.
4. `FAILED`: Processing error encountered; scheduled for retry using exponential backoff with 30% random jitter.
5. `DEAD_LETTER`: Max retry attempts (`WORKER_MAX_RETRIES=3`) exhausted; routed to DLQ for manual inspection.
