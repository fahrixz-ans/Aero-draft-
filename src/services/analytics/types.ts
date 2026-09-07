export type AnalyticsEventType =
  | 'app_view'
  | 'app_save'
  | 'app_unsave'
  | 'app_share'
  | 'app_download'
  | 'official_website_click'
  | 'search'
  | 'search_result_impression'
  | 'search_result_click'
  | 'recommendation_impression'
  | 'recommendation_click'
  | 'category_view'
  | 'collection_view'
  | 'notification_view'
  | 'notification_click'
  // Legacy compatibility aliases
  | 'application_view'
  | 'download_started'
  | 'download_completed'
  | 'download_failed'
  | 'official_link_click'
  | 'official_download_click'
  | 'alternative_download_click'
  | 'application_search'
  | 'app_page_feedback'
  | string;

export interface AeroAnalyticsEvent {
  eventId: string;
  schemaVersion: number;
  eventType: AnalyticsEventType;
  timestamp: any;
  userId?: string;
  sessionId?: string;
  appId?: string;
  categoryId?: string;
  query?: string;
  source?: string;
  surface?: string;
  position?: number;
  recommendationId?: string;
  rankingSnapshotId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

// Backward compatibility alias
export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  appId?: string;
  versionId?: string;
  categoryId?: string;
  sessionId?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AppAnalyticsSummary {
  appId: string;
  views: number;
  downloadStarts: number;
  downloadCompletions: number;
  downloadErrors: number;
  officialClicks: number;
  saves: number;
  unsaves: number;
  shares: number;
  ratingsCount: number;
  reviewsCount: number;
  reportsCount: number;
  searchAppearances: number;
  searchClicks: number;
  recommendationImpressions?: number;
  recommendationClicks?: number;
  lastUpdated: string;
}

export interface SearchQueryEvent {
  id: string;
  query: string;
  normalizedQuery: string;
  resultCount: number;
  sessionId: string;
  userId?: string;
  clickedAppId?: string;
  timestamp: string;
}

export interface CategoryAnalyticsSummary {
  category: string;
  views: number;
  downloads: number;
  officialClicks: number;
  searches: number;
  appCount: number;
  growthRate: number; // percentage
}

export interface DiscoveryFunnelMetrics {
  impressions: number;
  views: number;
  actions: number;
  conversions: number;
  viewRate: number; // views / impressions
  actionRate: number; // actions / views
  conversionRate: number; // conversions / views
}

export interface AnalyticsOverviewMetrics {
  totalViews: number;
  uniqueSessions: number;
  totalDownloads: number;
  totalSearches: number;
  searchCtr: number;
  recommendationCtr: number;
  activeUsers: number;
}
