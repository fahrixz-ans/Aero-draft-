# AERO APK — Incident Response & Triage Protocol

## Incident Severity Matrix

### Severity 1 (Critical)
- **Definition**: Core service down (e.g., download engine failing, auth down, database unreadable).
- **Action**: Immediate on-call escalation, trigger feature killswitch if applicable, initiate Vercel rollback.
- **SLA**: Response within 15 minutes, Resolution target < 2 hours.

### Severity 2 (High)
- **Definition**: Non-critical degradation (e.g., worker processing delay, cache miss spike, VirusTotal rate limit).
- **Action**: Investigate logs via request correlation ID (`X-Request-ID`), monitor DLQ backlog.
- **SLA**: Response within 1 hour, Resolution target < 8 hours.

### Severity 3 (Moderate)
- **Definition**: Cosmetic bugs or localized dashboard display errors.
- **Action**: Queue for standard patch cycle.
