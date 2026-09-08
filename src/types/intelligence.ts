// ---------------------------------------------------------------------------
// AERO STAGE 9.10 — INTELLIGENCE, OBSERVABILITY & CANONICAL DATA CONTRACTS
// ---------------------------------------------------------------------------

import { AppData, AppStatus } from '../types';

export type SecurityStatus = 
  | 'PENDING' 
  | 'SCANNING' 
  | 'VERIFIED' 
  | 'WARNING' 
  | 'FAILED' 
  | 'QUARANTINED' 
  | 'REVOKED'
  | 'passed'
  | 'warning'
  | 'rejected';

export type ModerationStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUIRED'
  | 'ARCHIVED'
  | 'REVOKED'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_review';

export type DistributionType = 'OFFICIAL_LINK' | 'DIRECT_APK' | 'HYBRID';

export interface AppBadge {
  id: string;
  label: string;
  variant: 'default' | 'verified' | 'featured' | 'trending' | 'security' | 'warning';
  icon?: string;
}

// ---------------------------------------------------------------------------
// 1. CANONICAL APP ITEM CONTRACT (Section 38)
// Single unified interface for discovery and intelligence
// ---------------------------------------------------------------------------
export interface AppItem {
  id: string;
  slug: string;
  name: string;

  developerId?: string;
  developerName: string;

  iconUrl: string;
  shortDescription?: string;

  primaryCategory: string;
  secondaryCategories?: string[];

  rating?: number;
  ratingCount?: number;

  totalDownloads?: number;

  latestVersion?: string;
  latestVersionCode?: number;

  sizeBytes?: number;

  minSdk?: number;
  targetSdk?: number;

  architectures?: string[];

  updatedAt?: string;
  publishedAt?: string;

  appStatus: AppStatus;
  securityStatus: SecurityStatus;
  moderationStatus: ModerationStatus;
  distributionType: DistributionType;

  officialWebsiteUrl?: string;
  screenshotUrls?: string[];
  badges?: (AppBadge | string)[];

  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;

  rankingScore?: number;
  recommendationScore?: number;

  createdAt: string;
}

/**
 * Maps legacy AppData to the Canonical AppItem contract
 */
export function mapAppToAppItem(app: AppData): AppItem {
  const bytes = app.apkSize || (app.size ? parseSizeStringToBytes(app.size) : 0);
  const rawStatus = (app.status || 'published') as AppStatus;
  const rawSecStatus = ((app.securityStatus || (app.securityScan?.passed ? 'VERIFIED' : 'PENDING')) as SecurityStatus);
  const rawModStatus = ((app.moderationStatus || 'APPROVED') as ModerationStatus);
  const distType: DistributionType = app.apkFileUrl ? 'DIRECT_APK' : (app.officialUrl ? 'OFFICIAL_LINK' : 'HYBRID');

  return {
    id: app.id,
    slug: app.slug || app.id,
    name: app.name,
    developerId: (app as any).developerId,
    developerName: app.developerName || app.developer || 'Pengembang Terverifikasi',
    iconUrl: app.iconUrl || app.icon || '/favicon.svg',
    shortDescription: app.shortDescription || app.description?.slice(0, 140) || '',
    primaryCategory: app.category || 'Alat & Utilitas',
    secondaryCategories: app.tags || [],
    rating: app.ratingAverage || app.rating || 4.5,
    ratingCount: app.ratingCount || 100,
    totalDownloads: app.downloads || 0,
    latestVersion: app.versionName || app.version || '1.0.0',
    latestVersionCode: app.versionCode || 1,
    sizeBytes: bytes,
    minSdk: app.minSdk || 24,
    targetSdk: app.targetSdk || 34,
    architectures: app.architectures || ['arm64-v8a', 'armeabi-v7a'],
    updatedAt: app.updatedAt || new Date().toISOString(),
    publishedAt: app.publishAt || app.createdAt || new Date().toISOString(),
    appStatus: rawStatus,
    securityStatus: rawSecStatus,
    moderationStatus: rawModStatus,
    distributionType: distType,
    officialWebsiteUrl: app.officialUrl || app.officialDownloadUrl,
    screenshotUrls: app.screenshots || [],
    badges: app.badges || [],
    isFeatured: !!app.featured,
    isTrending: !!(app.trending || (app.trendingScore && app.trendingScore > 60)),
    isNew: !!(app.releaseDate && isDateWithinDays(app.releaseDate, 30)),
    rankingScore: app.trendingScore || 85,
    recommendationScore: app.qualityScore || 90,
    createdAt: app.createdAt || new Date().toISOString()
  };
}

function parseSizeStringToBytes(sizeStr: string): number {
  if (!sizeStr) return 0;
  const clean = sizeStr.trim().toUpperCase();
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  if (clean.endsWith('GB')) return Math.round(num * 1024 * 1024 * 1024);
  if (clean.endsWith('MB')) return Math.round(num * 1024 * 1024);
  if (clean.endsWith('KB')) return Math.round(num * 1024);
  return Math.round(num);
}

function isDateWithinDays(dateStr: string, days: number): boolean {
  try {
    const t = new Date(dateStr).getTime();
    if (isNaN(t)) return false;
    return (Date.now() - t) <= (days * 24 * 60 * 60 * 1000);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 2. DATA FRESHNESS & DATA QUALITY CONTRACTS (Sections 11 & 13)
// ---------------------------------------------------------------------------
export type DataFreshnessStatus = 'FRESH' | 'STALE' | 'DELAYED' | 'UNAVAILABLE';

export interface DataFreshness {
  status: DataFreshnessStatus;
  generatedAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  delaySeconds?: number;
}

export type DataQualityStatus = 'HEALTHY' | 'WARNING' | 'ERROR';

export interface IntelligenceDataQuality {
  metric: string;
  status: DataQualityStatus;
  invalidCount: number;
  duplicateCount: number;
  missingCount: number;
  checkedAt: string;
}

// ---------------------------------------------------------------------------
// 3. ACTION CENTER CONTRACT (Section 31)
// ---------------------------------------------------------------------------
export type IntelligenceActionType =
  | 'SECURITY_SCAN_PENDING'
  | 'MODERATION_QUEUE'
  | 'OWNERSHIP_REVIEW'
  | 'UPLOAD_FAILURE'
  | 'ZERO_RESULT_SEARCH'
  | 'HIGH_ERROR_RATE'
  | 'REVOKED_VERSION_CLEANUP'
  | 'STALE_CACHE_REGENERATE';

export type ActionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface IntelligenceAction {
  id: string;
  type: IntelligenceActionType;
  title: string;
  description: string;
  severity: ActionSeverity;
  entityType: string;
  entityId: string;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
  resolutionNote?: string;
}

// ---------------------------------------------------------------------------
// 4. ANOMALY DETECTION CONTRACT (Section 33)
// ---------------------------------------------------------------------------
export type IntelligenceAnomalyType =
  | 'DOWNLOAD_SPIKE'
  | 'DOWNLOAD_DROP'
  | 'DOWNLOAD_ERROR_SPIKE'
  | 'SEARCH_SPAM'
  | 'SEARCH_ZERO_RESULTS_SURGE'
  | 'RECOMMENDATION_CTR_DROP'
  | 'VIRUSTOTAL_FAILURE_SURGE'
  | 'UPLOAD_PROCESSING_DELAY';

export type AnomalyEntityType =
  | 'APP'
  | 'VERSION'
  | 'DEVELOPER'
  | 'SEARCH'
  | 'DOWNLOAD'
  | 'SECURITY';

export interface IntelligenceAnomaly {
  id: string;
  type: IntelligenceAnomalyType;
  severity: ActionSeverity;
  entityType: AnomalyEntityType;
  entityId: string;
  metric: string;
  currentValue: number;
  baselineValue: number;
  threshold: number;
  detectedAt: string;
  status: ActionStatus;
  explanation?: string;
}

// ---------------------------------------------------------------------------
// 5. AUDIT TRAIL CONTRACT (Section 35)
// ---------------------------------------------------------------------------
export interface IntelligenceAuditEntry {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
  requestId: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 6. ANALYTICS AGGREGATE CONTRACT (Section 48)
// ---------------------------------------------------------------------------
export type AggregatePeriod = '1H' | '24H' | '7D' | '30D';
export type AggregateEntityType = 'APP' | 'DEVELOPER' | 'SEARCH' | 'RECOMMENDATION' | 'VERSION';

export interface AnalyticsAggregate {
  id: string;
  entityType: AggregateEntityType;
  entityId: string;
  period: AggregatePeriod;
  views: number;
  searches: number;
  clicks: number;
  downloads: number;
  ctr: number;
  conversionRate: number;
  trendScore?: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 7. FUNNEL CONTRACTS (Sections 18 & 20)
// ---------------------------------------------------------------------------
export interface DiscoveryFunnelStep {
  step: 'impression' | 'app_view' | 'download_attempt' | 'download_authorized' | 'download_started' | 'download_completed';
  label: string;
  count: number;
  conversionFromPrevious: number; // percentage (0-100)
  dropoffPercentage: number;
}

export interface DiscoveryFunnelData {
  steps: DiscoveryFunnelStep[];
  overallConversionRate: number; // impression -> download_completed
  period: string;
}

export interface SearchFunnelStep {
  step: 'search' | 'result_impression' | 'result_click' | 'app_view' | 'download';
  label: string;
  count: number;
  conversionFromPrevious: number;
  dropoffPercentage: number;
}

export interface SearchFunnelData {
  steps: SearchFunnelStep[];
  overallConversionRate: number;
  zeroResultRate: number;
  period: string;
}

// ---------------------------------------------------------------------------
// 8. SECTION-BY-SECTION INTELLIGENCE DATA CONTRACTS
// ---------------------------------------------------------------------------

export interface IntelligenceOverviewMetrics {
  totalApps: number;
  publishedApps: number;
  pendingApps: number;
  archivedApps: number;
  revokedVersions: number;
  totalDevelopers: number;
  activeDevelopers: number;
  totalDownloads: number;
  downloadsToday: number;
  downloads7Days: number;
  downloads30Days: number;
  totalViews: number;
  searchCount: number;
  recommendationImpressions: number;
  recommendationCtr: number;
  downloadConversion: number;
  trends: {
    downloadsChangePercentage: number;
    viewsChangePercentage: number;
    searchesChangePercentage: number;
    conversionChangePercentage: number;
  };
}

export interface AppPerformanceIndices {
  discovery: number; // 0-100
  engagement: number; // 0-100
  conversion: number; // 0-100
  growth: number; // 0-100
  reliability: number; // 0-100
}

export interface AppIntelligenceSummary {
  appId: string;
  name: string;
  slug: string;
  developerName: string;
  iconUrl: string;
  category: string;
  views: number;
  uniqueViews: number;
  searchImpressions: number;
  searchClicks: number;
  recommendationImpressions: number;
  recommendationClicks: number;
  downloads: number;
  uniqueDownloaders: number;
  conversion: number;
  rating: number;
  ratingCount: number;
  rankingScore: number;
  trendingScore: number;
  securityStatus: SecurityStatus;
  latestVersion: string;
  performanceIndices: AppPerformanceIndices;
  publicationStatus: AppStatus;
}

export interface DeveloperIntelligenceSummary {
  developerId: string;
  developerName: string;
  email?: string;
  totalApps: number;
  publishedApps: number;
  pendingApps: number;
  rejectedApps: number;
  totalDownloads: number;
  totalViews: number;
  uploadSuccessRate: number;
  securityIncidentCount: number;
  avgProcessingDurationSeconds: number;
  activeStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface SearchQueryInsight {
  query: string;
  count: number;
  impressions: number;
  clicks: number;
  ctr: number;
  appViews: number;
  downloads: number;
  conversionRate: number;
  growthRate: number;
  zeroResults: boolean;
  categoryAffinity?: string;
  suggestedAction?: string;
}

export interface RecommendationShelfInsight {
  shelfId: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number;
  downloads: number;
  conversionRate: number;
  coldStartRatio: number;
  health: 'OPTIMAL' | 'ACCEPTABLE' | 'LOW_PERFORMING';
}

export interface RankingMovementSignal {
  appId: string;
  appName: string;
  iconUrl: string;
  category: string;
  currentRank: number;
  previousRank: number;
  movementValue: number; // positive for up, negative for down
  movementLabel: string; // "↑ 8", "↓ 2", "—", "NEW"
  score: number;
  signals: {
    downloadGrowth: string;
    viewVelocity: string;
    searchInterest: string;
    freshness: string;
    securityPassed: boolean;
  };
}

export interface DownloadDiagnosticBreakdown {
  attempts: number;
  authorized: number;
  started: number;
  completed: number;
  denied: number;
  failed: number;
  uniqueDownloaders: number;
  completionRate: number;
  failureRate: number;
  deniedRate: number;
  averageSpeedMBps?: number;
}

export interface SecurityIncident {
  id: string;
  versionId?: string;
  appId?: string;
  appName?: string;
  version?: string;
  threatSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO';
  threatType?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO';
  findingsCount?: number;
  scannedAt?: string;
  detectedAt?: string;
  type?: string;
  description?: string;
  status?: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'DISMISSED';
  evidence?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecurityScanInsight {
  totalScanned: number;
  verifiedCount: number;
  warningCount: number;
  quarantinedCount: number;
  revokedCount: number;
  pendingScans: number;
  virusTotalHealth: 'HEALTHY' | 'RATE_LIMITED' | 'UNAVAILABLE';
  recentIncidents: SecurityIncident[];
  overview?: {
    totalEvents: number;
    blockedCount: number;
    rateLimitEvents: number;
    botCount: number;
    openIncidents: number;
    flaggedEntitiesCount: number;
  };
  abuseScores?: {
    entityType: string;
    entityId: string;
    score: number;
    level: string;
    reasons: string[];
    updatedAt: string;
  }[];
  securityEvents?: {
    id: string;
    type: string;
    severity: string;
    actorId?: string;
    ipHash?: string;
    endpoint?: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }[];
}

export interface VersionIntelligenceItem {
  versionId: string;
  appId: string;
  appName: string;
  versionName: string;
  versionCode: number;
  status: 'PUBLISHED' | 'ARCHIVED' | 'REVOKED' | 'DRAFT';
  securityStatus: SecurityStatus;
  downloads: number;
  views: number;
  sizeBytes: number;
  releaseDate: string;
}

export interface OperationalHealthIndicator {
  name: string;
  status: 'HEALTHY' | 'DELAYED' | 'DEGRADED' | 'DOWN';
  latencyMs?: number;
  errorRatePercent?: number;
  details?: string;
  updatedAt: string;
}

export interface EmergencyControlsState {
  disableRecommendations: boolean;
  disableDeveloperUpload: boolean;
  disableAnalyticsAggregation: boolean;
  emergencyMaintenanceMode: boolean;
  updatedAt: string;
  updatedBy?: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// 9. API RESPONSE CONTRACT (Section 50 & 52)
// ---------------------------------------------------------------------------
export type IntelligenceErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_QUERY'
  | 'INVALID_DATE_RANGE'
  | 'INVALID_ENTITY'
  | 'RATE_LIMITED'
  | 'FIRESTORE_ERROR'
  | 'ANALYTICS_UNAVAILABLE'
  | 'AGGREGATE_UNAVAILABLE'
  | 'DATA_STALE'
  | 'SECURITY_BLOCKED'
  | 'INTERNAL_ERROR';

export interface IntelligenceApiError {
  code: IntelligenceErrorCode;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface IntelligenceApiResponse<T> {
  success: boolean;
  data?: T;
  error?: IntelligenceApiError;
  meta: {
    requestId: string;
    timestamp?: string;
    freshness?: DataFreshness;
  };
}
