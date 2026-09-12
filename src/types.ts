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
  publishStatus?: string;
  securityStatus?: string;
  moderationStatus?: string;
  modAvailability?: boolean;
  qualityScore?: number;
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
  tags?: string[];
  keywords?: string[];
  shortDescription?: string;
  trending?: boolean;
  isOfficialVerified?: boolean;
  securityScan?: { status: string; passed?: boolean; scannedAt?: string };
  badges?: string[];
  viewCount?: number;
  minAndroid?: string;
  isMod?: boolean;
  versions?: AppVersion[];
  requirements?: string;
  contentRating?: string;
  modFeatures?: string;
  contactEmail?: string;
}

export interface Review {
  id: string;
  appId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  deviceInfo?: string;
  helpfulCount: number;
  reported?: boolean;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  readTime: string;
  publishedAt: string;
  views: number;
  likes: number;
  featured?: boolean;
  relatedAppSlugs?: string[];
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

  status: 'draft' | 'published' | 'archived' | 'REVOKED' | 'ARCHIVED';

  downloadAllowed?: boolean;
  securityRevoked?: boolean;
  packageName?: string;

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

export type CSTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type CSConversationState = 
  | 'AI_CHAT'
  | 'REQUESTING_AGENT'
  | 'WAITING_QUEUE'
  | 'AGENT_ASSIGNED'
  | 'IN_AGENT_CHAT'
  | 'ENDING_CHAT'
  | 'ENDED'
  | 'CANCELLED';

export type CSActionType = 
  | 'OPEN_APP'
  | 'OPEN_GAME'
  | 'OPEN_HELP'
  | 'OPEN_FAQ'
  | 'OPEN_CUSTOMER_SERVICE'
  | 'OPEN_REPORT_HISTORY'
  | 'REQUEST_HUMAN_AGENT'
  | 'CANCEL_AGENT_REQUEST'
  | 'END_AGENT_CHAT';

export interface CSAction {
  type: CSActionType;
  targetId?: string;
  label: string;
}

export interface CSAttachment {
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface CSMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'bot' | 'ai' | 'system';
  senderName: string;
  message: string;
  actions?: CSAction[];
  attachments?: CSAttachment[];
  createdAt: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface CSTicket {
  id: string;
  ticketCode: string; // e.g. #CS-10824
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  category: string;
  subject: string;
  status: CSTicketStatus;
  state?: CSConversationState;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentEmail?: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  requestedAgentAt?: string;
  agentJoinedAt?: string;
  endedAt?: string;
  lastMessage: string;
  unreadByAdmin?: boolean;
  unreadByUser?: boolean;
  messages: CSMessage[];
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
  | 'firestore_sync'
  | 'notification_saved'
  | 'notification_sent'
  | 'notification_deleted'
  | 'banner_saved'
  | 'banner_deleted';

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  performedBy?: string;
  action: AdminAuditAction;
  entityType: 'application' | 'version' | 'review' | 'report' | 'category' | 'collection' | 'security' | 'system' | 'notification' | 'banner';
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
  storage?: {
    status: 'ok' | 'error';
    writable: boolean;
    uploadsDirExists: boolean;
  };
  queue?: {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    deadLetterJobs: number;
  };
  performance?: {
    totalRequests: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    errorRate: number;
    cacheHitRatio: number;
  };
  cache?: {
    size: number;
    enabled: boolean;
  };
  environment: string;
}

// ----------------------------------------------------
// STAGE 9.15: SEO, GROWTH & DISCOVERY OPTIMIZATION TYPES
// ----------------------------------------------------

export type SeoJobType = 
  | 'GENERATE_SITEMAP'
  | 'VALIDATE_SEO'
  | 'REFRESH_METADATA'
  | 'CHECK_INTERNAL_LINKS'
  | 'CHECK_STALE_PAGES'
  | 'REBUILD_COLLECTION_SEO';

export type SeoEntityType = 'APP' | 'VERSION' | 'CATEGORY' | 'COLLECTION' | 'SITEMAP' | 'SITE';

export interface SeoJob {
  jobId: string;
  jobType: SeoJobType;
  entityType: SeoEntityType;
  entityId?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';
  attempt: number;
  maxAttempts: number;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
  idempotencyKey: string;
}

export type SeoIssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SeoIssue {
  id: string;
  severity: SeoIssueSeverity;
  type: string;
  message: string;
  entityType: SeoEntityType;
  entityId?: string;
  url?: string;
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
}

export interface SeoHealthScore {
  overall: number; // 0 - 100
  technical: number;
  indexability: number;
  discovery: number;
  ratingLabel: 'Critical' | 'Needs Improvement' | 'Good' | 'Excellent';
  scannedAt: string;
}

export interface SeoReport {
  reportId: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';
  period: {
    start: string;
    end: string;
  };
  generatedAt: string;
  generatedBy: string;
  health: {
    overall: number;
    technical: number;
    indexability: number;
    discovery: number;
  };
  indexation: {
    indexable: number;
    indexed?: number;
    excluded: number;
  };
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  discovery: {
    organicSessions: number;
    organicUsers: number;
    organicViews: number;
    organicDownloads: number;
    downloadConversion: number;
  };
  worker: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    deadLetter: number;
    retryCount: number;
    averageProcessingMs: number;
  };
  performance: {
    pageP95Ms: number;
    metadataP95Ms: number;
    sitemapGenerationMs: number;
    cacheHitRate: number;
    errorRate: number;
  };
  opportunities: string[];
  recommendations: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
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

// ----------------------------------------------------
// TAHAP 9.1: CORE IDENTITY, ROLE & SUBSCRIPTION MODELS
// ----------------------------------------------------

export interface AeroUser {
  uid: string;
  id?: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  image?: string | null;
  name?: string | null;
  role?: string;
}

export type UserRole = 'user' | 'developer' | 'admin' | 'owner';
export type SubscriptionPlan = 'free' | 'premium';

export interface UserSubscription {
  status: SubscriptionPlan;
  planId?: 'monthly' | 'yearly' | 'lifetime';
  expiresAt?: string;
  activatedAt?: string;
  autoRenew?: boolean;
}

export interface DeveloperProfile {
  id: string;
  uid: string;
  devId: string;
  name: string;
  email: string;
  bio?: string;
  website?: string;
  verified: boolean;
  status: 'active' | 'pending' | 'rejected';
  appCount?: number;
  totalDownloads?: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface EventBannerItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  buttonText: string;
  destinationUrl: string;
  tag?: string;
  priority?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  content?: string;
  imageUrl?: string;
  image?: string;
  mediaType?: 'image' | 'gif' | 'video';
  mediaUrl?: string;
  thumbnailUrl?: string;
  appId?: string;
  startDate?: string;
  endDate?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  organizer?: string;
  category?: string;
  tag?: string;
  relatedAppSlugs?: string[];
  ctaLabel?: string;
  destinationType?: string;
  destination?: string;
  isActive?: boolean;
  priority?: number;
}

export type BannerDestinationType = 
  | 'internal' 
  | 'external' 
  | 'app' 
  | 'game' 
  | 'event' 
  | 'article' 
  | 'blog'
  | 'channel'
  | 'category';

export interface BannerItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageUrl?: string;
  mediaType?: 'image' | 'gif' | 'video';
  mediaUrl?: string;
  thumbnailUrl?: string;
  ctaLabel?: string;
  destinationType: BannerDestinationType;
  destination: string;
  isActive: boolean;
  order?: number;
  priority?: number;
  startAt?: string;
  endAt?: string;
  createdAt?: string;
  updatedAt?: string;
  tag?: string;
}

export interface BlogItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readTimeMinutes: number;
  tags: string[];
  isFeatured?: boolean;
}

// ----------------------------------------------------
// TAHAP 9.2: SEARCH INTELLIGENCE + DISCOVERY ENGINE
// ----------------------------------------------------

export type SearchIntentType = 
  | 'EXACT_APP' 
  | 'APP_DISCOVERY' 
  | 'GAME_DISCOVERY' 
  | 'CATEGORY' 
  | 'DEVELOPER' 
  | 'VERSION' 
  | 'GENERAL' 
  | 'NO_RESULT';

export type SearchTabType = 'all' | 'apps' | 'games' | 'developers' | 'categories';

export interface SearchFilterParams {
  type?: 'all' | 'apps' | 'games';
  category?: string;
  developer?: string;
  rating?: string; // 'all' | '4.0+' | '4.5+'
  minAndroid?: string;
  hasApk?: boolean;
  hasOfficialWebsite?: boolean;
  recentlyUpdated?: boolean;
  sort?: SortOption;
}

export interface ScoreBreakdown {
  textRelevance: number;
  quality: number;
  popularity: number;
  ctr: number;
  freshness: number;
  totalScore: number;
}

export interface RankedSearchResult {
  app: AppData;
  scoreBreakdown: ScoreBreakdown;
  matchedField: 'name' | 'alias' | 'prefix' | 'developer' | 'category' | 'description' | 'packageName' | 'fuzzy';
  highlightTerm?: string;
}

export interface SearchSuggestionGroup {
  apps: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    category: string;
    rating: number;
    developer: string;
    downloads?: number;
  }[];
  developers: string[];
  categories: string[];
  queries: string[];
  didYouMean: string | null;
}

export interface SearchPipelineResult {
  query: string;
  normalizedQuery: string;
  intent: SearchIntentType;
  tokens: string[];
  didYouMean: string | null;
  appliedFilters: SearchFilterParams;
  totalCandidates: number;
  results: RankedSearchResult[];
  suggestions: SearchSuggestionGroup;
  timingMs: number;
}

export type SearchAnalyticsEventType = 
  | 'SEARCH_STARTED'
  | 'SEARCH_SUBMITTED'
  | 'SEARCH_RESULT_SHOWN'
  | 'SEARCH_RESULT_CLICKED'
  | 'SEARCH_FILTER_USED'
  | 'SEARCH_SORT_USED'
  | 'SEARCH_NO_RESULT'
  | 'SEARCH_SUGGESTION_CLICKED'
  | 'SEARCH_RECENT_CLICKED'
  | 'SEARCH_POPULAR_CLICKED'
  | 'SEARCH_ABANDONED';

export interface SearchAnalyticsEvent {
  id?: string;
  userId?: string | null;
  sessionId: string;
  eventType: SearchAnalyticsEventType;
  query: string;
  normalizedQuery: string;
  intent?: SearchIntentType;
  resultCount: number;
  clickedResultId?: string | null;
  clickedResultSlug?: string | null;
  position?: number;
  filters?: Record<string, any>;
  sort?: string;
  timestamp: string;
}

export interface SearchAnalyticsAggregated {
  query: string;
  normalizedQuery: string;
  searchCount: number;
  clickCount: number;
  resultCount: number;
  noResultCount: number;
  ctr: number; // 0 - 100 percentage
  lastSearchedAt: string;
  growthRate: number; // % growth
  potentialCategory?: string;
  potentialSuggestion?: string;
  status?: 'active' | 'aliased' | 'ignored' | 'mapped';
}

export interface SearchAlias {
  id: string;
  alias: string;
  targetQuery: string;
  targetSlug?: string;
  createdBy?: string;
  createdAt: string;
}

export interface SearchQualityScore {
  overallScore: number; // 0 - 100
  relevanceScore: number;
  ctrScore: number;
  noResultRateScore: number;
  abandonmentScore: number;
  recommendations: string[];
}

// ----------------------------------------------------
// TAHAP 9.16: ADVANCED AI DISCOVERY INTELLIGENCE TYPES
// ----------------------------------------------------

export type DistributionType = 'AERO_HOSTED_APK' | 'EXTERNAL_LINK' | 'INFO_ONLY';

export type AiSearchIntentType = 
  | 'APP_LOOKUP'
  | 'CATEGORY_DISCOVERY'
  | 'RECOMMENDATION'
  | 'SIMILAR_APP'
  | 'VERSION_DISCOVERY'
  | 'USE_CASE_DISCOVERY'
  | 'GENERAL_DISCOVERY';

export interface SearchIntent {
  type: AiSearchIntentType;
  confidence: number; // 0.0 - 1.0
  entityName?: string;
  categoryName?: string;
  targetAppSlug?: string;
  useCaseKeywords?: string[];
  versionName?: string;
}

export interface DiscoveryConfidence {
  score: number; // 0.0 - 1.0
  level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AiFeatureFlagConfig {
  AI_DISCOVERY_ENABLED: boolean;
  AI_SEARCH_INTENT_ENABLED: boolean;
  AI_QUERY_EXPANSION_ENABLED: boolean;
  AI_SEMANTIC_MATCHING_ENABLED: boolean;
  AI_PERSONALIZATION_ENABLED: boolean;
  AI_RECOMMENDATION_ENABLED: boolean;
  AI_EXPERIMENTS_ENABLED: boolean;
  AI_AUTO_OPTIMIZATION_ENABLED: boolean;
}

export interface AIDiscoveryReport {
  reportId: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';
  period: {
    start: string;
    end: string;
  };
  generatedAt: string;
  algorithmVersion: string;
  modelVersion: string;
  health: {
    overall: number;
    search: number;
    recommendation: number;
    semantic: number;
    personalization: number;
  };
  search: {
    totalQueries: number;
    uniqueQueries: number;
    zeroResultQueries: number;
    reformulationRate: number;
  };
  recommendation: {
    impressions: number;
    ctr: number;
    conversion: number;
    coverage: number;
    diversity: number;
    novelty: number;
  };
  ai: {
    requests: number;
    success: number;
    failures: number;
    timeout: number;
    fallback: number;
    averageLatencyMs: number;
    cacheHitRate: number;
    averageConfidence: number;
  };
  worker: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    deadLetter: number;
    retries: number;
  };
  performance: {
    p95Ms: number;
    errorRate: number;
  };
  opportunities: string[];
  recommendations: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

// ----------------------------------------------------
// TAHAP 9.9: SMART COLLECTIONS & INTELLIGENT APP SHELVES
// ----------------------------------------------------
export * from './features/smartCollections/types/smartCollections';

// ----------------------------------------------------
// TAHAP 9.10: ADMIN INTELLIGENCE & OBSERVABILITY LAYER
// ----------------------------------------------------
export * from './types/intelligence';

