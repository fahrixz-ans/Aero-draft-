import { AiFeatureFlagConfig } from '../../src/types';

export const AI_DISCOVERY_MODEL_VERSION = 'v9.16.0';
export const AI_DISCOVERY_ALGORITHM_VERSION = 'alg_discovery_v9.16';

let currentFeatureFlags: AiFeatureFlagConfig = {
  AI_DISCOVERY_ENABLED: true,
  AI_SEARCH_INTENT_ENABLED: true,
  AI_QUERY_EXPANSION_ENABLED: true,
  AI_SEMANTIC_MATCHING_ENABLED: true,
  AI_PERSONALIZATION_ENABLED: true,
  AI_RECOMMENDATION_ENABLED: true,
  AI_EXPERIMENTS_ENABLED: true,
  AI_AUTO_OPTIMIZATION_ENABLED: true
};

export function getAiFeatureFlags(): AiFeatureFlagConfig {
  return { ...currentFeatureFlags };
}

export function updateAiFeatureFlags(partialFlags: Partial<AiFeatureFlagConfig>): AiFeatureFlagConfig {
  currentFeatureFlags = {
    ...currentFeatureFlags,
    ...partialFlags
  };
  return { ...currentFeatureFlags };
}

export const AI_THRESHOLDS = {
  MIN_CONFIDENCE_THRESHOLD: 0.65,
  HIGH_CONFIDENCE_THRESHOLD: 0.85,
  MAX_QUERY_EXPANSION_TERMS: 4,
  MAX_CANDIDATE_POOL: 50,
  DIVERSITY_DEVELOPER_PENALTY: 0.15,
  DIVERSITY_CATEGORY_PENALTY: 0.10,
  CACHE_TTL_SECONDS: 3600
};
