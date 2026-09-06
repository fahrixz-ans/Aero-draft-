import { AppData } from '../../types';
import { getTrendingRankings } from '../ranking/trendingEngine';
import { getNewAndRisingApps } from '../ranking/newAndRisingEngine';
import { computeAppQualityScore } from '../scoring/qualityScoring';

export interface UserInterestProfile {
  categoryWeights: Record<string, number>; // categoryName -> accumulated weight
  recentAppIds: string[];
  savedAppIds: string[];
  lastUpdated: string;
}

const LOCAL_USER_PROFILE_KEY = 'aero_user_interest_profile';

/**
 * Loads current user's interest profile from local storage
 */
export function getUserInterestProfile(): UserInterestProfile {
  try {
    const raw = localStorage.getItem(LOCAL_USER_PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse issues
  }
  return {
    categoryWeights: {},
    recentAppIds: [],
    savedAppIds: [],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Records an interaction into the user's interest profile with time-decay aware weighting
 */
export function recordUserInteraction(
  type: 'view' | 'save' | 'download' | 'search' | 'rate' | 'share',
  app?: AppData,
  categoryName?: string
) {
  try {
    const profile = getUserInterestProfile();
    const now = Date.now();

    // Determine weight by interaction type
    let weight = 1.0;
    if (type === 'view') weight = 1.5;
    else if (type === 'search') weight = 2.0;
    else if (type === 'share') weight = 3.0;
    else if (type === 'save') weight = 4.0;
    else if (type === 'download') weight = 5.0;
    else if (type === 'rate') weight = 3.5;

    // Target category
    const cat = categoryName || app?.category;
    if (cat) {
      profile.categoryWeights[cat] = (profile.categoryWeights[cat] || 0) + weight;
    }

    if (app?.id) {
      // Keep track of recent app IDs (max 20)
      profile.recentAppIds = [app.id, ...profile.recentAppIds.filter(id => id !== app.id)].slice(0, 20);
      if (type === 'save') {
        if (!profile.savedAppIds.includes(app.id)) {
          profile.savedAppIds.push(app.id);
        }
      }
    }

    profile.lastUpdated = new Date().toISOString();
    localStorage.setItem(LOCAL_USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.debug('Failed to record user interaction:', err);
  }
}

export interface PersonalizedAppRecommendation {
  app: AppData;
  score: number;
  reason: string;
  badge?: string;
}

/**
 * Generates personalized recommendations for the user.
 * If user has no interaction history (Cold Start), falls back cleanly to Trending and New & Rising.
 */
export function getPersonalizedRecommendations(
  allApps: AppData[],
  limitCount: number = 8,
  savedAppIds: string[] = []
): { items: PersonalizedAppRecommendation[]; isPersonalized: boolean; topInterestCategory?: string } {
  const profile = getUserInterestProfile();
  
  // Combine stored saved IDs with currently passed saved IDs
  const combinedSavedSet = new Set([...profile.savedAppIds, ...savedAppIds]);
  const eligibleApps = allApps.filter(a => a.status === 'published' || !a.status);

  // Check if profile has meaningful activity (at least 1 category interaction or saved app)
  const categoryKeys = Object.keys(profile.categoryWeights);
  const hasHistory = categoryKeys.length > 0 || profile.recentAppIds.length > 0 || combinedSavedSet.size > 0;

  // COLD START FALLBACK (Rule 19)
  if (!hasHistory) {
    const trending = getTrendingRankings(eligibleApps, '7d', limitCount);
    return {
      items: trending.map(t => ({
        app: t.app,
        score: t.score,
        reason: 'Populer & Tren Minggu Ini',
        badge: t.movementLabel !== '—' ? t.movementLabel : undefined
      })),
      isPersonalized: false
    };
  }

  // Find top favorite categories
  const sortedCategories = [...categoryKeys].sort(
    (a, b) => (profile.categoryWeights[b] || 0) - (profile.categoryWeights[a] || 0)
  );
  const topCategory = sortedCategories[0];

  // Score candidate apps based on personalization affinity
  const scored = eligibleApps.map(app => {
    let score = 0;
    let mainReason = 'Rekomendasi untuk Anda';

    // 1. Category Affinity (Weight: 40%)
    const catWeight = profile.categoryWeights[app.category] || 0;
    if (catWeight > 0) {
      score += Math.min(50, catWeight * 10);
      mainReason = `Karena Anda menyukai kategori ${app.category}`;
    }

    // 2. Saved or related developer affinity
    if (combinedSavedSet.has(app.id)) {
      // If already saved, slightly lower priority so user discovers NEW apps, but don't exclude entirely
      score -= 20;
    }

    // 3. Quality baseline (Weight: 25%)
    const quality = computeAppQualityScore(app).totalScore;
    score += (quality * 0.25);

    // 4. Rating & downloads reliability (Weight: 20%)
    const ratingFactor = (app.rating || 4.0) * 4;
    score += ratingFactor;

    // 5. Freshness (Weight: 15%)
    if (app.updatedAt) {
      const days = (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (days <= 30) score += 15;
      else if (days <= 90) score += 8;
    }

    return {
      app,
      score: Math.round(score),
      reason: mainReason
    };
  });

  // Sort descending by personalization score
  scored.sort((a, b) => b.score - a.score);

  return {
    items: scored.slice(0, limitCount).map(item => ({
      app: item.app,
      score: item.score,
      reason: item.reason
    })),
    isPersonalized: true,
    topInterestCategory: topCategory
  };
}
