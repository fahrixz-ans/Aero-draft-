import { Timestamp, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type AeroEventType =
  | 'app_view' | 'search' | 'search_result_click' | 'save' | 'share' | 'download'
  | 'official_website_click' | 'recommendation_impression' | 'recommendation_click'
  | 'category_view' | 'collection_view';

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
  timestamp: any;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Firestore is the only event store. There is intentionally no local buffer,
 * localStorage queue, or process-memory deduplication.
 */
export async function recordAeroEvent(params: {
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
}): Promise<AeroEvent> {
  const eventId = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const event: AeroEvent = {
    eventId,
    eventType: params.eventType,
    userId: params.userId,
    sessionId: params.sessionId,
    appId: params.appId,
    categoryIds: params.categoryIds,
    query: params.query?.slice(0, 100),
    source: params.source,
    position: params.position,
    timestamp: Timestamp.now(),
    requestId: params.requestId,
    metadata: params.metadata,
  };

  await setDoc(doc(db, 'analytics', eventId), {
    ...event,
    timestamp: serverTimestamp(),
  });

  return event;
}

export async function getStoredAeroEvents(options: { appId?: string; max?: number } = {}): Promise<AeroEvent[]> {
  const constraints: any[] = [];
  if (options.appId) constraints.push(where('appId', '==', options.appId));
  constraints.push(orderBy('timestamp', 'desc'), limit(Math.min(Math.max(options.max || 500, 1), 1000)));

  const snap = await getDocs(query(collection(db, 'analytics'), ...constraints));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      eventId: d.id,
    } as AeroEvent;
  });
}
