import { AppData, SearchIntent, DiscoveryConfidence } from '../../src/types';
import { normalizeAppData } from '../seo/metadata';
import { classifyQueryIntent } from './intentClassifier';
import { scoreSemanticRelevance } from './semanticMatcher';
import { getAiFeatureFlags, AI_THRESHOLDS } from './config';

export interface DiscoveryRecommendationResult {
  apps: AppData[];
  intent: SearchIntent;
  confidence: DiscoveryConfidence;
  explanations: Record<string, string[]>;
  fallbackUsed: boolean;
}

export function rankAndFilterDiscoveryCandidates(
  query: string,
  rawApps: any[],
  userSession?: any
): DiscoveryRecommendationResult {
  const flags = getAiFeatureFlags();
  const intent = classifyQueryIntent(query);
  const normalizedApps = rawApps.map(normalizeAppData);

  // 1. ELIGIBILITY FILTERING (ABSOLUTE RULE 18)
  // Exclude DRAFT, REJECTED, UNPUBLISHED, QUARANTINED, or REVOKED apps
  const eligibleApps = normalizedApps.filter(app => {
    const isStatusOk = app.status === 'published';
    const isSecurityOk = app.securityStatus !== 'QUARANTINED';
    return isStatusOk && isSecurityOk;
  });

  // Check if AI is enabled or fallback is required
  if (!flags.AI_DISCOVERY_ENABLED || !flags.AI_RECOMMENDATION_ENABLED) {
    return {
      apps: eligibleApps.slice(0, 10),
      intent,
      confidence: { score: 0.5, level: 'LOW' },
      explanations: {},
      fallbackUsed: true
    };
  }

  // 2. SEMANTIC & INTENT SCORING
  const semanticScores = scoreSemanticRelevance(query, eligibleApps);
  const semanticMap = new Map(semanticScores.map(s => [s.appId, s]));

  const scoredApps = eligibleApps.map(app => {
    const sem = semanticMap.get(app.id) || { relevanceScore: 0, reasons: [] };
    let score = sem.relevanceScore * 0.40;

    // Quality Signals
    const ratingSignal = (app.rating / 5.0) * 0.20;
    const downloadSignal = Math.min(1.0, (app.downloads || 0) / 100000) * 0.15;
    const featuredSignal = app.featured ? 0.15 : 0;
    const popularSignal = app.popular ? 0.10 : 0;

    score += ratingSignal + downloadSignal + featuredSignal + popularSignal;

    // Personalization boost if user Session exists
    if (userSession && flags.AI_PERSONALIZATION_ENABLED) {
      if (userSession.preferredCategory && app.category === userSession.preferredCategory) {
        score += 0.10;
        sem.reasons.push(`Disesuaikan dengan minat kategori '${userSession.preferredCategory}' Anda`);
      }
    }

    return {
      app,
      score,
      reasons: sem.reasons
    };
  });

  // Sort by final score descending
  scoredApps.sort((a, b) => b.score - a.score);

  // 3. DIVERSITY PENALIZATION (SECTION 20)
  // Prevent same developer or same category saturation
  const developerCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const diverseResults: typeof scoredApps = [];
  const explanations: Record<string, string[]> = {};

  for (const item of scoredApps) {
    const dev = item.app.developer || 'unknown';
    const cat = item.app.category || 'unknown';

    const devCount = developerCounts.get(dev) || 0;
    const catCount = categoryCounts.get(cat) || 0;

    let adjustedScore = item.score;
    if (devCount >= 2) {
      adjustedScore -= AI_THRESHOLDS.DIVERSITY_DEVELOPER_PENALTY * devCount;
    }
    if (catCount >= 4) {
      adjustedScore -= AI_THRESHOLDS.DIVERSITY_CATEGORY_PENALTY * catCount;
    }

    item.score = Math.max(0, adjustedScore);
    developerCounts.set(dev, devCount + 1);
    categoryCounts.set(cat, catCount + 1);

    diverseResults.push(item);
    explanations[item.app.id] = item.reasons.length > 0 ? item.reasons : ['Relevan berdasarkan skor popularitas & kualitas AERO'];
  }

  // Re-sort after diversity penalty adjustment
  diverseResults.sort((a, b) => b.score - a.score);

  const topApps = diverseResults.map(r => r.app);
  const topScore = diverseResults.length > 0 ? diverseResults[0].score : 0.5;

  let confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (topScore >= AI_THRESHOLDS.HIGH_CONFIDENCE_THRESHOLD) confidenceLevel = 'HIGH';
  else if (topScore < AI_THRESHOLDS.MIN_CONFIDENCE_THRESHOLD) confidenceLevel = 'LOW';

  return {
    apps: topApps,
    intent,
    confidence: {
      score: topScore,
      level: confidenceLevel
    },
    explanations,
    fallbackUsed: confidenceLevel === 'LOW'
  };
}
