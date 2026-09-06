export type AnalyticsEventType =
  | 'app_view'
  | 'app_search'
  | 'search_result_click'
  | 'download_started'
  | 'download_completed'
  | 'download_failed'
  | 'official_link_click'
  | 'save_app'
  | 'unsave_app'
  | 'share_app'
  | 'rating_submitted'
  | 'review_submitted'
  | 'report_submitted'
  | 'screenshot_view'
  | 'version_view'
  | 'category_view'
  | 'collection_view'
  // Backward compatibility aliases
  | 'application_view'
  | 'official_download_click'
  | 'alternative_download_click'
  | 'application_search'
  | 'app_page_feedback'
  | string;

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
