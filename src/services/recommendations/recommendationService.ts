import { AppData } from '../../types';
import { 
  RecommendationConfig, 
  ScoredApp, 
  UserInterestProfile,
  RecommendationFallbackLevel 
} from './recommendationTypes';
import { getRecommendationConfig } from './recommendationConfig';
import { getUserInterestProfile } from './userInterestService';
import { calculateComprehensiveScore, computeAppSimilarityScore, CROSS_CATEGORY_AFFINITIES } from './scoringEngine';

/**
 * Filter apps to ensure they are eligible for recommendation.
 * - Must be published
 * - Security scan not failed/quarantined
 * - Not in the admin excludedAppIds list
 * - Not in the user's dislikedAppIds list
 */
export function filterEligibleApps(
  apps: AppData[],
  config: RecommendationConfig,
  profile?: UserInterestProfile,
  excludeAppIds: string[] = []
): AppData[] {
  const excludedSet = new Set([
    ...(config.excludedAppIds || []),
    ...(profile?.dislikedAppIds || []),
    ...excludeAppIds
  ]);

  return (apps || []).filter(app => {
    if (!app || !app.id) return false;
    if (excludedSet.has(app.id)) return false;

    // Status check
    if (app.status && app.status !== 'published') return false;

    // Security check
    if (app.securityScan && (app.securityScan.status === 'failed' || app.securityScan.status === 'quarantined')) {
      return false;
    }

    return true;
  });
}

/**
 * 1. "Untuk Anda" (For You) Recommendation Engine
 * Full Multi-Level Fallback Hierarchy:
 * Level 1: Personalized (User Interest Profile)
 * Level 2: Top Category affinity
 * Level 3: Trending apps
 * Level 4: Popular apps
 * Level 5: New & Rising apps
 * Level 6: Editor's Picks
 * Level 7: General published catalog
 */
export async function getForYouRecommendations(
  allApps: AppData[],
  userId?: string,
  limitCount = 8
): Promise<ScoredApp[]> {
  const config = await getRecommendationConfig();
  if (!config.shelves.forYou.enabled) return [];

  const profile = await getUserInterestProfile(userId);
  const eligibleApps = filterEligibleApps(allApps, config, profile);
  if (eligibleApps.length === 0) return [];

  const pinnedIds = config.pinnedAppIds?.forYou || [];
  const results: ScoredApp[] = [];
  const selectedAppIds = new Set<string>();

  // 1. Inject Pinned / Promoted Apps first if any
  for (const pId of pinnedIds) {
    const pinnedApp = eligibleApps.find(a => a.id === pId);
    if (pinnedApp && !selectedAppIds.has(pinnedApp.id)) {
      const score = calculateComprehensiveScore(pinnedApp, { profile, config });
      score.primaryReason = 'Pilihan Unggulan Aero';
      score.fallbackLevel = 'EDITOR_PICKS';
      results.push({ app: pinnedApp, score, shelfId: 'forYou', position: results.length });
      selectedAppIds.add(pinnedApp.id);
    }
  }

  // 2. Level 1: Personalized Scoring based on User Profile
  const hasStrongProfile = profile.totalInteractionCount >= 2 && profile.preferredCategories.length > 0;
  let fallbackLevel: RecommendationFallbackLevel = hasStrongProfile ? 'PERSONALIZED' : 'TRENDING';

  const scoredCandidates = eligibleApps
    .filter(a => !selectedAppIds.has(a.id))
    .map(app => {
      const score = calculateComprehensiveScore(app, { profile, config });
      score.fallbackLevel = fallbackLevel;
      return { app, score, shelfId: 'forYou' };
    })
    .sort((a, b) => b.score.finalScore - a.score.finalScore);

  // Take top candidates
  for (const item of scoredCandidates) {
    if (results.length >= limitCount) break;
    if (item.score.finalScore >= (config.minimumConfidenceThreshold || 10)) {
      results.push({ ...item, position: results.length });
      selectedAppIds.add(item.app.id);
    }
  }

    // 3. Fallback Level 3 & 4: Trending / Popular if needed to fill shelf limit
  if (results.length < limitCount) {
    const trendingFallback = eligibleApps
      .filter(a => !selectedAppIds.has(a.id))
      .sort((a, b) => ((b.trending || (b.trendingScore && b.trendingScore > 50)) ? 1 : 0) - ((a.trending || (a.trendingScore && a.trendingScore > 50)) ? 1 : 0) || (b.rating || 0) - (a.rating || 0));

    for (const app of trendingFallback) {
      if (results.length >= limitCount) break;
      const score = calculateComprehensiveScore(app, { profile, config });
      score.fallbackLevel = 'TRENDING';
      score.primaryReason = score.primaryReason || 'Sedang Tren';
      results.push({ app, score, shelfId: 'forYou', position: results.length });
      selectedAppIds.add(app.id);
    }
  }

  // 4. Final Fallback: General Catalog
  if (results.length < limitCount) {
    for (const app of eligibleApps) {
      if (results.length >= limitCount) break;
      if (!selectedAppIds.has(app.id)) {
        const score = calculateComprehensiveScore(app, { profile, config });
        score.fallbackLevel = 'GENERAL_CATALOG';
        results.push({ app, score, shelfId: 'forYou', position: results.length });
        selectedAppIds.add(app.id);
      }
    }
  }

  return results.slice(0, limitCount);
}

/**
 * 2. "Mungkin Anda Suka" (You Might Like) Recommendation Engine
 * Incorporates Diversity Ratios:
 * - 70% Primary affinity categories
 * - 20% Adjacent related categories
 * - 10% Serendipity / Discovery outside usual bubble
 */
export async function getYouMightLikeRecommendations(
  allApps: AppData[],
  userId?: string,
  limitCount = 8
): Promise<ScoredApp[]> {
  const config = await getRecommendationConfig();
  if (!config.shelves.youMightLike.enabled) return [];

  const profile = await getUserInterestProfile(userId);
  const eligibleApps = filterEligibleApps(allApps, config, profile);
  if (eligibleApps.length === 0) return [];

  const topCategory = profile.preferredCategories[0];
  const adjacentCategories: string[] = [];
  if (topCategory && CROSS_CATEGORY_AFFINITIES[topCategory]) {
    adjacentCategories.push(...Object.keys(CROSS_CATEGORY_AFFINITIES[topCategory]));
  }

  const primaryLimit = Math.max(1, Math.round(limitCount * (config.diversity.primary / 100)));
  const adjacentLimit = Math.max(1, Math.round(limitCount * (config.diversity.adjacent / 100)));
  const discoveryLimit = limitCount - primaryLimit - adjacentLimit;

  const results: ScoredApp[] = [];
  const selectedIds = new Set<string>();

  // A. Primary category pool
  const primaryPool = eligibleApps.filter(a => topCategory && a.category?.toLowerCase() === topCategory.toLowerCase());
  for (const app of primaryPool) {
    if (results.length >= primaryLimit) break;
    const score = calculateComprehensiveScore(app, { profile, config });
    score.fallbackLevel = 'PERSONALIZED';
    score.primaryReason = `Minat ${app.category}`;
    results.push({ app, score, shelfId: 'youMightLike', position: results.length });
    selectedIds.add(app.id);
  }

  // B. Adjacent categories pool
  const adjacentPool = eligibleApps.filter(a => 
    !selectedIds.has(a.id) && 
    adjacentCategories.some(adj => adj.toLowerCase() === a.category?.toLowerCase())
  );
  for (const app of adjacentPool) {
    if (results.length >= primaryLimit + adjacentLimit) break;
    const score = calculateComprehensiveScore(app, { profile, config });
    score.fallbackLevel = 'CONTENT_SIMILARITY';
    score.primaryReason = `Kategori terkait (${app.category})`;
    results.push({ app, score, shelfId: 'youMightLike', position: results.length });
    selectedIds.add(app.id);
  }

  // C. Serendipity / Discovery pool (High quality apps outside user's usual categories)
  const discoveryPool = eligibleApps
    .filter(a => !selectedIds.has(a.id) && a.category?.toLowerCase() !== topCategory?.toLowerCase())
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

  for (const app of discoveryPool) {
    if (results.length >= limitCount) break;
    const score = calculateComprehensiveScore(app, { profile, config });
    score.fallbackLevel = 'EDITOR_PICKS';
    score.primaryReason = 'Eksplorasi Rekomendasi Baru';
    results.push({ app, score, shelfId: 'youMightLike', position: results.length });
    selectedIds.add(app.id);
  }

  // Fallback to fill remaining
  if (results.length < limitCount) {
    for (const app of eligibleApps) {
      if (results.length >= limitCount) break;
      if (!selectedIds.has(app.id)) {
        const score = calculateComprehensiveScore(app, { profile, config });
        results.push({ app, score, shelfId: 'youMightLike', position: results.length });
        selectedIds.add(app.id);
      }
    }
  }

  return results.slice(0, limitCount);
}

/**
 * 3. "Aplikasi Serupa" (Similar Apps) Recommendation Engine for AppDetail View
 * Computes deep similarity between current active app and catalog candidates
 */
export async function getSimilarAppsRecommendations(
  targetApp: AppData,
  allApps: AppData[],
  limitCount = 6
): Promise<ScoredApp[]> {
  const config = await getRecommendationConfig();
  const eligibleApps = filterEligibleApps(allApps, config, undefined, [targetApp.id]);

  if (eligibleApps.length === 0) return [];

  const scored = eligibleApps.map(candidate => {
    const sim = computeAppSimilarityScore(targetApp, candidate);
    const score = calculateComprehensiveScore(candidate, { targetApp, config });
    score.similarityScore = sim.score;
    score.fallbackLevel = 'CONTENT_SIMILARITY';
    
    // Dynamic reason
    if (sim.matchingFactors.length > 0) {
      score.primaryReason = sim.matchingFactors[0];
    } else {
      score.primaryReason = `Kategori ${candidate.category || targetApp.category}`;
    }

    return { app: candidate, score, shelfId: 'similarApps' };
  });

  scored.sort((a, b) => b.score.similarityScore - a.score.similarityScore || b.score.finalScore - a.score.finalScore);

  return scored.slice(0, limitCount).map((item, idx) => ({ ...item, position: idx }));
}

/**
 * 4. "Aplikasi Naik Daun" (New & Rising) Recommendation Engine
 */
export async function getNewAndRisingRecommendations(
  allApps: AppData[],
  limitCount = 8
): Promise<ScoredApp[]> {
  const config = await getRecommendationConfig();
  const eligibleApps = filterEligibleApps(allApps, config);

  const scored = eligibleApps.map(app => {
    const score = calculateComprehensiveScore(app, { config });
    score.fallbackLevel = 'NEW_AND_RISING';
    score.primaryReason = 'Rilis & Update Terbaru';
    return { app, score, shelfId: 'newAndRising' };
  });

  // Sort by freshness and quality
  scored.sort((a, b) => (b.score.freshnessScore * 0.6 + b.score.qualityScore * 0.4) - 
                        (a.score.freshnessScore * 0.6 + a.score.qualityScore * 0.4));

  return scored.slice(0, limitCount).map((item, idx) => ({ ...item, position: idx }));
}

/**
 * 5. "Sedang Tren" (Trending) Recommendation Engine
 */
export async function getTrendingRecommendations(
  allApps: AppData[],
  limitCount = 8
): Promise<ScoredApp[]> {
  const config = await getRecommendationConfig();
  const eligibleApps = filterEligibleApps(allApps, config);

  const scored = eligibleApps.map(app => {
    const score = calculateComprehensiveScore(app, { config });
    score.fallbackLevel = 'TRENDING';
    score.primaryReason = 'Paling Banyak Diakses';
    return { app, score, shelfId: 'trending' };
  });

  scored.sort((a, b) => b.score.trendingScore - a.score.trendingScore || b.score.popularityScore - a.score.popularityScore);

  return scored.slice(0, limitCount).map((item, idx) => ({ ...item, position: idx }));
}

/**
 * 6. "Pilihan Editor" (Editor's Picks) Recommendation Engine
 */
export async function getEditorPicksRecommendations(
  allApps: AppData[],
  limitCount = 8
): Promise<ScoredApp[]> {
  const config = await getRecommendationConfig();
  const eligibleApps = filterEligibleApps(allApps, config);

  const scored = eligibleApps
    .filter(a => a.featured || (Number(a.rating) >= 4.5) || a.isOfficialVerified || a.verifiedBadge)
    .map(app => {
      const score = calculateComprehensiveScore(app, { config });
      score.fallbackLevel = 'EDITOR_PICKS';
      score.primaryReason = 'Standar Mutu & Keamanan Pilihan Editor';
      return { app, score, shelfId: 'editorPicks' };
    });

  scored.sort((a, b) => (Number(b.app.rating) || 0) - (Number(a.app.rating) || 0));

  // If editor pool is small, take top rated apps
  if (scored.length < limitCount) {
    const remaining = eligibleApps
      .filter(a => !scored.some(s => s.app.id === a.id))
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

    for (const app of remaining) {
      if (scored.length >= limitCount) break;
      const score = calculateComprehensiveScore(app, { config });
      score.fallbackLevel = 'EDITOR_PICKS';
      score.primaryReason = 'Rekomendasi Rating Tinggi';
      scored.push({ app, score, shelfId: 'editorPicks' });
    }
  }

  return scored.slice(0, limitCount).map((item, idx) => ({ ...item, position: idx }));
}
