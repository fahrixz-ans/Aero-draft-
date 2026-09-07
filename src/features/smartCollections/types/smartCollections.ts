import { Timestamp } from 'firebase/firestore';

export type CollectionType = 
  | 'PERSONALIZED'
  | 'POPULAR'
  | 'TRENDING'
  | 'FRESH'
  | 'CONTEXTUAL'
  | 'EDITORIAL';

export type CollectionSource = 
  | 'RECOMMENDATION'
  | 'RANKING'
  | 'SEARCH'
  | 'ANALYTICS'
  | 'EDITORIAL';

export type CollectionPlacement = 
  | 'HOME'
  | 'SEARCH'
  | 'APP_DETAIL'
  | 'CATEGORY';

export type CollectionState = 
  | 'DRAFT'
  | 'VALIDATING'
  | 'GENERATING'
  | 'READY'
  | 'PUBLISHED'
  | 'STALE'
  | 'REGENERATING'
  | 'FAILED'
  | 'DISABLED'
  | 'ARCHIVED';

export type SmartCollectionType = CollectionType;
export type SmartCollectionState = CollectionState;

export interface SmartCollectionAppItem {
  appId: string;
  slug: string;
  name: string;
  developerName: string;
  iconUrl: string;

  rating?: number;
  ratingCount?: number;

  downloadCount?: number;
  downloadLabel?: string;

  versionName?: string;
  versionCode?: number;
  apkSize?: number;
  apkSizeLabel?: string;

  category?: string;
  secondaryCategories?: string[];

  badge?: {
    type: string;
    label: string;
  };

  reason?: {
    type: string;
    label: string;
  };

  score?: number;
  position: number;

  isPublished: boolean;
  securityStatus: string;

  collectionId: string;
}

export interface SmartCollectionDiversityRules {
  maxSameDeveloper?: number;
  maxSameCategory?: number;
}

export interface SmartCollection {
  id: string;
  title: string;
  description?: string;

  type: CollectionType;
  source: CollectionSource;
  placement: CollectionPlacement;

  algorithmVersion?: string;

  items: SmartCollectionAppItem[];

  maxItems: number;

  enabled: boolean;
  priority: number;

  state: CollectionState;
  generatedAt?: string;
  expiresAt?: string;
  sourceVersion?: string;

  diversityRules?: SmartCollectionDiversityRules;
  editorialAppIds?: string[];
  contextAppId?: string;
  contextQuery?: string;

  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CollectionGenerationResult {
  collection: SmartCollection;
  candidatesCount: number;
  eligibleCount: number;
  dedupedCount: number;
  finalCount: number;
  durationMs: number;
}

export type CollectionErrorCode =
  | 'COLLECTION_NOT_FOUND'
  | 'COLLECTION_DISABLED'
  | 'COLLECTION_GENERATION_FAILED'
  | 'COLLECTION_STALE'
  | 'INVALID_COLLECTION_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'FIRESTORE_ERROR'
  | 'RECOMMENDATION_ENGINE_ERROR'
  | 'RANKING_ENGINE_ERROR'
  | 'SEARCH_ENGINE_ERROR'
  | 'INTERNAL_ERROR';

export interface CollectionError {
  code: CollectionErrorCode;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: CollectionError;
  meta: {
    requestId: string;
    timestamp?: string;
  };
}

// State Machine Allowed Transitions Registry (Section 16)
export const ALLOWED_COLLECTION_TRANSITIONS: Record<CollectionState, CollectionState[]> = {
  DRAFT: ['VALIDATING', 'DISABLED', 'ARCHIVED'],
  VALIDATING: ['GENERATING', 'FAILED', 'DISABLED'],
  GENERATING: ['READY', 'FAILED', 'DISABLED'],
  READY: ['PUBLISHED', 'DISABLED', 'VALIDATING', 'ARCHIVED'],
  PUBLISHED: ['STALE', 'DISABLED', 'ARCHIVED', 'VALIDATING'],
  STALE: ['REGENERATING', 'DISABLED', 'ARCHIVED'],
  REGENERATING: ['READY', 'FAILED', 'DISABLED'],
  FAILED: ['VALIDATING', 'DISABLED', 'ARCHIVED'],
  DISABLED: ['VALIDATING', 'DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT']
};

export function canTransitionCollectionState(from: CollectionState, to: CollectionState): boolean {
  const allowed = ALLOWED_COLLECTION_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}
