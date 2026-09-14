import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { sendError, ERROR_CODES } from '../errors';
import {
  AuditLogRepository,
  VersionRepository,
  SecurityEventRepository,
  SecurityIncidentRepository,
  AbuseScoreRepository,
  IdempotencyRepository,
} from '../repositories';

export type SecurityEventType =
  | 'AUTH_FAILURE' | 'AUTH_SUCCESS' | 'FORBIDDEN_ACCESS' | 'RATE_LIMIT_TRIGGERED'
  | 'ABUSE_DETECTED' | 'UPLOAD_REJECTED' | 'DOWNLOAD_BLOCKED' | 'SECURITY_SCAN_FAILED'
  | 'OWNERSHIP_REJECTED' | 'MODERATION_REJECTED' | 'ADMIN_PERMISSION_DENIED'
  | 'SUSPICIOUS_REQUEST' | 'API_VALIDATION_FAILURE' | 'WEBHOOK_REPLAY'
  | 'BOT_DETECTED' | 'SEARCH_ABUSE' | 'RECOMMENDATION_SCRAPING' | 'IDOR_ATTEMPT'
  | 'CSRF_BLOCKED' | 'PATH_TRAVERSAL_ATTEMPT' | 'DUPLICATE_APK_DETECTED';

export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RateLimitCategory =
  | 'AUTH' | 'ADMIN' | 'DEVELOPER_UPLOAD' | 'SEARCH' | 'PUBLIC_APP_DETAIL'
  | 'DOWNLOAD' | 'ANALYTICS' | 'RECOMMENDATION';

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

const RATE_LIMIT_CONFIGS: Record<RateLimitCategory, { windowSeconds: number; maxRequests: number }> = {
  AUTH: { windowSeconds: 60, maxRequests: 15 },
  ADMIN: { windowSeconds: 60, maxRequests: 120 },
  DEVELOPER_UPLOAD: { windowSeconds: 3600, maxRequests: 20 },
  SEARCH: { windowSeconds: 60, maxRequests: 60 },
  PUBLIC_APP_DETAIL: { windowSeconds: 60, maxRequests: 180 },
  DOWNLOAD: { windowSeconds: 3600, maxRequests: 30 },
  ANALYTICS: { windowSeconds: 60, maxRequests: 120 },
  RECOMMENDATION: { windowSeconds: 60, maxRequests: 90 },
};

export class SecurityService {
  static hashIp(ip?: string): string {
    if (!ip) return 'unknown_ip';
    const salt = process.env.SECURITY_HASH_SALT || process.env.AUTH_SECRET || 'development-only';
    return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 32);
  }

  static hashUserAgent(ua?: string): string {
    if (!ua) return 'unknown_ua';
    const salt = process.env.SECURITY_HASH_SALT || process.env.AUTH_SECRET || 'development-only';
    return crypto.createHash('sha256').update(`${ua}:${salt}`).digest('hex').slice(0, 32);
  }

  static async recordSecurityEvent(params: {
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
  }): Promise<SecurityEvent> {
    const event = await SecurityEventRepository.create({
      type: params.type,
      severity: params.severity,
      actorId: params.actorId,
      anonymousId: params.anonymousId,
      ipHash: this.hashIp(params.ip),
      userAgentHash: this.hashUserAgent(params.userAgent),
      requestId: params.requestId,
      endpoint: params.endpoint,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    });

    if (!event) throw new Error('Failed to persist security event');

    const penalty =
      params.type === 'RATE_LIMIT_TRIGGERED' ? 10 :
      params.type === 'AUTH_FAILURE' ? 15 :
      params.type === 'FORBIDDEN_ACCESS' || params.type === 'IDOR_ATTEMPT' ? 25 :
      params.type === 'BOT_DETECTED' || params.type === 'SEARCH_ABUSE' ? 20 :
      params.type === 'PATH_TRAVERSAL_ATTEMPT' || params.type === 'UPLOAD_REJECTED' ? 35 :
      params.type === 'SECURITY_SCAN_FAILED' ? 50 : 0;

    if (penalty > 0) {
      const entityType = params.actorId ? 'USER' : 'IP';
      const entityId = params.actorId || this.hashIp(params.ip);
      await this.evaluateAbuse(entityType, entityId, penalty, `${params.type} pada ${params.endpoint || 'API'}`);
    }

    if (
      params.severity === 'CRITICAL' ||
      (params.severity === 'HIGH' && ['IDOR_ATTEMPT', 'PATH_TRAVERSAL_ATTEMPT', 'SECURITY_SCAN_FAILED'].includes(params.type))
    ) {
      await this.createSecurityIncident({
        type: params.type,
        severity: params.severity,
        entityType: params.entityType || (params.actorId ? 'USER' : 'IP'),
        entityId: params.entityId || params.actorId || this.hashIp(params.ip),
        description: `Insiden terdeteksi: ${params.type}`,
        evidence: { requestId: params.requestId, endpoint: params.endpoint, metadata: params.metadata },
      });
    }

    return event as SecurityEvent;
  }

  static async evaluateAbuse(
    entityType: AbuseScore['entityType'],
    entityId: string,
    scoreDelta: number,
    reason: string
  ): Promise<AbuseScore> {
    const current = await AbuseScoreRepository.get(entityType, entityId);
    const score = Math.min(100, Math.max(0, Number(current?.score || 0) + scoreDelta));
    const reasons = [...(current?.reasons || [])];
    if (!reasons.includes(reason)) reasons.unshift(reason);
    const limitedReasons = reasons.slice(0, 10);
    const level: AbuseScore['level'] =
      score >= 85 ? 'BLOCKED' : score >= 60 ? 'RESTRICTED' : score >= 30 ? 'WATCH' : 'NORMAL';

    const saved = await AbuseScoreRepository.upsert({
      id: `${entityType}:${entityId}`,
      entityType,
      entityId,
      score,
      level,
      reasons: limitedReasons,
    });
    if (!saved) throw new Error('Failed to persist abuse score');
    return saved as AbuseScore;
  }

  static async checkRateLimit(
    category: RateLimitCategory,
    identifier: string,
    rawIp?: string
  ): Promise<{ allowed: boolean; retryAfterSeconds: number; abuseLevel: string; current: number; max: number }> {
    const config = RATE_LIMIT_CONFIGS[category];
    const abuse = await AbuseScoreRepository.get('IP', rawIp ? this.hashIp(rawIp) : identifier);
    const abuseLevel = abuse?.level || 'NORMAL';
    if (abuseLevel === 'BLOCKED') {
      return { allowed: false, retryAfterSeconds: 900, abuseLevel, current: 999, max: 0 };
    }

    const maxAllowed =
      abuseLevel === 'RESTRICTED' ? Math.max(1, Math.floor(config.maxRequests * 0.3)) :
      abuseLevel === 'WATCH' ? Math.max(1, Math.floor(config.maxRequests * 0.7)) :
      config.maxRequests;

    const { RateLimitRepository } = await import('../repositories');
    const result = await RateLimitRepository.consume(
      `${category}:${identifier}:${rawIp ? this.hashIp(rawIp) : 'noip'}`,
      config.windowSeconds * 1000,
      maxAllowed
    );

    return {
      allowed: result.allowed,
      retryAfterSeconds: result.allowed ? 0 : Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
      abuseLevel,
      current: result.current,
      max: maxAllowed,
    };
  }

  static detectBotOrScraper(req: Request): { isBot: boolean; reason?: string } {
    const ua = String(req.headers['user-agent'] || '').toLowerCase();
    const malicious = ['sqlmap', 'nikto', 'acunetix', 'masscan', 'nmap', 'havij', 'zgrab', 'wpscan', 'dirbuster', 'gobuster', 'burpcollaborator'];
    const found = malicious.find(bot => ua.includes(bot));
    if (found) return { isBot: true, reason: `Alat pemindaian otomatis terdeteksi (${found})` };
    if (!ua && (req.path.includes('/download') || req.path.includes('/search'))) {
      return { isBot: true, reason: 'Header User-Agent kosong pada endpoint sensitif' };
    }
    return { isBot: false };
  }

  static sanitizeSearchQuery(query?: string): string {
    return String(query || '').trim().slice(0, 100).replace(/[\x00-\x1F\x7F]/g, '');
  }

  static async validateAnalyticsEvent(payload: {
    eventId?: string;
    eventType?: string;
    timestamp?: string;
    appId?: string;
    value?: number;
  }): Promise<{ valid: boolean; reason?: string }> {
    if (!payload.eventType) return { valid: false, reason: 'Tipe event analitik wajib diisi.' };

    if (payload.eventId) {
      const claimed = await IdempotencyRepository.claim(`analytics:${payload.eventId}`, 24 * 60 * 60 * 1000);
      if (!claimed) return { valid: false, reason: 'Event ID duplikat (replay event diabaikan).' };
    }

    if (payload.timestamp) {
      const eventTime = Date.parse(payload.timestamp);
      if (!Number.isFinite(eventTime) || Math.abs(Date.now() - eventTime) > 15 * 60 * 1000) {
        return { valid: false, reason: 'Timestamp event berada di luar toleransi 15 menit.' };
      }
    }

    if (payload.value && payload.value > 1 && payload.eventType === 'download_completed') {
      return { valid: false, reason: 'Nilai unduhan per event tidak valid.' };
    }

    return { valid: true };
  }

  static sanitizeApkFileName(originalName: string, slug: string, versionName: string): string {
    let value = String(originalName || '').replace(/(\.\.[/\\]|\0|[/\\])/g, '');
    value = value.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!value.toLowerCase().endsWith('.apk')) value += '.apk';
    return value.length > 120 ? `${slug}_${versionName}.apk` : value;
  }

  static async checkDuplicateApk(sha256: string) {
    const existing = await VersionRepository.findBySha256(sha256);
    return existing ? { isDuplicate: true, existingVersionId: existing.id } : { isDuplicate: false };
  }

  static verifyDeveloperOwnership(user: any, resourceDeveloperEmail?: string, resourceDeveloperId?: string): boolean {
    if (!user) return false;
    if (['SUPER_ADMIN', 'ADMIN', 'OWNER'].includes(String(user.role).toUpperCase())) return true;
    const email = String(user.email || '').toLowerCase();
    return (!!resourceDeveloperEmail && email === resourceDeveloperEmail.toLowerCase()) ||
      (!!resourceDeveloperId && user.id === resourceDeveloperId);
  }

  static async createSecurityIncident(data: {
    type: string;
    severity: SecurityIncident['severity'];
    entityType?: string;
    entityId?: string;
    description: string;
    evidence?: Record<string, unknown>;
  }): Promise<SecurityIncident> {
    const id = `inc_${crypto.randomUUID()}`;
    const saved = await SecurityIncidentRepository.create({
      id,
      type: data.type,
      severity: data.severity,
      entityType: data.entityType,
      entityId: data.entityId,
      description: data.description,
      evidence: data.evidence,
      status: 'OPEN',
    });
    if (!saved) throw new Error('Failed to persist security incident');
    return saved as SecurityIncident;
  }

  static async updateIncidentStatus(
    incidentId: string,
    status: SecurityIncident['status'],
    note: string,
    actor: any
  ): Promise<SecurityIncident | null> {
    const incident = await SecurityIncidentRepository.findById(incidentId);
    if (!incident) return null;

    const updated = await SecurityIncidentRepository.update(incidentId, {
      status,
      evidence: {
        ...(incident.evidence || {}),
        resolutionNote: note,
        resolvedBy: actor?.email || actor?.name || actor?.id || 'admin',
      },
    });

    if (updated) {
      await AuditLogRepository.create({
        id: `audit_${crypto.randomUUID()}`,
        adminId: actor?.id || 'admin',
        adminEmail: actor?.email || 'unknown',
        action: 'SECURITY_INCIDENT_STATUS_UPDATE',
        entityType: 'SECURITY_INCIDENT',
        entityId: incidentId,
        entityName: incident.type,
        metadata: { newStatus: status, note },
        createdAt: new Date().toISOString(),
      });
    }
    return updated as SecurityIncident | null;
  }

  static async getSecurityOverview() {
    const [events, incidents, abuseScores, versions] = await Promise.all([
      SecurityEventRepository.list({ limit: 500 }),
      SecurityIncidentRepository.list(500),
      AbuseScoreRepository.list(500),
      VersionRepository.listAll(),
    ]);

    const blockedTypes = new Set(['RATE_LIMIT_TRIGGERED', 'DOWNLOAD_BLOCKED', 'FORBIDDEN_ACCESS']);
    const blockedCount = events.filter(e => blockedTypes.has(e.type)).length;
    const botCount = events.filter(e => e.type === 'BOT_DETECTED').length;
    const rateLimitEvents = events.filter(e => e.type === 'RATE_LIMIT_TRIGGERED').length;
    const quarantinedCount = versions.filter(v => v.securityStatus === 'QUARANTINED').length;
    const revokedCount = versions.filter(v => v.status === 'REVOKED').length;
    const openIncidents = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;

    return {
      metrics: {
        totalEvents: events.length,
        blockedCount,
        rateLimitEvents,
        botCount,
        quarantinedCount,
        revokedCount,
        openIncidents,
        flaggedEntitiesCount: abuseScores.filter(a => a.level !== 'NORMAL').length,
        virusTotalHealth: 'UNAVAILABLE',
      },
      recentEvents: events.slice(0, 50),
      incidents,
      abuseScores: abuseScores.slice(0, 30),
      timestamp: new Date().toISOString(),
    };
  }
}

export function createRateLimiter(category: RateLimitCategory) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawIp = (req.ip || req.socket.remoteAddress || 'unknown').replace(/^::ffff:/, '');
      const user = (req as any).user;
      const identifier = user ? `user_${user.id}` : `ip_${SecurityService.hashIp(rawIp)}`;
      const check = await SecurityService.checkRateLimit(category, identifier, rawIp);

      res.setHeader('X-RateLimit-Limit', check.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, check.max - check.current));
      res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + check.retryAfterSeconds * 1000) / 1000));

      if (!check.allowed) {
        await SecurityService.recordSecurityEvent({
          type: 'RATE_LIMIT_TRIGGERED',
          severity: 'LOW',
          actorId: user?.id,
          ip: rawIp,
          userAgent: req.headers['user-agent'],
          requestId: (req as any).id || crypto.randomUUID(),
          endpoint: req.originalUrl || req.path,
          metadata: { category, current: check.current, max: check.max, retryAfterSeconds: check.retryAfterSeconds },
        }).catch(error => console.error('[security] event persistence failed:', error));

        return sendError(
          res,
          ERROR_CODES.RATE_LIMITED,
          `Terlalu banyak permintaan pada kategori '${category}'.`,
          429,
          { retryAfter: check.retryAfterSeconds, category }
        );
      }

      next();
    } catch (error) {
      console.error('[security] Firestore protection failure:', error);
      return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Sistem proteksi sedang tidak tersedia.', 503);
    }
  };
}
