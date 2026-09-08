# AERO APK — Deployment Architecture & Vercel Runtime Contract

## Overview
AERO employs a decoupled deployment model combining Vercel for web and short-lived API requests, Cloudflare R2 for binary delivery, Cloudinary for visual assets, and dedicated worker processes for heavy async tasks.

## Deployment Runtimes

### 1. Vercel Web & Frontend Runtime
- **Scope**: React + Vite SPA, static assets, client-side routing.
- **Constraints**: No long-running background loops, no local disk persistence.

### 2. Vercel Serverless API Runtime
- **Scope**: Stateless short-lived API endpoints (`/api/public/*`, `/api/auth/*`, `/api/admin/*`).
- **Constraints**: Max execution timeout 30s. Large APK downloads or uploads MUST be delegated via pre-signed Cloudflare R2 URLs or background worker queues.

### 3. Background Worker Runtime
- **Scope**: Async APK parsing, VirusTotal API scanning, analytics rollups, ranking calculation, recommendation matrix updates.
- **Queue Engine**: Firestore-backed job queue with bounded concurrency, exponential backoff with jitter, and Dead Letter Queue (DLQ) routing.

## Deployment Pipeline
1. **Push to `develop`**: Triggers automated linting, unit tests, and deployment to Staging environment.
2. **Push to `main`**: Runs full production pre-flight gate. Upon success, deploys to Vercel Production and executes post-deployment smoke tests.
