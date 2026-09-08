# AERO APK — Production Observability, Health Checks & Logging

## Health Endpoints
AERO exposes health probes for load balancers and container orchestration:

- `GET /api/health`: Overall system metrics including memory heap, latency percentiles, cache stats, and environment name.
- `GET /api/health/liveness`: Lightweight fast check returning `{ status: "healthy" }`.
- `GET /api/health/readiness`: Verifies database connectivity and memory thresholds (< 1.5GB heap usage).

## Structured Logging Contract
All API and worker logs output JSON with standard attributes:

```json
{
  "timestamp": "2026-09-07T16:20:00.000Z",
  "level": "info",
  "requestId": "req_8f3a9d12",
  "service": "api-server",
  "endpoint": "/api/public/apps",
  "method": "GET",
  "statusCode": 200,
  "durationMs": 42.15
}
```
*Note: Credentials, tokens, private keys, and passwords are strictly excluded from logs.*
