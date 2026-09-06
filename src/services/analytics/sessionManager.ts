/**
 * Anonymous Session Manager
 * Manages anonymous session IDs and event deduplication to prevent refresh spam.
 */

const SESSION_KEY = 'aero_session_id';
const VIEW_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown per app view

// In-memory view cache for deduplication
const viewCooldowns = new Map<string, number>();

/**
 * Gets or creates an anonymous session identifier for guest / logged-in tracking.
 * Does not collect PII or sensitive machine credentials.
 */
export function getAnonymousSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'sid_fallback_' + Date.now();
  }
}

/**
 * Checks whether an app_view event should be throttled/deduplicated.
 * Returns true if the event is a duplicate within the cooldown window.
 */
export function isDuplicateAppView(appId: string): boolean {
  if (!appId) return false;
  const now = Date.now();
  const lastTime = viewCooldowns.get(appId);

  if (lastTime && now - lastTime < VIEW_COOLDOWN_MS) {
    return true;
  }

  // Also check sessionStorage to preserve deduplication across fast soft navigation
  try {
    const storageKey = `aero_view_${appId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const storedTime = parseInt(stored, 10);
      if (now - storedTime < VIEW_COOLDOWN_MS) {
        return true;
      }
    }
    sessionStorage.setItem(storageKey, String(now));
  } catch {
    // Ignore storage issues
  }

  viewCooldowns.set(appId, now);
  return false;
}

/**
 * Checks for rate limiting / repeated bursts to detect abuse patterns
 */
const recentBurstTimes: number[] = [];
export function recordBurstActivity(): boolean {
  const now = Date.now();
  recentBurstTimes.push(now);
  // Keep only events from the last 10 seconds
  const cutoff = now - 10000;
  while (recentBurstTimes.length > 0 && recentBurstTimes[0] < cutoff) {
    recentBurstTimes.shift();
  }
  // If more than 30 events in 10 seconds from single client, flag as burst
  return recentBurstTimes.length > 30;
}
