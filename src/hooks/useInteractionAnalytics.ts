import { useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppData } from '../types';
import { getAnonymousSessionId } from '../services/analytics/sessionManager';

export interface InteractionAnalyticsPayload {
  eventType: 'app_click' | 'download_button_press' | 'search_query' | 'app_share' | 'filter_change' | string;
  appId?: string;
  appName?: string;
  appSlug?: string;
  category?: string;
  developer?: string;
  version?: string;
  downloadType?: string;
  query?: string;
  resultCount?: number;
  filters?: Record<string, any>;
  source?: string;
  surface?: string;
  position?: number;
  metadata?: Record<string, any>;
}

// In-memory throttling map to prevent duplicate rapid logging
const throttleMap = new Map<string, number>();

/**
 * Custom hook to track user interactions across the application
 * (e.g. app clicks, download button presses, search queries)
 * and persist them to Firestore's 'analytics' collection.
 */
export function useInteractionAnalytics(userId?: string | null) {
  const logToFirestore = useCallback(async (payload: InteractionAnalyticsPayload) => {
    try {
      const now = Date.now();
      const dedupKey = `${payload.eventType}_${payload.appId || ''}_${payload.query || ''}_${payload.downloadType || ''}`;
      const lastLogged = throttleMap.get(dedupKey);

      // 1.5 second throttle for identical action
      if (lastLogged && now - lastLogged < 1500) {
        return;
      }
      throttleMap.set(dedupKey, now);

      const sessionId = getAnonymousSessionId();
      const eventId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const timestamp = new Date().toISOString();

      const documentData = {
        eventId,
        schemaVersion: 1,
        ...payload,
        userId: userId || null,
        sessionId,
        timestamp,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestampServer: serverTimestamp()
      };

      // Write directly to 'analytics' collection in Firestore
      await addDoc(collection(db, 'analytics'), documentData);
    } catch (err) {
      // Non-blocking graceful error logging
      console.debug('[Analytics Hook] interaction log notice:', err);
    }
  }, [userId]);

  /**
   * Tracks when a user clicks on an application card or banner
   */
  const trackAppClick = useCallback((
    app: Partial<AppData> & { id: string; name?: string; slug?: string; category?: string; developer?: string },
    context?: { source?: string; surface?: string; position?: number; metadata?: Record<string, any> }
  ) => {
    if (!app || !app.id) return;
    logToFirestore({
      eventType: 'app_click',
      appId: app.id,
      appName: app.name,
      appSlug: app.slug || app.id,
      category: app.category,
      developer: app.developer || app.developerName,
      source: context?.source || 'app_grid',
      surface: context?.surface || 'catalog',
      position: context?.position,
      metadata: context?.metadata
    });
  }, [logToFirestore]);

  /**
   * Tracks when a user clicks a download button (GET, APK Direct, Mirror, etc.)
   */
  const trackDownloadPress = useCallback((
    app: Partial<AppData> & { id: string; name?: string; slug?: string; category?: string; version?: string },
    downloadType: 'official' | 'alternative' | 'direct' | 'custom' | string = 'official',
    version?: string
  ) => {
    if (!app || !app.id) return;
    logToFirestore({
      eventType: 'download_button_press',
      appId: app.id,
      appName: app.name,
      appSlug: app.slug || app.id,
      category: app.category,
      version: version || app.version,
      downloadType,
      source: 'download_button'
    });
  }, [logToFirestore]);

  /**
   * Tracks user search queries and filter refinements
   */
  const trackSearchQuery = useCallback((
    query: string,
    resultCount?: number,
    filters?: Record<string, any>
  ) => {
    const trimmed = (query || '').trim();
    if (!trimmed && (!filters || Object.keys(filters).length === 0)) return;
    logToFirestore({
      eventType: 'search_query',
      query: trimmed,
      resultCount: resultCount ?? 0,
      filters: filters || {},
      source: 'search_bar'
    });
  }, [logToFirestore]);

  /**
   * Generic tracker for other specific user interactions (e.g. shares, filters)
   */
  const trackInteraction = useCallback((
    eventType: string,
    details?: Record<string, any>
  ) => {
    logToFirestore({
      eventType,
      ...details
    });
  }, [logToFirestore]);

  return {
    trackAppClick,
    trackDownloadPress,
    trackSearchQuery,
    trackInteraction
  };
}
