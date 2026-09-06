import { db } from '../../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { AnalyticsEvent, AnalyticsEventType, AppAnalyticsSummary } from './types';
import { getAnonymousSessionId, isDuplicateAppView, recordBurstActivity } from './sessionManager';

const LOCAL_STORAGE_METRICS_KEY = 'aero_local_metrics_v2';

/**
 * Helper to get local analytics metrics cache
 */
export function getLocalMetricsCache(): Record<string, AppAnalyticsSummary> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_METRICS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Helper to update local analytics metrics cache
 */
function updateLocalMetricsCache(appId: string, mutator: (m: AppAnalyticsSummary) => void) {
  try {
    const cache = getLocalMetricsCache();
    if (!cache[appId]) {
      cache[appId] = {
        appId,
        views: 0,
        downloadStarts: 0,
        downloadCompletions: 0,
        downloadErrors: 0,
        officialClicks: 0,
        saves: 0,
        unsaves: 0,
        shares: 0,
        ratingsCount: 0,
        reviewsCount: 0,
        reportsCount: 0,
        searchAppearances: 0,
        searchClicks: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    mutator(cache[appId]);
    cache[appId].lastUpdated = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_METRICS_KEY, JSON.stringify(cache));
  } catch (err) {
    console.debug('Error writing local metrics cache:', err);
  }
}

/**
 * Main method to track any analytics event across Aero
 * Fully non-blocking, fail-safe, and privacy-preserving.
 */
export async function trackEvent(
  type: AnalyticsEventType,
  params?: {
    appId?: string | null;
    versionId?: string | null;
    categoryId?: string | null;
    userId?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const appId = params?.appId || undefined;
    const versionId = params?.versionId || undefined;
    const categoryId = params?.categoryId || undefined;
    const userId = params?.userId || undefined;

    // Deduplicate app_view (prevent refresh spam)
    if ((type === 'app_view' || type === 'application_view') && appId) {
      if (isDuplicateAppView(appId)) {
        return; // Ignore duplicated view in same cooldown period
      }
    }

    // Abuse / burst detection
    const isBurst = recordBurstActivity();
    const metadata = {
      ...(params?.metadata || {}),
      ...(isBurst ? { isBurst: true } : {})
    };

    const sessionId = getAnonymousSessionId();
    const timestamp = new Date().toISOString();

    const eventPayload: Omit<AnalyticsEvent, 'id'> & { timestampServer?: any } = {
      type,
      appId,
      versionId,
      categoryId,
      sessionId,
      userId,
      timestamp,
      metadata
    };

    // 1. Update local metrics cache for fast immediate feedback
    if (appId) {
      updateLocalMetricsCache(appId, (m) => {
        switch (type) {
          case 'app_view':
          case 'application_view':
            m.views += 1;
            break;
          case 'download_started':
            m.downloadStarts += 1;
            break;
          case 'download_completed':
            m.downloadCompletions += 1;
            break;
          case 'download_failed':
            m.downloadErrors += 1;
            break;
          case 'official_link_click':
          case 'official_download_click':
            m.officialClicks += 1;
            break;
          case 'save_app':
            m.saves += 1;
            break;
          case 'unsave_app':
            m.unsaves += 1;
            break;
          case 'share_app':
            m.shares += 1;
            break;
          case 'rating_submitted':
            m.ratingsCount += 1;
            break;
          case 'review_submitted':
            m.reviewsCount += 1;
            break;
          case 'report_submitted':
            m.reportsCount += 1;
            break;
          case 'search_result_click':
            m.searchClicks += 1;
            break;
        }
      });
    }

    // 2. Non-blocking persist to Firestore '/analytics' collection
    addDoc(collection(db, 'analytics'), {
      ...eventPayload,
      timestampServer: serverTimestamp()
    }).catch((err) => {
      // Non-blocking catch
      console.debug('Firestore analytics write notice:', err);
    });

    // 3. Atomically update application document counters if applicable
    if (appId) {
      const appRef = doc(db, 'applications', appId);
      const updates: Record<string, any> = {};

      if (type === 'app_view' || type === 'application_view') {
        updates['analytics.views'] = increment(1);
      } else if (type === 'download_completed') {
        updates['downloads'] = increment(1);
        updates['analytics.downloadsCompleted'] = increment(1);
      } else if (type === 'download_started') {
        updates['analytics.downloadsStarted'] = increment(1);
      } else if (type === 'official_link_click' || type === 'official_download_click') {
        updates['analytics.officialClicks'] = increment(1);
      } else if (type === 'save_app') {
        updates['analytics.saves'] = increment(1);
      } else if (type === 'share_app') {
        updates['analytics.shares'] = increment(1);
      }

      if (Object.keys(updates).length > 0) {
        updateDoc(appRef, updates).catch(() => {
          // Document might only exist in static data or network offline, safe fallback
        });
      }
    }
  } catch (err) {
    // Top-level fail-safe: analytics should never crash application browsing
    console.debug('Analytics safe notice:', err);
  }
}
