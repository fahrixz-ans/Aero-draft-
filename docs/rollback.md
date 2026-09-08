# AERO APK — Rollback & Emergency Killswitch Procedures

## Instant Feature Flag Killswitches
AERO provides emergency killswitches via environment variables that do not require database schema rollbacks:

| Feature Flag | Environment Variable | Default | Emergency Action |
|---|---|---|---|
| Public APK Downloads | `APK_DOWNLOAD_ENABLED` | `true` | Set to `false` to immediately halt public file downloads |
| APK Uploads | `APK_UPLOAD_ENABLED` | `true` | Set to `false` to block new APK submissions |
| Developer Portal | `DEVELOPER_UPLOAD_ENABLED` | `true` | Set to `false` to restrict upload access |
| Recommendations | `RECOMMENDATION_ENABLED` | `true` | Set to `false` to fallback to static app grids |
| Cache Engine | `CACHE_ENABLED` | `true` | Set to `false` to bypass cache layer in troubleshooting |

## Zero-Downtime Rollback Steps

### Application Rollback (Vercel)
1. Open Vercel Dashboard -> Deployments.
2. Select the last known stable deployment.
3. Click **Instant Promote to Production**.
4. Run `GET /api/health` to verify system readiness.

### Database Migration Safeguard
- Database schema changes follow the **Expand -> Migrate -> Verify -> Switch -> Cleanup** pattern.
- No destructive field deletions are performed in a single release.
