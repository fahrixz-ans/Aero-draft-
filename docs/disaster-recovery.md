# AERO APK — Disaster Recovery Runbook

## Target Recovery Bounds
- **RPO (Recovery Point Objective)**: ≤ 24 Hours
- **RTO (Recovery Time Objective)**: ≤ 4 Hours

## Recovery Procedures

### 1. Firestore Database Recovery
1. Access Google Cloud Console -> Firestore -> Backups.
2. Select target automated daily snapshot.
3. Restore snapshot to new target database instance or collection namespace.
4. Update `FIREBASE_PROJECT_ID` environment variable in Vercel if pointing to new project instance.

### 2. Cloudflare R2 Object Storage Recovery
- Published APK objects in `aero-apk-production` bucket are immutable and protected by Object Lock policies.
- In case of regional bucket disruption, re-sync from backup bucket or trigger developer re-upload workflow for flagged items.
