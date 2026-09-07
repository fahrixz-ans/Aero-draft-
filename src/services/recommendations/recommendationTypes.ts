import { AppData } from '../../types';

export type RecommendationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type RecommendationFallbackLevel = 
  | 'PERSONALIZED'
  | 'CONTENT_SIMILARITY'
  | 'TRENDING'
  | 'POPULAR'
  | 'NEW_AND_RISING'
  | 'EDITOR_PICKS'
  | 'GENERAL_CATALOG';

export interface RecommendationScoreBreakdown {
  similarityScore: number; // 0 - 100
  interestScore: number;    // 0 - 100
  popularityScore: number;  // 0 - 100
  freshnessScore: number;   // 0 - 100
  qualityScore: number;     // 0 - 100
  trendingScore: number;    // 0 - 100
  finalScore: number;       // 0 - 100
  confidence: RecommendationConfidence;
  fallbackLevel?: RecommendationFallbackLevel;
  primaryReason: string;
  matchingFactors: string[];
}

export interface ScoredApp {
  app: AppData;
  score: RecommendationScoreBreakdown;
  shelfId?: string;
  position?: number;
}

export interface ShelfConfig {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  limit: number;
  showExplanationBadge: boolean;
  allowDismiss: boolean;
}

export type RecommendationShelfConfig = ShelfConfig;

export interface RecommendationFactorWeights {
  similarity: number; // default: 0.25
  interest: number;   // default: 0.30
  popularity: number; // default: 0.15
  freshness: number;  // default: 0.10
  quality: number;    // default: 0.10
  trending: number;   // default: 0.10
}

export interface BehaviorSignalWeights {
  view: number;              // default: 1.0
  search: number;            // default: 2.0
  officialClick: number;     // default: 3.0
  save: number;              // default: 4.0
  share: number;             // default: 4.0
  download: number;          // default: 5.0
  feedbackPositive: number;  // default: 3.0
  feedbackNegative: number;  // default: -5.0
}

export interface DiversityRatio {
  primary: number;   // percentage (e.g. 70%)
  adjacent: number;  // percentage (e.g. 20%)
  discovery: number; // percentage (e.g. 10%)
}

export interface RecommendationConfig {
  factors: RecommendationFactorWeights;
  behaviorWeights: BehaviorSignalWeights;
  timeDecayHalfLifeDays: number; // default: 14 days
  diversity: DiversityRatio;
  minimumConfidenceThreshold: number; // default: 15
  excludedAppIds: string[];
  pinnedAppIds: Record<string, string[]>; // shelfId -> appId[]
  shelves: {
    forYou: ShelfConfig;
    youMightLike: ShelfConfig;
    similarApps: ShelfConfig;
    newAndRising: ShelfConfig;
    trending: ShelfConfig;
    editorPicks: ShelfConfig;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export type UserInteractionType = 
  | 'view'
  | 'search'
  | 'save'
  | 'unsave'
  | 'share'
  | 'download'
  | 'official_click'
  | 'feedback_positive'
  | 'feedback_negative';

export interface UserInteractionEvent {
  id: string;
  type: UserInteractionType;
  appId?: string;
  category?: string;
  tags?: string[];
  query?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UserInterestProfile {
  userId: string;
  isAnonymous: boolean;
  categoryAffinities: Record<string, number>; // categoryName -> decayed weighted score
  tagAffinities: Record<string, number>;      // tag -> decayed weighted score
  recentInteractions: UserInteractionEvent[];
  dislikedAppIds: string[];
  preferredCategories: string[];
  totalInteractionCount: number;
  lastUpdated: number;
}

export type RecommendationAnalyticsEventType = 
  | 'impression'
  | 'click'
  | 'convert_save'
  | 'convert_download'
  | 'convert_official_click'
  | 'dismiss';

export interface RecommendationAnalyticsEvent {
  id: string;
  eventType: RecommendationAnalyticsEventType;
  shelfId: string;
  appId: string;
  userId?: string;
  score?: number;
  position: number;
  fallbackLevel?: RecommendationFallbackLevel;
  timestamp: number;
}

export interface ShelfPerformanceMetric {
  shelfId: string;
  shelfTitle: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

export interface AppRecommendationMetric {
  appId: string;
  appName: string;
  iconUrl?: string;
  category: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

export interface RecommendationPerformanceSummary {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  overallCtr: number;
  overallConversionRate: number;
  shelfMetrics: ShelfPerformanceMetric[];
  topRecommendedApps: AppRecommendationMetric[];
  poorPerformingApps: AppRecommendationMetric[];
  period: '7d' | '30d' | 'all';
}
