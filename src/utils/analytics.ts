import { AppData, AnalyticsEventType } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { trackStoredEvent } from './appStorage';

// Helper to get or generate an anonymous session identifier
export function getAnonymousSessionId(): string {
  try {
    let sid = sessionStorage.getItem('aero_analytics_sid');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      sessionStorage.setItem('aero_analytics_sid', sid);
    }
    return sid;
  } catch {
    return 'sid_default';
  }
}

// Track an interaction event to Firestore and LocalStorage
export async function trackAnalyticsEvent(
  type: AnalyticsEventType,
  applicationId?: string | null,
  searchQuery?: string | null
): Promise<void> {
  try {
    if (type === 'application_view' && applicationId) {
      // Prevent repeated view spam within the same session for the same app
      const viewKey = `viewed_${applicationId}`;
      if (sessionStorage.getItem(viewKey)) return;
      sessionStorage.setItem(viewKey, '1');
    }

    // 1. Log locally
    trackStoredEvent(type, applicationId, searchQuery);

    // 2. Log event to Firestore (non-blocking)
    const sessionId = getAnonymousSessionId();
    addDoc(collection(db, 'analytics'), {
      type,
      applicationId: applicationId || null,
      searchQuery: searchQuery || null,
      sessionId,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    }).catch(() => {
      // Silent catch
    });

    // 3. Atomically increment aggregated metric in applications doc if applicable
    if (applicationId) {
      const appRef = doc(db, 'applications', applicationId);
      const updates: Record<string, any> = {};

      if (type === 'application_view') {
        updates['analytics.views'] = increment(1);
      } else if (type === 'official_download_click') {
        updates['analytics.officialClicks'] = increment(1);
        updates['downloads'] = increment(1);
      } else if (type === 'alternative_download_click') {
        updates['analytics.alternativeClicks'] = increment(1);
        updates['downloads'] = increment(1);
      } else if (type === 'application_search') {
        updates['analytics.searchFrequency'] = increment(1);
      }

      if (Object.keys(updates).length > 0) {
        updateDoc(appRef, updates).catch(() => {
          // Document may not exist in Firestore yet, silent fallback
        });
      }
    }
  } catch (err) {
    // Non-blocking silent logger
    console.debug('Analytics logging notice:', err);
  }
}

/**
 * Calculates a dynamic Trending Score based on views, clicks, searches, and recency
 */
export function calculateTrendingScore(app: AppData): number {
  const views = app.analytics?.views || 0;
  const officialClicks = app.analytics?.officialClicks || 0;
  const altClicks = app.analytics?.alternativeClicks || 0;
  const searchFreq = app.analytics?.searchFrequency || 0;
  const recentGrowth = app.recentGrowth || 0;

  // Base weighted score
  const baseScore = (views * 1.0) + (officialClicks * 3.0) + (altClicks * 2.0) + (searchFreq * 1.5) + (recentGrowth * 2.5);

  // Recency bonus: boost if updated recently (within 7 days)
  let recencyMultiplier = 1.0;
  if (app.updatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 3) recencyMultiplier = 1.5;
    else if (daysSinceUpdate <= 7) recencyMultiplier = 1.25;
    else if (daysSinceUpdate <= 14) recencyMultiplier = 1.1;
  }

  // Baseline download factor
  const baselineFactor = Math.min(50, Math.log10(Math.max(10, app.downloads)) * 5);

  return Math.round((baseScore + baselineFactor) * recencyMultiplier * 10) / 10;
}

/**
 * Sorts applications by dynamic Trending Score
 */
export function getTrendingApplications(apps: AppData[], limitCount: number = 6): AppData[] {
  return [...apps]
    .filter(app => app.status === 'published' || !app.status)
    .map(app => ({
      ...app,
      trendingScore: app.trendingScore || calculateTrendingScore(app)
    }))
    .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
    .slice(0, limitCount);
}
