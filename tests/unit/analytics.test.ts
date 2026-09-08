// ---------------------------------------------------------------------------
// AERO QA UNIT TESTS: ANALYTICS & EVENT INTEGRITY (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';

export interface RawAnalyticsEvent {
  eventId: string;
  type: string;
  appId: string;
  versionId?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

export function validateAnalyticsEvent(event: RawAnalyticsEvent): { valid: boolean; reason?: string } {
  if (!event.eventId || typeof event.eventId !== 'string') return { valid: false, reason: 'MISSING_EVENT_ID' };
  if (!event.type || typeof event.type !== 'string') return { valid: false, reason: 'MISSING_EVENT_TYPE' };
  if (!event.appId || typeof event.appId !== 'string') return { valid: false, reason: 'MISSING_APP_ID' };
  if (!event.timestamp || isNaN(Date.parse(event.timestamp))) return { valid: false, reason: 'INVALID_TIMESTAMP' };

  // Reject future timestamps (> 5 minutes into the future)
  const eventTime = new Date(event.timestamp).getTime();
  const now = Date.now();
  if (eventTime > now + 5 * 60 * 1000) return { valid: false, reason: 'FUTURE_TIMESTAMP' };

  return { valid: true };
}

export function deduplicateEvents(events: RawAnalyticsEvent[]): RawAnalyticsEvent[] {
  const seenIds = new Set<string>();
  const deduplicated: RawAnalyticsEvent[] = [];

  for (const evt of events) {
    if (!seenIds.has(evt.eventId)) {
      seenIds.add(evt.eventId);
      deduplicated.push(evt);
    }
  }
  return deduplicated;
}

export function calculateDownloadFunnel(events: RawAnalyticsEvent[]): {
  attempts: number;
  authorized: number;
  started: number;
  completed: number;
  authorizationRate: number;
  completionRate: number;
} {
  let attempts = 0;
  let authorized = 0;
  let started = 0;
  let completed = 0;

  for (const evt of events) {
    switch (evt.type) {
      case 'DOWNLOAD_ATTEMPT':
        attempts++;
        break;
      case 'DOWNLOAD_AUTHORIZED':
        authorized++;
        break;
      case 'DOWNLOAD_STARTED':
        started++;
        break;
      case 'DOWNLOAD_COMPLETED':
        completed++;
        break;
    }
  }

  const authorizationRate = attempts > 0 ? Number(((authorized / attempts) * 100).toFixed(2)) : 0;
  const completionRate = started > 0 ? Number(((completed / started) * 100).toFixed(2)) : 0;

  return { attempts, authorized, started, completed, authorizationRate, completionRate };
}

describe('Analytics & Event Integrity Logic', () => {
  describe('Event Schema Validation', () => {
    it('accepts valid analytics events', () => {
      const validEvt: RawAnalyticsEvent = {
        eventId: 'evt_101',
        type: 'APP_VIEW',
        appId: 'app_whatsapp',
        timestamp: new Date().toISOString()
      };
      expect(validateAnalyticsEvent(validEvt).valid).toBe(true);
    });

    it('rejects events with missing required fields or malformed timestamps', () => {
      expect(validateAnalyticsEvent({ eventId: '', type: 'APP_VIEW', appId: 'app_1', timestamp: new Date().toISOString() }).valid).toBe(false);
      expect(validateAnalyticsEvent({ eventId: 'evt_1', type: '', appId: 'app_1', timestamp: new Date().toISOString() }).valid).toBe(false);
      expect(validateAnalyticsEvent({ eventId: 'evt_1', type: 'APP_VIEW', appId: '', timestamp: new Date().toISOString() }).valid).toBe(false);
      expect(validateAnalyticsEvent({ eventId: 'evt_1', type: 'APP_VIEW', appId: 'app_1', timestamp: 'invalid-date' }).valid).toBe(false);
    });

    it('rejects replayed future-dated events', () => {
      const futureEvt: RawAnalyticsEvent = {
        eventId: 'evt_future',
        type: 'DOWNLOAD_STARTED',
        appId: 'app_whatsapp',
        timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      expect(validateAnalyticsEvent(futureEvt)).toEqual({ valid: false, reason: 'FUTURE_TIMESTAMP' });
    });
  });

  describe('Event Deduplication', () => {
    it('removes duplicate event IDs deterministically', () => {
      const list: RawAnalyticsEvent[] = [
        { eventId: 'evt_dup_1', type: 'APP_VIEW', appId: 'app_1', timestamp: new Date().toISOString() },
        { eventId: 'evt_dup_1', type: 'APP_VIEW', appId: 'app_1', timestamp: new Date().toISOString() },
        { eventId: 'evt_unique_2', type: 'DOWNLOAD_COMPLETED', appId: 'app_1', timestamp: new Date().toISOString() }
      ];

      const clean = deduplicateEvents(list);
      expect(clean.length).toBe(2);
      expect(clean.map(e => e.eventId)).toEqual(['evt_dup_1', 'evt_unique_2']);
    });
  });

  describe('Download Funnel Metrics', () => {
    it('calculates funnel dropoff rates accurately', () => {
      const events: RawAnalyticsEvent[] = [
        { eventId: '1', type: 'DOWNLOAD_ATTEMPT', appId: 'app_1', timestamp: new Date().toISOString() },
        { eventId: '2', type: 'DOWNLOAD_ATTEMPT', appId: 'app_1', timestamp: new Date().toISOString() },
        { eventId: '3', type: 'DOWNLOAD_AUTHORIZED', appId: 'app_1', timestamp: new Date().toISOString() },
        { eventId: '4', type: 'DOWNLOAD_STARTED', appId: 'app_1', timestamp: new Date().toISOString() },
        { eventId: '5', type: 'DOWNLOAD_COMPLETED', appId: 'app_1', timestamp: new Date().toISOString() }
      ];

      const funnel = calculateDownloadFunnel(events);
      expect(funnel.attempts).toBe(2);
      expect(funnel.authorized).toBe(1);
      expect(funnel.started).toBe(1);
      expect(funnel.completed).toBe(1);
      expect(funnel.authorizationRate).toBe(50);
      expect(funnel.completionRate).toBe(100);
    });
  });
});
