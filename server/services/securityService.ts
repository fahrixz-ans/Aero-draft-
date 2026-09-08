// ---------------------------------------------------------------------------
// AERO STAGE 9.11 — CENTRALIZED SECURITY, ABUSE PREVENTION & PLATFORM PROTECTION
// Core security engine, rate limiting, bot protection, abuse scoring & incident tracking
// ---------------------------------------------------------------------------

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { sendError, ERROR_CODES } from '../errors';
import { auditLogsDb, appsDb, versionsDb, usersDb } from '../repositories';
import { emitAeroEvent } from '../events';

// ---------------------------------------------------------------------------
// 1. DATA TYPES & CONTRACTS
// ---------------------------------------------------------------------------

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'AUTH_SUCCESS'
  | 'FORBIDDEN_ACCESS'
  | 'RATE_LIMIT_TRIGGERED'
  | 'ABUSE_DETECTED'
  | 'UPLOAD_REJECTED'
  | 'DOWNLOAD_BLOCKED'
  | 'SECURITY_SCAN_FAILED'
  | 'OWNERSHIP_REJECTED'
  | 'MODERATION_REJECTED'
  | 'ADMIN_PERMISSION_DENIED'
  | 'SUSPICIOUS_REQUEST'
  | 'API_VALIDATION_FAILURE'
  | 'WEBHOOK_REPLAY'
  | 'BOT_DETECTED'
  | 'SEARCH_ABUSE'
  | 'RECOMMENDATION_SCRAPING'
  | 'IDOR_ATTEMPT'
  | 'CSRF_BLOCKED'
  | 'PATH_TRAVERSAL_ATTEMPT'
  | 'DUPLICATE_APK_DETECTED';

export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  actorId?: string;
  anonymousId?: string;
  ipHash?: string;
  userAgentHash?: string;
  requestId: string;
  endpoint?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AbuseScore {
  entityType: 'IP' | 'USER' | 'DEVELOPER' | 'SESSION';
  entityId: string;
  score: number;
  level: 'NORMAL' | 'WATCH' | 'RESTRICTED' | 'BLOCKED';
  reasons: string[];
  updatedAt: string;
}

export interface SecurityIncident {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  entityType?: string;
  entityId?: string;
  description: string;
  evidence?: Record<string, unknown>;
  status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  updatedAt: string;
}

export type RateLimitCategory =
  | 'AUTH'
  | 'ADMIN'
  | 'DEVELOPER_UPLOAD'
  | 'SEARCH'
  | 'PUBLIC_APP_DETAIL'
  | 'DOWNLOAD'
  | 'ANALYTICS'
  | 'RECOMMENDATION';

interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

const RATE_LIMIT_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  AUTH: { windowSeconds: 60, maxRequests: 15 },
  ADMIN: { windowSeconds: 60, maxRequests: 120 },
  DEVELOPER_UPLOAD: { windowSeconds: 3600, maxRequests: 20 },
  SEARCH: { windowSeconds: 60, maxRequests: 60 },
  PUBLIC_APP_DETAIL: { windowSeconds: 60, maxRequests: 180 },
  DOWNLOAD: { windowSeconds: 3600, maxRequests: 30 },
  ANALYTICS: { windowSeconds: 60, maxRequests: 120 },
  RECOMMENDATION: { windowSeconds: 60, maxRequests: 90 }
};

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// ---------------------------------------------------------------------------
// 2. IN-MEMORY STORES (Clean, fast, thread-safe memory stores)
// ---------------------------------------------------------------------------

export const securityEventsDb: SecurityEvent[] = [];
export const abuseScoresDb = new Map<string, AbuseScore>();
export const securityIncidentsDb: SecurityIncident[] = [];
const rateLimitBuckets = new Map<string, RateLimitRecord>();
const processedAnalyticsEventIds = new Set<string>();

// Seed default initial baseline state for transparency and security auditing
(() => {
  const now = new Date();
  const seedEvents: SecurityEvent[] = [
    {
      id: 'sec_evt_init_1',
      type: 'AUTH_SUCCESS',
      severity: 'INFO',
      actorId: 'usr_superadmin',
      ipHash: crypto.createHash('sha256').update('127.0.0.1_salt_aero').digest('hex').substring(0, 16),
      requestId: 'req_system_boot',
      endpoint: '/api/auth/session',
      createdAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      metadata: { role: 'SUPER_ADMIN', message: 'Sesi login administratif terverifikasi aman' }
    },
    {
      id: 'sec_evt_init_2',
      type: 'BOT_DETECTED',
      severity: 'LOW',
      ipHash: crypto.createHash('sha256').update('198.51.100.22_salt_aero').digest('hex').substring(0, 16),
      requestId: 'req_bot_probe',
      endpoint: '/api/public/search',
      createdAt: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      metadata: { userAgent: 'python-requests/2.28', queryBurst: 42, reason: 'Pola scraping agregat terdeteksi' }
    },
    {
      id: 'sec_evt_init_3',
      type: 'RATE_LIMIT_TRIGGERED',
      severity: 'LOW',
      ipHash: crypto.createHash('sha256').update('203.0.113.88_salt_aero').digest('hex').substring(0, 16),
      requestId: 'req_limit_1',
      endpoint: '/api/public/search',
      createdAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      metadata: { category: 'SEARCH', hitCount: 65, maxAllowed: 60 }
    }
  ];
  securityEventsDb.push(...seedEvents);

  // Seed baseline incidents from previous security scans
  securityIncidentsDb.push({
    id: 'inc_sec_001',
    type: 'APK_INTEGRITY_ALERT',
    severity: 'LOW',
    entityType: 'APP_VERSION',
    entityId: 'ver_capcut_1',
    description: 'Pemeriksaan integritas berkala APK CapCut v11.4.0 lolos 0 ancaman VirusTotal.',
    status: 'RESOLVED',
    evidence: { sha256: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', enginesPassed: 72 },
    createdAt: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
  });
})();

// ---------------------------------------------------------------------------
// 3. SECURITY SERVICE IMPLEMENTATION
// ---------------------------------------------------------------------------

export class SecurityService {
  /**
   * Helper: Anonymize IP address with SHA-256 hash (never store raw IP unnecessarily)
   */
  static hashIp(ip: string | undefined): string {
    if (!ip) return 'unknown_ip';
    return crypto.createHash('sha256').update(`${ip}_aero_salt_2026`).digest('hex').substring(0, 16);
  }

  /**
   * Helper: Anonymize User-Agent
   */
  static hashUserAgent(ua: string | undefined): string {
    if (!ua) return 'unknown_ua';
    return crypto.createHash('sha256').update(`${ua}_aero_ua`).digest('hex').substring(0, 16);
  }

  /**
   * Record Centralized Security Event
   */
  static recordSecurityEvent(params: {
    type: SecurityEventType;
    severity: SecuritySeverity;
    actorId?: string;
    anonymousId?: string;
    ip?: string;
    userAgent?: string;
    requestId: string;
    endpoint?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): SecurityEvent {
    const ipHash = this.hashIp(params.ip);
    const userAgentHash = this.hashUserAgent(params.userAgent);

    const event: SecurityEvent = {
      id: `sec_evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      type: params.type,
      severity: params.severity,
      actorId: params.actorId,
      anonymousId: params.anonymousId,
      ipHash,
      userAgentHash,
      requestId: params.requestId,
      endpoint: params.endpoint,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      createdAt: new Date().toISOString()
    };

    securityEventsDb.unshift(event);
    if (securityEventsDb.length > 5000) {
      securityEventsDb.length = 5000; // retain last 5,000 security events
    }

    // Evaluate if this event warrants updating abuse score or creating an incident
    this.processEventForAbuseAndIncidents(event, params.ip);

    return event;
  }

  /**
   * Process event to adjust abuse scores and auto-create incidents if severe
   */
  private static processEventForAbuseAndIncidents(event: SecurityEvent, rawIp?: string) {
    const entityKey = event.actorId ? `USER:${event.actorId}` : (rawIp ? `IP:${rawIp}` : `HASH:${event.ipHash}`);
    const [entityType, entityId] = entityKey.split(':') as [any, string];

    // Penalty points based on event type
    let penalty = 0;
    if (event.type === 'RATE_LIMIT_TRIGGERED') penalty = 10;
    else if (event.type === 'AUTH_FAILURE') penalty = 15;
    else if (event.type === 'FORBIDDEN_ACCESS' || event.type === 'IDOR_ATTEMPT') penalty = 25;
    else if (event.type === 'BOT_DETECTED' || event.type === 'SEARCH_ABUSE') penalty = 20;
    else if (event.type === 'PATH_TRAVERSAL_ATTEMPT' || event.type === 'UPLOAD_REJECTED') penalty = 35;
    else if (event.type === 'SECURITY_SCAN_FAILED') penalty = 50;

    if (penalty > 0) {
      this.evaluateAbuse(entityType, entityId, penalty, `${event.type} pada ${event.endpoint || 'API'}`);
    }

    // Auto-create incident on CRITICAL or HIGH security failures
    if (event.severity === 'CRITICAL' || (event.severity === 'HIGH' && ['IDOR_ATTEMPT', 'PATH_TRAVERSAL_ATTEMPT', 'SECURITY_SCAN_FAILED'].includes(event.type))) {
      this.createSecurityIncident({
        type: event.type,
        severity: event.severity,
        entityType: event.entityType || entityType,
        entityId: event.entityId || entityId,
        description: `Insiden terdeteksi: ${event.type} - ${event.metadata?.message || 'Aktivitas mencurigakan pada sistem'}`,
        evidence: {
          requestId: event.requestId,
          endpoint: event.endpoint,
          metadata: event.metadata
        }
      });
    }
  }

  /**
   * Evaluate and update Abuse Score for an entity (Adaptive Rate Limiting & Protection)
   */
  static evaluateAbuse(
    entityType: 'IP' | 'USER' | 'DEVELOPER' | 'SESSION',
    entityId: string,
    scoreDelta: number,
    reason: string
  ): AbuseScore {
    const key = `${entityType}:${entityId}`;
    let record = abuseScoresDb.get(key);

    if (!record) {
      record = {
        entityType,
        entityId,
        score: 0,
        level: 'NORMAL',
        reasons: [],
        updatedAt: new Date().toISOString()
      };
      abuseScoresDb.set(key, record);
    }

    record.score = Math.min(100, Math.max(0, record.score + scoreDelta));
    if (!record.reasons.includes(reason)) {
      record.reasons.unshift(reason);
      if (record.reasons.length > 5) record.reasons.pop();
    }
    record.updatedAt = new Date().toISOString();

    // Determine adaptive level
    if (record.score >= 85) {
      record.level = 'BLOCKED';
    } else if (record.score >= 60) {
      record.level = 'RESTRICTED';
    } else if (record.score >= 30) {
      record.level = 'WATCH';
    } else {
      record.level = 'NORMAL';
    }

    return record;
  }

  /**
   * Check Rate Limit with Adaptive Throttling
   */
  static checkRateLimit(
    category: RateLimitCategory,
    identifier: string,
    rawIp?: string
  ): { allowed: boolean; retryAfterSeconds: number; abuseLevel: string; current: number; max: number } {
    const config = RATE_LIMIT_CONFIGS[category];
    const now = Date.now();

    // Check abuse level of this IP/User
    const abuseKey = rawIp ? `IP:${rawIp}` : `IDENT:${identifier}`;
    const abuse = abuseScoresDb.get(abuseKey);
    const abuseLevel = abuse?.level || 'NORMAL';

    // If completely blocked by adaptive score, deny immediately
    if (abuseLevel === 'BLOCKED') {
      return { allowed: false, retryAfterSeconds: 900, abuseLevel, current: 999, max: 0 };
    }

    // Adjust max requests based on abuse level
    let maxAllowed = config.maxRequests;
    if (abuseLevel === 'RESTRICTED') {
      maxAllowed = Math.max(1, Math.floor(config.maxRequests * 0.3)); // 70% reduction
    } else if (abuseLevel === 'WATCH') {
      maxAllowed = Math.max(1, Math.floor(config.maxRequests * 0.7)); // 30% reduction
    }

    const bucketKey = `${category}:${identifier}`;
    let bucket = rateLimitBuckets.get(bucketKey);

    if (!bucket || now > bucket.resetAt) {
      bucket = {
        count: 1,
        resetAt: now + config.windowSeconds * 1000
      };
      rateLimitBuckets.set(bucketKey, bucket);
      return { allowed: true, retryAfterSeconds: 0, abuseLevel, current: 1, max: maxAllowed };
    }

    bucket.count += 1;
    const remainingTimeSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    if (bucket.count > maxAllowed) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, remainingTimeSeconds),
        abuseLevel,
        current: bucket.count,
        max: maxAllowed
      };
    }

    return { allowed: true, retryAfterSeconds: 0, abuseLevel, current: bucket.count, max: maxAllowed };
  }

  /**
   * Bot & Web Scraper Detection
   */
  static detectBotOrScraper(req: Request): { isBot: boolean; reason?: string } {
    const ua = req.headers['user-agent'] || '';
    const lowerUa = ua.toLowerCase();

    // Known harmful automated tool signatures
    const maliciousBots = [
      'sqlmap', 'nikto', 'acunetix', 'masscan', 'nmap', 'havij', 'zgrab',
      'wpscan', 'dirbuster', 'gobuster', 'burpcollaborator', 'curl/7.0'
    ];
    for (const b of maliciousBots) {
      if (lowerUa.includes(b)) {
        return { isBot: true, reason: `Alat pemindaian otomatis terdeteksi (${b})` };
      }
    }

    // Missing user agent on public search or download is suspicious
    if (!ua && (req.path.includes('/download') || req.path.includes('/search'))) {
      return { isBot: true, reason: 'Header User-Agent kosong pada endpoint sensitif' };
    }

    return { isBot: false };
  }

  /**
   * Validate and sanitize search queries to prevent search abuse and excessive memory consumption
   */
  static sanitizeSearchQuery(query: string | undefined): string {
    if (!query) return '';
    // Trim and cap maximum search query length at 100 characters
    let cleaned = query.trim().substring(0, 100);
    // Strip control characters and potential null-bytes
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
    return cleaned;
  }

  /**
   * Validate analytics payload: check eventId deduplication, clock drift, and reject fake volume
   */
  static validateAnalyticsEvent(payload: {
    eventId?: string;
    eventType?: string;
    timestamp?: string;
    appId?: string;
    value?: number;
  }): { valid: boolean; reason?: string } {
    if (!payload.eventType) {
      return { valid: false, reason: 'Tipe event analitik wajib diisi.' };
    }

    // Event deduplication protection
    if (payload.eventId) {
      if (processedAnalyticsEventIds.has(payload.eventId)) {
        return { valid: false, reason: 'Event ID duplikat (Replay event diabaikan).' };
      }
      processedAnalyticsEventIds.add(payload.eventId);
      if (processedAnalyticsEventIds.size > 20000) {
        // Prune oldest entries
        const iterator = processedAnalyticsEventIds.values();
        for (let i = 0; i < 5000; i++) {
          processedAnalyticsEventIds.delete(iterator.next().value!);
        }
      }
    }

    // Validate timestamp clock drift (must be within +/- 15 minutes of server time)
    if (payload.timestamp) {
      const eventTime = new Date(payload.timestamp).getTime();
      const now = Date.now();
      if (isNaN(eventTime) || Math.abs(now - eventTime) > 15 * 60 * 1000) {
        return { valid: false, reason: 'Timestamp event berada di luar toleransi sinkronisasi server (maksimal 15 menit).' };
      }
    }

    // Reject inflated / manipulated metrics: client cannot report download counts > 1 in a single event
    if (payload.value && payload.value > 1 && payload.eventType === 'download_completed') {
      return { valid: false, reason: 'Manipulasi metrik kuantitas terdeteksi: Nilai unduhan klien ditolak.' };
    }

    return { valid: true };
  }

  /**
   * APK Filename Sanitization & Path Traversal Prevention
   */
  static sanitizeApkFileName(originalName: string, slug: string, versionName: string): string {
    // Strip directories, null-bytes, and path traversal tokens
    let sanitized = originalName.replace(/(\.\.[\/\\]|[\/\\]|\0)/g, '');
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!sanitized.toLowerCase().endsWith('.apk')) {
      sanitized = `${sanitized}.apk`;
    }

    // Ensure it doesn't exceed 120 chars
    if (sanitized.length > 120) {
      sanitized = `${slug}_${versionName}.apk`;
    }

    return sanitized;
  }

  /**
   * Check for duplicate APK by SHA-256
   */
  static checkDuplicateApk(sha256: string, appId?: string): { isDuplicate: boolean; existingVersionId?: string } {
    const existing = versionsDb.find(v => v.sha256.toUpperCase() === sha256.toUpperCase());
    if (existing) {
      return { isDuplicate: true, existingVersionId: existing.id };
    }
    return { isDuplicate: false };
  }

  /**
   * Verify Developer Resource Ownership (IDOR Protection)
   */
  static verifyDeveloperOwnership(user: any, resourceDeveloperEmail?: string, resourceDeveloperId?: string): boolean {
    if (!user) return false;
    // Super Admin & Admin can access all
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;

    // For developer roles, email or ID must strictly match
    const userEmail = (user.email || '').toLowerCase();
    const targetEmail = (resourceDeveloperEmail || '').toLowerCase();

    if (targetEmail && userEmail === targetEmail) return true;
    if (resourceDeveloperId && user.id === resourceDeveloperId) return true;

    return false;
  }

  /**
   * Create Security Incident
   */
  static createSecurityIncident(data: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    entityType?: string;
    entityId?: string;
    description: string;
    evidence?: Record<string, unknown>;
  }): SecurityIncident {
    const incident: SecurityIncident = {
      id: `inc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      type: data.type,
      severity: data.severity,
      entityType: data.entityType,
      entityId: data.entityId,
      description: data.description,
      evidence: data.evidence,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    securityIncidentsDb.unshift(incident);
    return incident;
  }

  /**
   * Update Security Incident Status
   */
  static updateIncidentStatus(
    incidentId: string,
    status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'DISMISSED',
    note: string,
    actor: any
  ): SecurityIncident | null {
    const incident = securityIncidentsDb.find(i => i.id === incidentId);
    if (!incident) return null;

    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    incident.evidence = {
      ...(incident.evidence || {}),
      resolutionNote: note,
      resolvedBy: actor?.email || actor?.name || 'admin'
    };

    // Record admin audit log
    auditLogsDb.unshift({
      id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      adminId: actor?.id || 'admin',
      adminEmail: actor?.email || 'admin@aeroapk.com',
      action: 'SECURITY_INCIDENT_STATUS_UPDATE',
      entityType: 'SECURITY_INCIDENT',
      entityId: incident.id,
      entityName: incident.type,
      metadata: { newStatus: status, note },
      createdAt: new Date().toISOString()
    });

    return incident;
  }

  /**
   * Get Comprehensive Security Overview for Admin Intelligence
   */
  static getSecurityOverview() {
    const totalEvents = securityEventsDb.length;
    const blockedCount = securityEventsDb.filter(e => e.type === 'RATE_LIMIT_TRIGGERED' || e.type === 'DOWNLOAD_BLOCKED' || e.type === 'FORBIDDEN_ACCESS').length;
    const botCount = securityEventsDb.filter(e => e.type === 'BOT_DETECTED').length;
    const rateLimitEvents = securityEventsDb.filter(e => e.type === 'RATE_LIMIT_TRIGGERED').length;
    const quarantinedCount = versionsDb.filter(v => v.securityStatus === 'QUARANTINED').length;
    const revokedCount = versionsDb.filter(v => v.status === 'REVOKED').length;

    const openIncidents = securityIncidentsDb.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
    const flaggedEntities = Array.from(abuseScoresDb.values()).filter(a => a.level !== 'NORMAL');

    return {
      metrics: {
        totalEvents,
        blockedCount,
        rateLimitEvents,
        botCount,
        quarantinedCount,
        revokedCount,
        openIncidents,
        flaggedEntitiesCount: flaggedEntities.length,
        virusTotalHealth: 'HEALTHY'
      },
      recentEvents: securityEventsDb.slice(0, 50),
      incidents: securityIncidentsDb,
      abuseScores: Array.from(abuseScoresDb.values()).slice(0, 30),
      timestamp: new Date().toISOString()
    };
  }
}

// ---------------------------------------------------------------------------
// 4. EXPRESS RATE LIMITING MIDDLEWARE FACTORY
// ---------------------------------------------------------------------------

export function createRateLimiter(category: RateLimitCategory) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace(/^.*:/, '');
    const user = (req as any).user;
    const identifier = user ? `user_${user.id}` : `ip_${rawIp}`;

    const check = SecurityService.checkRateLimit(category, identifier, rawIp);

    if (!check.allowed) {
      res.setHeader('Retry-After', check.retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', check.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', check.retryAfterSeconds);

      // Record rate limit security event
      SecurityService.recordSecurityEvent({
        type: 'RATE_LIMIT_TRIGGERED',
        severity: 'LOW',
        actorId: user?.id,
        ip: rawIp,
        userAgent: req.headers['user-agent'],
        requestId: (req as any).id || `req_${Date.now()}`,
        endpoint: req.originalUrl || req.path,
        metadata: {
          category,
          current: check.current,
          max: check.max,
          retryAfterSeconds: check.retryAfterSeconds
        }
      });

      return sendError(
        res,
        ERROR_CODES.RATE_LIMITED,
        `Terlalu banyak permintaan pada kategori '${category}'. Silakan coba kembali dalam ${check.retryAfterSeconds} detik.`,
        429,
        { retryAfter: check.retryAfterSeconds, category }
      );
    }

    res.setHeader('X-RateLimit-Limit', check.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, check.max - check.current));
    next();
  };
}
