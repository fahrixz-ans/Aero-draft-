import { AppData } from '../../types';
import { trackEvent } from '../analytics/analyticsService';
import { computeAppQualityScore } from '../scoring/qualityScoring';

const SEARCH_STATS_STORAGE_KEY = 'aero_search_stats_cache_v1';
const RECENT_SEARCHES_KEY = 'aero_recent_searches';

export interface SearchQueryStat {
  query: string;
  normalizedQuery: string;
  count: number;
  lastSearchedAt: string;
  totalClicks: number;
  zeroResult: boolean;
}

export interface SearchIntelligenceSummary {
  totalSearches: number;
  totalClicks: number;
  overallCtr: number; // percentage
  popularSearches: { query: string; count: number }[];
  trendingSearches: { query: string; growth: number }[];
  zeroResultQueries: { query: string; count: number; lastSearchedAt: string }[];
}

/**
 * Normalizes query: lowercase, trim, remove unnecessary punctuation
 */
export function normalizeQuery(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Loads search statistics dictionary from cache
 */
export function getSearchStats(): Record<string, SearchQueryStat> {
  try {
    const raw = localStorage.getItem(SEARCH_STATS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage issues
  }
  return {};
}

/**
 * Saves search statistics dictionary to cache
 */
function saveSearchStats(stats: Record<string, SearchQueryStat>) {
  try {
    localStorage.setItem(SEARCH_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.debug('Failed to save search stats cache:', e);
  }
}

/**
 * Records a search event with result count
 */
export function recordSearchQuery(query: string, resultCount: number, userId?: string) {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < 2) return;

  const now = new Date().toISOString();
  const stats = getSearchStats();

  if (!stats[normalized]) {
    stats[normalized] = {
      query: query.trim(),
      normalizedQuery: normalized,
      count: 0,
      lastSearchedAt: now,
      totalClicks: 0,
      zeroResult: resultCount === 0
    };
  }

  stats[normalized].count += 1;
  stats[normalized].lastSearchedAt = now;
  if (resultCount === 0) {
    stats[normalized].zeroResult = true;
  }

  saveSearchStats(stats);

  // Save to recent user searches (for user autocomplete)
  try {
    const rawRecent = localStorage.getItem(RECENT_SEARCHES_KEY);
    const recent: string[] = rawRecent ? JSON.parse(rawRecent) : [];
    const filtered = [query.trim(), ...recent.filter(q => q.toLowerCase() !== query.toLowerCase())].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore
  }

  // Non-blocking firestore event
  trackEvent('app_search', {
    userId,
    metadata: {
      query: query.trim(),
      normalizedQuery: normalized,
      resultCount
    }
  });
}

/**
 * Records a click on an app from a search result (to compute CTR)
 */
export function recordSearchResultClick(query: string, app: AppData, userId?: string) {
  const normalized = normalizeQuery(query);
  if (normalized) {
    const stats = getSearchStats();
    if (stats[normalized]) {
      stats[normalized].totalClicks += 1;
      saveSearchStats(stats);
    }
  }

  trackEvent('search_result_click', {
    appId: app.id,
    categoryId: app.category,
    userId,
    metadata: {
      query: query.trim(),
      normalizedQuery: normalized,
      appSlug: app.slug,
      appName: app.name
    }
  });
}

/**
 * Gets recent searches of current user
 */
export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears recent searches
 */
export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Generates Search Intelligence summary for Admin insights and UI suggestions
 */
export function getSearchIntelligenceSummary(sampleApps: AppData[] = []): SearchIntelligenceSummary {
  const stats = getSearchStats();
  const entries = Object.values(stats);

  let totalSearches = 0;
  let totalClicks = 0;
  const zeroResultList: { query: string; count: number; lastSearchedAt: string }[] = [];

  entries.forEach(item => {
    totalSearches += item.count;
    totalClicks += item.totalClicks;
    if (item.zeroResult) {
      zeroResultList.push({
        query: item.query,
        count: item.count,
        lastSearchedAt: item.lastSearchedAt
      });
    }
  });

  const overallCtr = totalSearches > 0 ? Math.round((totalClicks / totalSearches) * 1000) / 10 : 0;

  // Popular searches: sorted by count
  const popularSearches = [...entries]
    .filter(item => !item.zeroResult)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(item => ({ query: item.query, count: item.count }));

  // Trending searches: searches with fast recency in last 7 days
  const now = Date.now();
  const trendingSearches = [...entries]
    .filter(item => {
      const daysOld = (now - new Date(item.lastSearchedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld <= 7 && item.count >= 2;
    })
    .map(item => ({
      query: item.query,
      growth: Math.round(item.count * 15)
    }))
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 6);

  // If local search cache is fresh/empty, provide verified popular terms from sampleApps so user immediately sees real suggestions
  if (popularSearches.length === 0 && sampleApps.length > 0) {
    sampleApps.slice(0, 5).forEach(app => {
      popularSearches.push({ query: app.name, count: 1 });
    });
  }

  return {
    totalSearches,
    totalClicks,
    overallCtr,
    popularSearches,
    trendingSearches,
    zeroResultQueries: zeroResultList.sort((a, b) => b.count - a.count).slice(0, 10)
  };
}

/**
 * Multi-factor Search Relevance Ranking (Requirement 20)
 * Order: Relevance > Quality > Popularity > Freshness
 */
export function rankSearchResults(query: string, apps: AppData[]): AppData[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return apps;

  const queryTerms = normalized.split(/\s+/).filter(Boolean);

  const scored = apps.map(app => {
    let relevanceScore = 0;
    const nameNorm = normalizeQuery(app.name);
    const devNorm = normalizeQuery(app.developer || '');
    const catNorm = normalizeQuery(app.category || '');
    const descNorm = normalizeQuery(app.description || '');

    // Exact name match gets highest relevance
    if (nameNorm === normalized) {
      relevanceScore += 500;
    } else if (nameNorm.startsWith(normalized)) {
      relevanceScore += 300;
    } else if (nameNorm.includes(normalized)) {
      relevanceScore += 200;
    }

    // Developer match
    if (devNorm.includes(normalized)) {
      relevanceScore += 150;
    }

    // Category match
    if (catNorm.includes(normalized)) {
      relevanceScore += 120;
    }

    // Term-by-term matching
    queryTerms.forEach(term => {
      if (nameNorm.includes(term)) relevanceScore += 80;
      if (devNorm.includes(term)) relevanceScore += 40;
      if (catNorm.includes(term)) relevanceScore += 30;
      if (descNorm.includes(term)) relevanceScore += 15;
    });

    if (relevanceScore === 0) {
      return { app, totalScore: 0 };
    }

    // Quality factor (Weight: 20%)
    const quality = computeAppQualityScore(app).totalScore;

    // Popularity factor (Weight: 15%)
    const popularity = Math.min(100, Math.log10(Math.max(10, app.downloads || 10)) * 12);

    // Freshness factor (Weight: 10%)
    let freshness = 30;
    if (app.updatedAt) {
      const days = (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (days <= 30) freshness = 100;
      else if (days <= 90) freshness = 70;
    }

    const totalScore = relevanceScore + (quality * 0.2) + (popularity * 0.15) + (freshness * 0.1);

    return { app, totalScore };
  });

  return scored
    .filter(item => item.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .map(item => item.app);
}
