# AERO APK — Production Readiness & SLA/SLO Standards

## Readiness Baseline

### 1. Zero Firebase Auth Usage
- AERO uses Auth.js as its exclusive authentication engine. Firebase Auth imports (`firebase/auth`) are completely eliminated (`0` usage across client & server code). Firestore is used strictly as a database.

### 2. Service Level Objectives (SLO)
- **API Availability**: 99.9% uptime.
- **Latency Targets**:
  - API Response p50: < 150ms
  - API Response p95: < 500ms
  - API Response p99: < 1000ms
- **Cache Hit Ratio**: ≥ 80% on public discovery and search routes.
- **Download Gate Performance**: Pre-signed R2 URL generation < 100ms.

### 3. Disaster Recovery Metrics
- **RPO (Recovery Point Objective)**: ≤ 24 hours (daily automated Firestore exports & immutable R2 storage).
- **RTO (Recovery Time Objective)**: ≤ 4 hours for full system restoration.
