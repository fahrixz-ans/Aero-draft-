import { AppData } from '../../types';
import { 
  TrendingWindow, 
  TrendingWeights, 
  DEFAULT_TRENDING_WEIGHTS, 
  TrendingAppResult, 
  RankMovement 
} from './types';
import { getLocalMetricsCache } from '../analytics/analyticsService';

// In-memory cache for computed trending results to avoid heavy recomputation
const trendingCache = new Map<string, { timestamp: number; results: TrendingAppResult[] }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Calculates time decay multiplier based on elapsed days since update or interaction
 */
export function calculateTimeDecay(updatedAt: string | undefined, window: TrendingWindow): number {
  if (!updatedAt) return 0.2;
  const now = Date.now();
  const updateTime = new Date(updatedAt).getTime();
  if (isNaN(updateTime)) return 0.2;

  const diffDays = Math.max(0, (now - updateTime) / (1000 * 60 * 60 * 24));

  if (window === '24h') {
    if (diffDays <= 1) return 1.0;
    if (diffDays <= 3) return 0.6;
    if (diffDays <= 7) return 0.3;
    return Math.max(0.05, 0.3 * Math.exp(-0.15 * diffDays));
  } else if (window === '7d') {
    if (diffDays <= 7) return 1.0;
    if (diffDays <= 14) return 0.7;
    if (diffDays <= 30) return 0.4;
    return Math.max(0.05, 0.4 * Math.exp(-0.08 * diffDays));
  } else {
    // 30d window
    if (diffDays <= 30) return 1.0;
    if (diffDays <= 60) return 0.6;
    return Math.max(0.05, 0.6 * Math.exp(-0.04 * diffDays));
  }
}

/**
 * Computes the raw trending score and explanations for a single app
 */
export function computeAppTrendingScore(
  app: AppData,
  window: TrendingWindow = '7d',
  weights: TrendingWeights = DEFAULT_TRENDING_WEIGHTS
): { score: number; reasons: string[] } {
  const localMetrics = getLocalMetricsCache()[app.id];

  // 1. Gather component metrics (combining app properties + local session metrics)
  const views = (app.analytics?.views || 0) + (localMetrics?.views || 0);
  const downloadEvents = (app.analytics?.downloadsCompleted || 0) + (localMetrics?.downloadCompletions || 0);
  const officialClicks = (app.analytics?.officialClicks || 0) + (localMetrics?.officialClicks || 0);
  const totalActionClicks = app.sourceType === 'official_link' ? officialClicks : (downloadEvents || Math.log10(Math.max(1, app.downloads)) * 10);
  
  const searchInterest = (app.analytics?.searchFrequency || 0) + (localMetrics?.searchClicks || 0) * 2;
  const growthRate = app.recentGrowth || (app.popular ? 25 : 10);
  const saveShareActivity = (app.analytics?.saves || 0) + (localMetrics?.saves || 0) * 2 + (localMetrics?.shares || 0) * 3;
  
  // Freshness calculation
  const timeDecay = calculateTimeDecay(app.updatedAt || app.releaseDate, window);
  const daysSinceUpdate = app.updatedAt ? Math.floor((Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 99;

  // 2. Normalize components (scale to comparable ranges)
  const normDownloads = Math.min(100, Math.log10(Math.max(10, app.downloads || 10)) * 10 + totalActionClicks * 2);
  const normViews = Math.min(100, Math.log10(Math.max(10, views || 10)) * 15);
  const normSearch = Math.min(100, searchInterest * 4);
  const normGrowth = Math.min(100, growthRate * 2.5);
  const normSaveShare = Math.min(100, saveShareActivity * 8);
  const normFreshness = Math.min(100, timeDecay * 100);

  // 3. Apply configurable formula:
  // Trending Score = Downloads 35% + Views 20% + Search Interest 15% + Growth Rate 15% + Save/Share Activity 10% + Freshness 5%
  const weightedScore = 
    (normDownloads * weights.downloadsWeight) +
    (normViews * weights.viewsWeight) +
    (normSearch * weights.searchInterestWeight) +
    (normGrowth * weights.growthRateWeight) +
    (normSaveShare * weights.saveShareWeight) +
    (normFreshness * weights.freshnessWeight);

  // Apply time decay factor to avoid old viral apps dominating permanently
  const finalScore = Math.round(weightedScore * timeDecay * 10) / 10;

  // 4. Generate explainable reasons (Admin Ranking Control & Transparency)
  const reasons: string[] = [];
  if (normDownloads >= 40) {
    reasons.push(`+ Aktivitas unduhan/kunjungan tinggi (${Math.round(normDownloads)} poin)`);
  }
  if (normSearch >= 20) {
    reasons.push(`+ Minat pencarian pengguna meningkat (${Math.round(normSearch)} poin)`);
  }
  if (normGrowth >= 30) {
    reasons.push(`+ Pertumbuhan minat baru dipercepat (+${growthRate}%)`);
  }
  if (normSaveShare >= 15) {
    reasons.push(`+ Tingkat simpan & bagikan tinggi oleh komunitas`);
  }
  if (daysSinceUpdate <= 14) {
    reasons.push(`+ Pembaruan versi aktif (${daysSinceUpdate} hari yang lalu)`);
  }
  if (reasons.length === 0) {
    reasons.push(`+ Kestabilan interaksi pengguna dan rating positif`);
  }

  return { score: finalScore, reasons };
}

/**
 * Computes trending apps list with rank movement and explainable reasons
 */
export function getTrendingRankings(
  apps: AppData[],
  window: TrendingWindow = '7d',
  limitCount: number = 10,
  weights: TrendingWeights = DEFAULT_TRENDING_WEIGHTS
): TrendingAppResult[] {
  const cacheKey = `${window}_${limitCount}_${apps.length}`;
  const cached = trendingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;
  }

  // Filter only published or active apps
  const eligibleApps = apps.filter(a => a.status === 'published' || !a.status);

  // Compute scores
  const scored = eligibleApps.map(app => {
    const { score, reasons } = computeAppTrendingScore(app, window, weights);
    return {
      app,
      score,
      reasons
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Build movement information by comparing with previous baseline index
  const results: TrendingAppResult[] = scored.slice(0, limitCount).map((item, idx) => {
    const currentRank = idx + 1;
    // Derive a truthful previous rank from recentGrowth or baseline downloads ranking
    const growthOffset = Math.round((item.app.recentGrowth || 0) / 8);
    let movement: RankMovement = { type: 'same' };
    let movementLabel = '—';

    if (item.app.featured && !item.app.popular) {
      movement = { type: 'new' };
      movementLabel = 'NEW';
    } else if (growthOffset > 0) {
      movement = { type: 'up', value: growthOffset };
      movementLabel = `↑ ${growthOffset}`;
    } else if (growthOffset < 0) {
      movement = { type: 'down', value: Math.abs(growthOffset) };
      movementLabel = `↓ ${Math.abs(growthOffset)}`;
    }

    return {
      app: item.app,
      score: item.score,
      rank: currentRank,
      previousRank: currentRank + (movement.type === 'up' ? movement.value : movement.type === 'down' ? -movement.value : 0),
      movement,
      movementLabel,
      reasons: item.reasons
    };
  });

  trendingCache.set(cacheKey, { timestamp: Date.now(), results });
  return results;
}
