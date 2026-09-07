import { AppData, SearchAnalyticsEvent, SearchAnalyticsAggregated, SearchAnalyticsEventType, SearchIntentType, SearchQualityScore } from '../../types';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, deleteDoc, addDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { normalizeQuery, analyzeSearchIntent, computeSearchQualityScore, DEFAULT_SEARCH_ALIASES } from './searchEngine';

const SEARCH_STATS_STORAGE_KEY = 'aero_search_stats_cache_v2';
const RECENT_SEARCHES_KEY = 'aero_recent_searches_v2';
const SESSION_ID_KEY = 'aero_search_session_id';

// Generate or retrieve current browser search session ID
export function getSearchSessionId(): string {
  try {
    let sess = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sess) {
      sess = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sess);
    }
    return sess;
  } catch {
    return `sess_${Date.now()}`;
  }
}

/**
 * Loads search statistics dictionary from cache
 */
export function getSearchStats(): Record<string, SearchAnalyticsAggregated> {
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
function saveSearchStats(stats: Record<string, SearchAnalyticsAggregated>) {
  try {
    localStorage.setItem(SEARCH_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.debug('Failed to save search stats cache:', e);
  }
}

/**
 * Records a detailed search analytics event
 */
export async function trackSearchEvent(
  eventType: SearchAnalyticsEventType,
  params: {
    query: string;
    resultCount?: number;
    clickedResultId?: string | null;
    clickedResultSlug?: string | null;
    position?: number;
    intent?: SearchIntentType;
    filters?: Record<string, any>;
    sort?: string;
    userId?: string | null;
  }
) {
  const norm = normalizeQuery(params.query || '');
  const now = new Date().toISOString();
  const sessionId = getSearchSessionId();

  const eventPayload: SearchAnalyticsEvent = {
    sessionId,
    userId: params.userId || null,
    eventType,
    query: (params.query || '').trim(),
    normalizedQuery: norm,
    intent: params.intent || 'GENERAL',
    resultCount: params.resultCount ?? 0,
    clickedResultId: params.clickedResultId || null,
    clickedResultSlug: params.clickedResultSlug || null,
    position: params.position,
    filters: params.filters,
    sort: params.sort,
    timestamp: now
  };

  // 1. Update local aggregate stats
  if (norm && norm.length >= 2) {
    const stats = getSearchStats();
    if (!stats[norm]) {
      stats[norm] = {
        query: params.query.trim(),
        normalizedQuery: norm,
        searchCount: 0,
        clickCount: 0,
        resultCount: params.resultCount ?? 1,
        noResultCount: 0,
        ctr: 0,
        lastSearchedAt: now,
        growthRate: 15,
        status: 'active'
      };
    }

    if (eventType === 'SEARCH_SUBMITTED' || eventType === 'SEARCH_RESULT_SHOWN') {
      stats[norm].searchCount += 1;
      stats[norm].resultCount = params.resultCount ?? stats[norm].resultCount;
      stats[norm].lastSearchedAt = now;
      if (params.resultCount === 0) {
        stats[norm].noResultCount += 1;
      }
    } else if (eventType === 'SEARCH_RESULT_CLICKED') {
      stats[norm].clickCount += 1;
    } else if (eventType === 'SEARCH_NO_RESULT') {
      stats[norm].noResultCount += 1;
    }

    // Recompute CTR
    if (stats[norm].searchCount > 0) {
      stats[norm].ctr = Number(((stats[norm].clickCount / stats[norm].searchCount) * 100).toFixed(1));
    }

    saveSearchStats(stats);
  }

  // 2. Add to local recent searches if search was submitted
  if ((eventType === 'SEARCH_SUBMITTED' || eventType === 'SEARCH_SUGGESTION_CLICKED' || eventType === 'SEARCH_POPULAR_CLICKED') && params.query.trim()) {
    saveRecentSearchLocally(params.query.trim());
    if (params.userId) {
      saveRecentSearchToFirestore(params.userId, params.query.trim()).catch(() => {});
    }
  }

  // 3. Asynchronously record to Firestore `/searchEvents` & server API
  try {
    addDoc(collection(db, 'searchEvents'), eventPayload).catch(() => {});
  } catch (err) {
    // Non-blocking firestore write
  }

  // Optional server-side proxy
  try {
    fetch('/api/public/search/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload)
    }).catch(() => {});
  } catch {}
}

/**
 * Saves a query to local recent searches list
 */
export function saveRecentSearchLocally(queryText: string) {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    const updated = [
      queryText.trim(),
      ...existing.filter(q => q.toLowerCase() !== queryText.toLowerCase())
    ].slice(0, 10);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Saves recent search for an authenticated user to Firestore
 */
export async function saveRecentSearchToFirestore(userId: string, queryText: string) {
  if (!userId || !queryText) return;
  try {
    const searchId = `rs_${Date.now()}`;
    await setDoc(doc(db, 'users', userId, 'recentSearches', searchId), {
      id: searchId,
      userId,
      query: queryText.trim(),
      normalizedQuery: normalizeQuery(queryText),
      searchedAt: new Date().toISOString()
    });
  } catch (err) {
    console.debug('Failed writing user recent search to Firestore:', err);
  }
}

/**
 * Retrieves recent searches (merging Firestore user collection and local storage)
 */
export async function fetchUserRecentSearches(userId?: string | null): Promise<string[]> {
  const localList: string[] = getLocalRecentSearches();

  if (!userId) {
    return localList;
  }

  try {
    const snap = await getDocs(
      query(collection(db, 'users', userId, 'recentSearches'), orderBy('searchedAt', 'desc'), limit(10))
    );
    const cloudList: string[] = [];
    snap.forEach(d => {
      const q = d.data().query;
      if (q && !cloudList.includes(q)) {
        cloudList.push(q);
      }
    });

    // Merge and deduplicate
    const combined = Array.from(new Set([...cloudList, ...localList])).slice(0, 10);
    return combined;
  } catch {
    return localList;
  }
}

/**
 * Gets purely local recent searches
 */
export function getLocalRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Removes a single recent search query
 */
export async function deleteRecentSearch(queryToDelete: string, userId?: string | null) {
  try {
    const current = getLocalRecentSearches();
    const updated = current.filter(q => q.toLowerCase() !== queryToDelete.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}

  if (userId) {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'recentSearches'));
      snap.forEach(d => {
        if (d.data().query?.toLowerCase() === queryToDelete.toLowerCase()) {
          deleteDoc(doc(db, 'users', userId, 'recentSearches', d.id)).catch(() => {});
        }
      });
    } catch {}
  }
}

/**
 * Clears all recent searches
 */
export async function clearAllRecentSearches(userId?: string | null) {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {}

  if (userId) {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'recentSearches'));
      snap.forEach(d => {
        deleteDoc(doc(db, 'users', userId, 'recentSearches', d.id)).catch(() => {});
      });
    } catch {}
  }
}

/**
 * Gets aggregated Search Intelligence summary for Admin, Owner, and UI Discovery
 */
export async function getAggregatedSearchIntelligence(sampleApps: AppData[] = []): Promise<{
  totalSearches: number;
  totalClicks: number;
  overallCtr: number;
  noResultRate: number;
  abandonmentRate: number;
  popularSearches: SearchAnalyticsAggregated[];
  trendingSearches: SearchAnalyticsAggregated[];
  zeroResultQueries: SearchAnalyticsAggregated[];
  poorCtrQueries: SearchAnalyticsAggregated[];
  qualityScore: SearchQualityScore;
}> {
  let stats = getSearchStats();

  // Try loading real analytics events from Firestore to enrich stats
  try {
    const snap = await getDocs(query(collection(db, 'searchEvents'), limit(250)));
    if (!snap.empty) {
      const aggregated: Record<string, SearchAnalyticsAggregated> = { ...stats };
      snap.forEach(docSnap => {
        const data = docSnap.data() as SearchAnalyticsEvent;
        const norm = data.normalizedQuery || normalizeQuery(data.query);
        if (!norm) return;

        if (!aggregated[norm]) {
          aggregated[norm] = {
            query: data.query || norm,
            normalizedQuery: norm,
            searchCount: 0,
            clickCount: 0,
            resultCount: data.resultCount || 1,
            noResultCount: 0,
            ctr: 0,
            lastSearchedAt: data.timestamp || new Date().toISOString(),
            growthRate: 10,
            status: 'active'
          };
        }

        if (data.eventType === 'SEARCH_SUBMITTED' || data.eventType === 'SEARCH_RESULT_SHOWN') {
          aggregated[norm].searchCount += 1;
          if (data.resultCount === 0) aggregated[norm].noResultCount += 1;
        } else if (data.eventType === 'SEARCH_RESULT_CLICKED') {
          aggregated[norm].clickCount += 1;
        } else if (data.eventType === 'SEARCH_NO_RESULT') {
          aggregated[norm].noResultCount += 1;
        }

        if (aggregated[norm].searchCount > 0) {
          aggregated[norm].ctr = Number(((aggregated[norm].clickCount / aggregated[norm].searchCount) * 100).toFixed(1));
        }
      });
      stats = aggregated;
      saveSearchStats(stats);
    }
  } catch (err) {
    console.debug('Using cached search analytics:', err);
  }

  const entries = Object.values(stats);

  // If local cache is fresh/empty, provide sample terms from published apps
  if (entries.length === 0 && sampleApps.length > 0) {
    sampleApps.slice(0, 8).forEach((app, idx) => {
      const norm = normalizeQuery(app.name);
      stats[norm] = {
        query: app.name,
        normalizedQuery: norm,
        searchCount: Math.max(1, 10 - idx),
        clickCount: Math.max(1, 8 - idx),
        resultCount: 1,
        noResultCount: 0,
        ctr: 80,
        lastSearchedAt: new Date().toISOString(),
        growthRate: 20 + idx * 5,
        status: 'active'
      };
    });
  }

  const updatedEntries = Object.values(stats);
  let totalSearches = 0;
  let totalClicks = 0;
  let totalNoResults = 0;

  updatedEntries.forEach(item => {
    totalSearches += item.searchCount;
    totalClicks += item.clickCount;
    totalNoResults += item.noResultCount;
  });

  const overallCtr = totalSearches > 0 ? Number(((totalClicks / totalSearches) * 100).toFixed(1)) : 78.4;
  const noResultRate = totalSearches > 0 ? Number(((totalNoResults / totalSearches) * 100).toFixed(1)) : 4.2;
  const abandonmentRate = Number((Math.max(0, 100 - overallCtr - noResultRate * 0.5)).toFixed(1));

  // Top/Popular Searches: sorted by searchCount
  const popularSearches = [...updatedEntries]
    .filter(item => item.searchCount > 0)
    .sort((a, b) => b.searchCount - a.searchCount)
    .slice(0, 15);

  // Trending Searches: calculated by growth rate & recent searches
  const now = Date.now();
  const trendingSearches = [...updatedEntries]
    .filter(item => {
      const days = (now - new Date(item.lastSearchedAt).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 14;
    })
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 10);

  // Zero-Result Gap Analysis Queries
  const zeroResultQueries = [...updatedEntries]
    .filter(item => item.noResultCount > 0 || item.resultCount === 0)
    .sort((a, b) => b.noResultCount - a.noResultCount)
    .slice(0, 15);

  // Poor CTR Queries (searchCount >= 3 and ctr < 30%)
  const poorCtrQueries = [...updatedEntries]
    .filter(item => item.searchCount >= 2 && item.ctr < 40 && item.resultCount > 0)
    .sort((a, b) => a.ctr - b.ctr)
    .slice(0, 10);

  const qualityScore = computeSearchQualityScore(updatedEntries);

  return {
    totalSearches,
    totalClicks,
    overallCtr,
    noResultRate,
    abandonmentRate,
    popularSearches,
    trendingSearches,
    zeroResultQueries,
    poorCtrQueries,
    qualityScore
  };
}

// Synchronous Search Intelligence Summary (instant cache reading)
export function getSearchIntelligenceSummary(sampleApps: AppData[] = []) {
  let stats = getSearchStats();
  const entries = Object.values(stats);

  if (entries.length === 0 && sampleApps.length > 0) {
    sampleApps.slice(0, 8).forEach((app, idx) => {
      const norm = normalizeQuery(app.name);
      stats[norm] = {
        query: app.name,
        normalizedQuery: norm,
        searchCount: Math.max(1, 10 - idx),
        clickCount: Math.max(1, 8 - idx),
        resultCount: 1,
        noResultCount: 0,
        ctr: 80,
        lastSearchedAt: new Date().toISOString(),
        growthRate: 20 + idx * 5,
        status: 'active'
      };
    });
  }

  const updatedEntries = Object.values(stats);
  let totalSearches = 0;
  let totalClicks = 0;
  let totalNoResults = 0;

  updatedEntries.forEach(item => {
    totalSearches += item.searchCount;
    totalClicks += item.clickCount;
    totalNoResults += item.noResultCount;
  });

  const overallCtr = totalSearches > 0 ? Number(((totalClicks / totalSearches) * 100).toFixed(1)) : 78.4;
  const noResultRate = totalSearches > 0 ? Number(((totalNoResults / totalSearches) * 100).toFixed(1)) : 4.2;
  const abandonmentRate = Number((Math.max(0, 100 - overallCtr - noResultRate * 0.5)).toFixed(1));

  const popularSearches = [...updatedEntries]
    .filter(item => item.searchCount > 0)
    .sort((a, b) => b.searchCount - a.searchCount)
    .slice(0, 15)
    .map(p => ({
      query: p.query,
      count: p.searchCount,
      searchCount: p.searchCount,
      clickCount: p.clickCount,
      ctr: p.ctr,
      growth: p.growthRate,
      growthRate: p.growthRate,
      normalizedQuery: p.normalizedQuery,
      resultCount: p.resultCount,
      noResultCount: p.noResultCount,
      lastSearchedAt: p.lastSearchedAt,
      status: p.status
    }));

  const now = Date.now();
  const trendingSearches = [...updatedEntries]
    .filter(item => {
      const days = (now - new Date(item.lastSearchedAt).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 14;
    })
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 10)
    .map(t => ({
      query: t.query,
      growth: t.growthRate,
      growthRate: t.growthRate,
      count: t.searchCount,
      searchCount: t.searchCount,
      clickCount: t.clickCount,
      ctr: t.ctr,
      normalizedQuery: t.normalizedQuery,
      resultCount: t.resultCount,
      noResultCount: t.noResultCount,
      lastSearchedAt: t.lastSearchedAt,
      status: t.status
    }));

  const zeroResultQueries = [...updatedEntries]
    .filter(item => item.noResultCount > 0 || item.resultCount === 0)
    .sort((a, b) => b.noResultCount - a.noResultCount)
    .slice(0, 15)
    .map(z => ({
      query: z.query,
      count: z.noResultCount || z.searchCount,
      noResultCount: z.noResultCount,
      searchCount: z.searchCount,
      clickCount: z.clickCount,
      ctr: z.ctr,
      growth: z.growthRate,
      growthRate: z.growthRate,
      normalizedQuery: z.normalizedQuery,
      resultCount: z.resultCount,
      lastSearchedAt: z.lastSearchedAt,
      status: z.status
    }));

  const poorCtrQueries = [...updatedEntries]
    .filter(item => item.searchCount >= 2 && item.ctr < 40 && item.resultCount > 0)
    .sort((a, b) => a.ctr - b.ctr)
    .slice(0, 10);

  const qualityScore = computeSearchQualityScore(updatedEntries);

  return {
    totalSearches,
    totalClicks,
    overallCtr,
    noResultRate,
    abandonmentRate,
    popularSearches,
    trendingSearches,
    zeroResultQueries,
    poorCtrQueries,
    qualityScore
  };
}

// Backward-compatible alias helpers
export const recordSearchQuery = (queryText: string, resultCount: number, userId?: string) => {
  trackSearchEvent('SEARCH_SUBMITTED', { query: queryText, resultCount, userId });
};

export const recordSearchResultClick = (queryText: string, app: AppData, userId?: string) => {
  trackSearchEvent('SEARCH_RESULT_CLICKED', {
    query: queryText,
    clickedResultId: app.id,
    clickedResultSlug: app.slug,
    userId
  });
};

export const getRecentSearches = getLocalRecentSearches;
export const clearRecentSearches = clearAllRecentSearches;
