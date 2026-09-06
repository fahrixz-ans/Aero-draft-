export type AppStatus = 'draft' | 'published' | 'scheduled' | 'archived';
export type PublishMode = 'immediate' | 'scheduled';
export type AppSourceType = 'official_link' | 'apk';

export interface AppData {
  id: string;
  name: string;
  slug: string;

  // New fields as required by developer guidelines
  developerName?: string;
  iconUrl?: string;
  bannerUrl?: string;
  sourceType?: AppSourceType;
  officialUrl?: string;
  apkFileUrl?: string;
  packageName?: string;
  versionName?: string;
  versionCode?: number;
  apkSize?: number;
  sha256?: string;
  architectures?: string[];

  // Keep existing fields for full backward compatibility
  developer: string;
  icon: string;
  screenshots: string[];
  description: string;
  category: string;
  categoryId?: string;
  version: string;
  size: string;
  androidVersion: string;
  rating: number;
  downloads: number;
  releaseDate: string;
  updatedAt: string;
  createdAt?: string;
  downloadUrl: string;
  officialDownloadUrl?: string; // made optional for initial fallback compatibility
  alternativeDownloadUrl?: string;
  featured: boolean;
  popular: boolean;
  whatsNew?: string;
  permissions?: string[];
  minSdk?: number | null;
  targetSdk?: number | null;
  signingCertificate?: {
    sha256: string | null;
    sha1: string | null;
    issuer: string | null;
    subject: string | null;
  } | null;
  status?: AppStatus; // Visibility
  publishMode?: PublishMode;
  publishAt?: string | null; // ISO Date String or null
  verifiedSource?: boolean;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  analytics?: {
    views: number;
    officialClicks: number;
    alternativeClicks: number;
    searchFrequency: number;
    recentGrowth?: number;
    lastInteractionAt?: string;
    downloadsStarted?: number;
    downloadsCompleted?: number;
    downloadErrors?: number;
    saves?: number;
    shares?: number;
  };
  trendingScore?: number;
  recentGrowth?: number;

  // Tahap 4: Real Rating & Review Aggregates
  ratingAverage?: number;
  ratingCount?: number;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  healthStatus?: 'healthy' | 'warning' | 'problem';
  verifiedBadge?: boolean;
}

export interface ImportJob {
  id: string;
  adminId: string;
  adminEmail: string;
  fileName: string;
  totalItems: number;
  importedItems: number;
  skippedItems: number;
  failedItems: number;
  errors?: string[];
  createdAt: string;
}

export type AnalyticsEventType = 
  | 'application_view' 
  | 'official_download_click' 
  | 'alternative_download_click' 
  | 'application_search'
  | 'app_page_feedback'
  | string;

export interface AnalyticsEvent {
  id?: string;
  type: AnalyticsEventType;
  applicationId?: string | null;
  searchQuery?: string | null;
  sessionId?: string | null;
  createdAt?: string;
}

export interface AppBadgeInfo {
  type: 'new' | 'updated' | 'popular' | 'featured' | 'verified';
  label: string;
  description?: string;
  colorClass: string;
  styleClasses?: string;
}

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}

export type SortOption = 'latest' | 'updated' | 'popular' | 'rating' | 'a-z' | 'z-a' | 'trending';

export interface FilterState {
  category: string;
  developer?: string;
  rating: string;
  version: string;
  recentlyUpdated: boolean;
  size: string; // "small" | "medium" | "large" | ""
  minAndroid: string; // "4.1+" | "5.0+" | "6.0+" | ""
  updatedDateRange: string; // "7-days" | "30-days" | "90-days" | ""
  sort?: SortOption;
}

export type SecurityStatus = 'pending' | 'passed' | 'warning' | 'rejected';

export interface AppVersion {
  id: string;
  appId: string;

  versionName: string;
  versionCode: number;

  apkFileUrl: string;
  storageKey: string;

  fileSize: number;

  minSdk?: number;
  targetSdk?: number;

  architectures?: string[];

  permissions?: string[];

  sha256: string;

  certificateSha256?: string;

  changelog?: string;

  securityStatus: SecurityStatus;

  status: 'draft' | 'published' | 'archived';

  createdAt: string; // To keep consistent with Firestore/JSON date strings
  updatedAt: string; // To keep consistent with Firestore/JSON date strings
}

// ----------------------------------------------------
// TAHAP 4: COMMUNITY, TRUST, RATINGS, REVIEWS & REPORTS
// ----------------------------------------------------

export type ReportType = 
  | 'download_problem'
  | 'invalid_file'
  | 'incorrect_information'
  | 'incorrect_screenshot'
  | 'broken_official_link'
  | 'unavailable_app'
  | 'other';

export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AppReport {
  id: string;
  appId: string;
  appName?: string;
  appSlug?: string;
  versionId?: string;
  versionName?: string;
  type: ReportType;
  reason?: string;
  description?: string;
  status: ReportStatus;
  priority: ReportPriority;
  userId?: string;
  userEmail?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppRating {
  id: string;
  userId: string;
  userEmail?: string;
  userDisplayName?: string;
  userPhotoUrl?: string;
  appId: string;
  rating: number; // 1 to 5
  createdAt: string;
  updatedAt: string;
}

export interface AppReview {
  id: string;
  appId: string;
  appName?: string;
  appSlug?: string;
  userId: string;
  userEmail?: string;
  userDisplayName: string;
  userPhotoUrl?: string;
  rating: number; // 1 to 5
  reviewText: string;
  status: 'published' | 'hidden' | 'deleted';
  reportedCount?: number;
  reportReasons?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ReviewReportReason = 'spam' | 'irrelevant' | 'misleading' | 'rule_violation' | 'other';

export interface ReviewReport {
  id: string;
  reviewId: string;
  appId: string;
  appName?: string;
  reason: ReviewReportReason;
  reasonLabel: string;
  reportedByUserId?: string;
  reportedByUserEmail?: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export type VersionFeedbackChoice = 'good' | 'neutral' | 'bad';

export interface VersionFeedback {
  id: string;
  appId: string;
  versionId: string;
  versionName?: string;
  userId: string;
  userEmail?: string;
  feedback: VersionFeedbackChoice;
  createdAt: string;
}

export type NotificationType = 'app_updated' | 'report_resolved' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  appId?: string;
  appSlug?: string;
  appName?: string;
  versionId?: string;
  versionName?: string;
  read: boolean;
  createdAt: string;
}

// ----------------------------------------------------
// TAHAP 6: PRODUCTION HARDENING, AUDIT LOGS, WORKER & HEALTH
// ----------------------------------------------------

export type AdminAuditAction =
  | 'app_created'
  | 'app_published'
  | 'app_archived'
  | 'app_updated'
  | 'app_deleted'
  | 'version_published'
  | 'version_archived'
  | 'apk_uploaded'
  | 'apk_deleted'
  | 'review_hidden'
  | 'review_restored'
  | 'report_investigating'
  | 'report_resolved'
  | 'report_dismissed'
  | 'category_created'
  | 'category_updated'
  | 'collection_updated'
  | 'admin_setting_changed'
  | 'security_alert_resolved'
  | 'firestore_sync';

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  performedBy?: string;
  action: AdminAuditAction;
  entityType: 'application' | 'version' | 'review' | 'report' | 'category' | 'collection' | 'security' | 'system';
  entityId: string;
  entityName?: string;
  details?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export type JobQueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';

export interface WorkerQueueJob {
  id: string;
  type: 'apk_analysis' | 'image_processing' | 'security_scan' | 'analytics_aggregation' | 'storage_cleanup' | 'ranking_calculation';
  status: JobQueueStatus;
  payload: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface StorageAuditReport {
  scannedAt: string;
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  activeApkFiles: number;
  activeImageFiles: number;
  orphanedFiles: {
    filename: string;
    path: string;
    sizeBytes: number;
    sizeFormatted: string;
    type: 'apk' | 'image';
    createdAt: string;
  }[];
  integrityStatus: 'healthy' | 'warning' | 'orphans_detected';
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  storage: {
    status: 'ok' | 'error';
    writable: boolean;
    uploadsDirExists: boolean;
  };
  queue: {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    deadLetterJobs: number;
  };
  environment: string;
}

// ----------------------------------------------------
// TAHAP 7: ADMIN CONTROL CENTER, CMS, RBAC & SETTINGS
// ----------------------------------------------------

export interface AppCollection {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  appIds: string[];
  sortOrder: number;
  isPublished: boolean;
  type: 'manual' | 'automatic' | 'hybrid';
  filterCriteria?: {
    category?: string;
    minRating?: number;
    featuredOnly?: boolean;
    limit?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AppRevision {
  id: string;
  appId: string;
  appName: string;
  editorId: string;
  editorEmail: string;
  changedFields: string[];
  previousData: Partial<AppData>;
  newData: Partial<AppData>;
  reason?: string;
  createdAt: string;
}

export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    defaultLanguage: string;
    maintenanceMode: boolean;
  };
  downloads: {
    rateLimitPerMinute: number;
    requireCaptchaOnSpam: boolean;
    directDownloadEnabled: boolean;
    resumableRangeEnabled: boolean;
  };
  trending: {
    weights: {
      downloads: number;      // e.g. 35
      views: number;          // e.g. 20
      searches: number;       // e.g. 15
      growth: number;         // e.g. 15
      saves: number;          // e.g. 10
      freshness: number;      // e.g. 5
    };
    decayHours: number;
  };
  search: {
    fuzzyMatching: boolean;
    maxResults: number;
    logZeroResultQueries: boolean;
  };
  moderation: {
    autoFlagThreshold: number;
    notifyAdminsOnCriticalReport: boolean;
    requireRejectionReason: boolean;
  };
  storage: {
    maxApkSizeMB: number;
    maxImageSizeMB: number;
    autoCleanOrphanFiles: boolean;
  };
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'content_manager' | 'analyst';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface SearchQueryStat {
  query: string;
  count: number;
  zeroResults: boolean;
  resultsCount: number;
  ctr: number;
  lastSearchedAt: string;
}

export interface ReconciliationReport {
  timestamp: string;
  totalAppsInDb: number;
  totalApkFilesOnDisk: number;
  totalImageFilesOnDisk: number;
  missingApkCount: number;
  missingImageCount: number;
  orphanApkCount: number;
  orphanImageCount: number;
  brokenOfficialLinksCount: number;
  searchIndexStatus: 'synchronized' | 'out_of_sync' | 'indexing';
  details: {
    missingApkAppIds: string[];
    missingImageAppIds: string[];
    orphanFiles: string[];
    brokenLinks: { appId: string; appName: string; url: string; status: number }[];
  };
}

export interface HomepageCMSConfig {
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    showBanner: boolean;
  };
  sections: {
    id: string;
    title: string;
    type: 'trending' | 'new_releases' | 'recently_updated' | 'categories' | 'editor_picks' | 'collections';
    enabled: boolean;
    sortOrder: number;
    itemLimit: number;
  }[];
}

// ----------------------------------------------------
// TAHAP 8: USER EXPERIENCE, PERSONALIZATION, ACCOUNT & COMMUNITY
// ----------------------------------------------------

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'id' | 'en';
  notifications: {
    appUpdates: boolean;
    newApps: boolean;
    recommendations: boolean;
    collections: boolean;
    systemAlerts: boolean;
    frequency: 'instant' | 'daily_digest' | 'off';
    pushEnabled: boolean;
  };
  contentPreferences: string[]; // List of favorite category names
  privacy: {
    personalizedRecommendations: boolean;
    analyticsPersonalization: boolean;
    searchHistory: boolean;
    downloadHistory: boolean;
  };
  updatedAt: string;
}

export interface SavedAppEntry {
  appId: string;
  appName: string;
  savedVersion?: string;
  savedAt: string;
}

export interface FollowedAppEntry {
  appId: string;
  appName: string;
  followedVersion?: string;
  followedAt: string;
}

export interface FollowedCategoryEntry {
  categoryId: string;
  categoryName: string;
  followedAt: string;
}

export interface DownloadHistoryRecord {
  id: string;
  appId: string;
  appName: string;
  appSlug: string;
  iconUrl?: string;
  version: string;
  downloadedAt: string;
  type: 'apk' | 'official_link';
  status: 'started' | 'completed' | 'failed';
  fileSize?: string;
}

export interface SearchHistoryRecord {
  query: string;
  searchedAt: string;
}

export interface RecentlyViewedRecord {
  appId: string;
  appName: string;
  appSlug: string;
  iconUrl?: string;
  category: string;
  developer: string;
  rating: number;
  viewedAt: string;
}

export type NotificationCategory = 'app_update' | 'new_app' | 'collection' | 'system' | 'account';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationCategory;
  title: string;
  message: string;
  targetType?: 'app' | 'category' | 'collection' | 'report' | 'review' | 'system';
  targetId?: string;
  targetSlug?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AppComparisonData {
  app: AppData;
  features: string[];
}

// Backward-compatible type aliases
export type DownloadHistoryItem = DownloadHistoryRecord;
export type RecentlyViewedItem = RecentlyViewedRecord;
export type ReportIssue = AppReport;




