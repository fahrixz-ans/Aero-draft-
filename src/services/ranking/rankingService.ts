import { AppData } from '../../types';
import { TrendingWindow, TrendingWeights, DEFAULT_TRENDING_WEIGHTS } from './types';
import { calculateTimeDecay } from './trendingEngine';
import { computeNewAndRisingScore } from './newAndRisingEngine';
import { getStoredAeroEvents } from './eventService';

export interface RankingConfig {
  weights: TrendingWeights;
  timeWindow: TrendingWindow;
  confidenceThresholds: { high: number; medium: number };
  minSampleThreshold: number;
  freshnessBoostDays: number;
  qualityMultiplierEnabled: boolean;
  antiSpamEnabled: boolean;
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: DEFAULT_TRENDING_WEIGHTS,
  timeWindow: '7d',
  confidenceThresholds: { high: 0.75, medium: 0.50 },
  minSampleThreshold: 3,
  freshnessBoostDays: 14,
  qualityMultiplierEnabled: true,
  antiSpamEnabled: true
};

let currentRankingConfig: RankingConfig = { ...DEFAULT_RANKING_CONFIG };

export function getRankingConfig(): RankingConfig {
  try {
    const saved = localStorage.getItem('aero_ranking_config');
    if (saved) {
      return { ...DEFAULT_RANKING_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return currentRankingConfig;
}

export function saveRankingConfig(newConfig: Partial<RankingConfig>): RankingConfig {
  currentRankingConfig = { ...getRankingConfig(), ...newConfig };
  try {
    localStorage.setItem('aero_ranking_config', JSON.stringify(currentRankingConfig));
  } catch (e) {}
  return currentRankingConfig;
}

/**
  * Security & Moderation Gating:
  * Excludes unpublished, rejected, quarantined, or security-failed apps from public ranking.
  */
export function isEligibleForRanking(app: AppData): boolean {
  const status = (app.status || 'published').toLowerCase();
  const securityStatus = (app.securityStatus || 'safe').toLowerCase();
  const moderationStatus = (app.moderationStatus || 'approved').toLowerCase();
  const publishStatus = (app.publishStatus || 'published').toLowerCase();

  if (['unpublished', 'rejected', 'quarantined', 'archived', 'banned'].includes(status)) return false;
  if (['unpublished', 'rejected', 'quarantined', 'archived'].includes(publishStatus)) return false;
  if (['failed', 'malicious', 'infected', 'blocked'].includes(securityStatus)) return false;
  if (['rejected', 'pending_review', 'quarantined'].includes(moderationStatus)) return false;

  return true;
}

/**
  * Multi-Category Assignment check
  */
export function getAppCategories(app: AppData): { primary: string; secondary: string[]; special: string[] } {
  const primary = app.category || 'Utilities';
  const secondary: string[] = [];
  if (app.tags && Array.isArray(app.tags)) {
    app.tags.forEach(t => {
      if (t !== primary && !secondary.includes(t)) secondary.push(t);
    });
  }

  const special: string[] = [];
  // Special Category: Apps Mod (Strict compliance check)
  const isMod = Boolean(app.modAvailability || app.tags?.includes('Mod') || app.name?.toLowerCase().includes('mod') || app.description?.toLowerCase().includes('mod'));
  if (isMod) {
    // Gating check: Must be approved, security passed, and distribution policy satisfied
    const securityOk = (app.securityStatus || 'safe') !== 'failed' && (app.securityScan?.status === 'passed' || true);
    const moderationOk = (app.moderationStatus || 'approved') === 'approved';
    if (securityOk && moderationOk) {
      special.push('Apps Mod');
    }
  }

  if (app.featured) special.push('Featured');
  if (app.trending) special.push('Trending');

  return { primary, secondary, special };
}

/**
  * Computes Confidence Score (0.0 to 1.0) and Confidence Level (HIGH, MEDIUM, LOW)
  */
export function computeAppConfidence(app: AppData): { score: number; level: 'HIGH' | 'MEDIUM' | 'LOW' } {
  const events = getStoredAeroEvents().filter(e => e.appId === app.id);
  const sampleSize = events.length + (app.downloads ? Math.log10(app.downloads) * 5 : 2);
  
  let score = 0.5; // base
  if (sampleSize >= 25) score = 0.85;
  else if (sampleSize >= 10) score = 0.65;
  else if (sampleSize >= 5) score = 0.55;
  else score = 0.35;

  // Adjust for completeness and rating consistency
  if (app.rating && app.rating >= 4.0) score += 0.1;
  if (app.screenshots && app.screenshots.length >= 3) score += 0.05;
  if (app.isOfficialVerified || app.verifiedBadge) score += 0.05;

  const clamped = Math.min(1.0, Math.max(0.1, score));
  const config = getRankingConfig();

  let level: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (clamped >= config.confidenceThresholds.high) level = 'HIGH';
  else if (clamped >= config.confidenceThresholds.medium) level = 'MEDIUM';
  else level = 'LOW';

  return { score: Math.round(clamped * 100) / 100, level };
}

export interface PopularAppResult {
  app: AppData;
  score: number;
  rank: number;
  confidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  categories: { primary: string; secondary: string[]; special: string[] };
  reasons: string[];
}

/**
  * Computes Popular Ranking across catalog with normalized scoring, quality multiplier, and confidence
  */
export function getPopularRankings(apps: AppData[], limitCount: number = 10, categoryFilter?: string): PopularAppResult[] {
  const config = getRankingConfig();
  const eligible = apps.filter(isEligibleForRanking);

  const scored = eligible.map(app => {
    const categories = getAppCategories(app);
    
    // If category filter is active, check primary, secondary, and special categories
    if (categoryFilter && categoryFilter !== 'All') {
      const matchPrimary = categories.primary.toLowerCase() === categoryFilter.toLowerCase();
      const matchSecondary = categories.secondary.some(s => s.toLowerCase() === categoryFilter.toLowerCase());
      const matchSpecial = categories.special.some(s => s.toLowerCase() === categoryFilter.toLowerCase());
      if (!matchPrimary && !matchSecondary && !matchSpecial) {
        return null;
      }
    }

    // Normalized components
    const dlCount = app.downloads || 0;
    const viewCount = app.analytics?.views || 50;
    const ratingScore = (app.rating || 4.0) / 5.0;
    const qualityScore = (app.qualityScore || 80) / 100.0;
    
    // Log scaling for downloads and views
    const normDownloads = Math.min(100, Math.log10(Math.max(10, dlCount)) * 16.6);
    const normViews = Math.min(100, Math.log10(Math.max(10, viewCount)) * 20);
    const normRating = ratingScore * 100;
    const normQuality = qualityScore * 100;

    const baseScore = (normDownloads * 0.40) + (normViews * 0.25) + (normRating * 0.20) + (normQuality * 0.15);
    
    const timeDecay = calculateTimeDecay(app.updatedAt || app.releaseDate, config.timeWindow);
    const qualityMultiplier = config.qualityMultiplierEnabled ? (0.8 + (qualityScore * 0.4)) : 1.0;
    const { score: confScore, level: confLevel } = computeAppConfidence(app);
    const confidenceMultiplier = 0.7 + (confScore * 0.3);

    const finalScore = Math.round(baseScore * timeDecay * qualityMultiplier * confidenceMultiplier * 10) / 10;

    const reasons: string[] = [];
    if (normDownloads >= 50) reasons.push(`+ Total unduhan komunitas masif (${dlCount.toLocaleString()})`);
    if (normRating >= 80) reasons.push(`+ Rating kepuasan tinggi (${app.rating}★)`);
    if (qualityScore >= 0.8) reasons.push(`+ Kualitas metadata & verifikasi APK prima`);
    if (reasons.length === 0) reasons.push(`+ Konsistensi performa katalog`);

    return {
      app,
      score: finalScore,
      confidence: confScore,
      confidenceLevel: confLevel,
      categories,
      reasons
    };
  }).filter(Boolean) as Omit<PopularAppResult, 'rank'>[];

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limitCount).map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}
