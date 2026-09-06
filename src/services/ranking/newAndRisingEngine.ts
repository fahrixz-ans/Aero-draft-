import { AppData } from '../../types';
import { NewAndRisingAppResult } from './types';
import { getLocalMetricsCache } from '../analytics/analyticsService';

/**
 * Calculates the New & Rising Score for an application.
 * Unlike Trending (which gives heavy weight to massive absolute download volumes),
 * New & Rising prioritizes:
 * 1. Newness (Recent release date or recent version bump)
 * 2. Velocity / Growth Rate (% recent growth)
 * 3. Search Growth (Sudden search spike)
 * 4. Action Growth relative to app age
 */
export function computeNewAndRisingScore(app: AppData): { score: number; growthScore: number; newnessDays: number; reasons: string[] } {
  const localMetrics = getLocalMetricsCache()[app.id];

  // 1. Calculate age in days based on updatedAt or releaseDate
  const dateStr = app.releaseDate || app.createdAt || app.updatedAt;
  const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();
  const daysSinceRelease = Math.max(1, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  
  // Also check days since recent update
  const daysSinceUpdate = app.updatedAt ? Math.max(1, (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : daysSinceRelease;
  const effectiveNewnessDays = Math.min(daysSinceRelease, daysSinceUpdate);

  // Newness score (decay function: newer gets higher points, max 100)
  // Apps under 14 days get 80-100 pts, under 60 days get 40-70 pts, older apps decay
  const newnessScore = Math.max(10, Math.min(100, 100 * Math.exp(-effectiveNewnessDays / 45)));

  // 2. Growth score (growth rate % + local search/download surges)
  const baseGrowth = app.recentGrowth || 10;
  const localInteractions = (localMetrics?.views || 0) + (localMetrics?.downloadStarts || 0) * 3 + (localMetrics?.searchClicks || 0) * 2;
  const growthScore = Math.min(100, (baseGrowth * 1.5) + (localInteractions * 4));

  // 3. Search surge factor
  const searchSurge = Math.min(100, ((app.analytics?.searchFrequency || 0) + (localMetrics?.searchClicks || 0) * 5) * 4);

  // 4. Relative velocity: ratio of downloads/actions to age (giving indie apps a fair shot!)
  const totalActions = (app.analytics?.views || 0) + (app.downloads ? Math.log10(app.downloads) * 5 : 0);
  const velocityScore = Math.min(100, (totalActions / Math.sqrt(effectiveNewnessDays)) * 8);

  // Final New & Rising Composite Score:
  // Newness (35%) + Growth Velocity (35%) + Search Surge (15%) + Relative Velocity (15%)
  const compositeScore = Math.round(
    (newnessScore * 0.35) +
    (growthScore * 0.35) +
    (searchSurge * 0.15) +
    (velocityScore * 0.15)
  );

  // Explanations
  const reasons: string[] = [];
  if (effectiveNewnessDays <= 30) {
    reasons.push(`+ Rilis/Pembaruan baru (${Math.round(effectiveNewnessDays)} hari yang lalu)`);
  }
  if (growthScore >= 30) {
    reasons.push(`+ Laju pertumbuhan pengguna pesat (+${baseGrowth}%)`);
  }
  if (searchSurge >= 20) {
    reasons.push(`+ Lonjakan pencarian organik aktif`);
  }
  if (reasons.length === 0) {
    reasons.push(`+ Momentum unduhan positif dari pengguna`);
  }

  return {
    score: compositeScore,
    growthScore: Math.round(growthScore),
    newnessDays: Math.round(effectiveNewnessDays),
    reasons
  };
}

/**
 * Returns New & Rising applications sorted by New & Rising score
 */
export function getNewAndRisingApps(apps: AppData[], limitCount: number = 8): NewAndRisingAppResult[] {
  const eligible = apps.filter(a => a.status === 'published' || !a.status);

  const scored = eligible.map(app => {
    const calculation = computeNewAndRisingScore(app);
    return {
      app,
      score: calculation.score,
      growthScore: calculation.growthScore,
      newnessDays: calculation.newnessDays,
      reasons: calculation.reasons
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limitCount).map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}
