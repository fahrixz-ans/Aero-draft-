import { Timestamp } from 'firebase/firestore';

export type AeroEventType =
  | 'app_view'
  | 'search'
  | 'search_result_click'
  | 'save'
  | 'share'
  | 'download'
  | 'official_website_click'
  | 'recommendation_impression'
  | 'recommendation_click'
  | 'category_view'
  | 'collection_view';

export interface AeroEvent {
  eventId: string;
  eventType: AeroEventType;
  userId?: string;
  sessionId?: string;
  appId?: string;
  categoryIds?: string[];
  query?: string;
  source?: string;
  position?: number;
  timestamp: any; // Firestore Timestamp or Date or number
  requestId?: string;
  metadata?: Record<string, any>;
}

// Local memory buffer for events in development or offline mode
const eventBuffer: AeroEvent[] = [];
const MAX_LOCAL_BUFFER = 1000;

// Simple in-memory deduplication cache (eventId or unique signature + timestamp)
const recentEventsCache = new Set<string>();

/**
 * Normalizes and records an AERO telemetry event with anti-manipulation and deduplication
 */
export function recordAeroEvent(params: {
  eventType: AeroEventType;
  userId?: string;
  sessionId?: string;
  appId?: string;
  categoryIds?: string[];
  query?: string;
  source?: string;
  position?: number;
  requestId?: string;
  metadata?: Record<string, any>;
}): AeroEvent {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const sessionId = params.sessionId || 'session_' + (localStorage.getItem('aero_session_id') || Math.random().toString(36));
  if (!localStorage.getItem('aero_session_id')) {
    localStorage.setItem('aero_session_id', sessionId);
  }

  // Anti-manipulation deduplication check (e.g. repeated identical views/downloads within 5 seconds)
  const dedupKey = `${params.eventType}_${params.appId || ''}_${params.userId || sessionId}_${params.query || ''}`;
  if (recentEventsCache.has(dedupKey)) {
    // Return dummy suppressed event to prevent event spam/bot inflation
    return {
      eventId,
      eventType: params.eventType,
      timestamp: Date.now(),
      sessionId
    };
  }

  recentEventsCache.add(dedupKey);
  setTimeout(() => recentEventsCache.delete(dedupKey), 5000); // 5s temporal window

  const event: AeroEvent = {
    eventId,
    eventType: params.eventType,
    userId: params.userId,
    sessionId,
    appId: params.appId,
    categoryIds: params.categoryIds,
    query: params.query,
    source: params.source,
    position: params.position,
    timestamp: Date.now(),
    requestId: params.requestId || 'req_' + Math.random().toString(36).substring(2, 8),
    metadata: params.metadata
  };

  eventBuffer.push(event);
  if (eventBuffer.length > MAX_LOCAL_BUFFER) {
    eventBuffer.shift();
  }

  // Store in local storage for persistence across client refreshes
  try {
    const existing = JSON.parse(localStorage.getItem('aero_telemetry_events') || '[]');
    existing.push(event);
    if (existing.length > 500) existing.shift();
    localStorage.setItem('aero_telemetry_events', JSON.stringify(existing));
  } catch (e) {
    // ignore quota errors
  }

  return event;
}

/**
 * Retrieves buffered or stored AERO events for ranking aggregation
 */
export function getStoredAeroEvents(): AeroEvent[] {
  try {
    const stored = JSON.parse(localStorage.getItem('aero_telemetry_events') || '[]');
    return [...eventBuffer, ...stored];
  } catch (e) {
    return eventBuffer;
  }
}
