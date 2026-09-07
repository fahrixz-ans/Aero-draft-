import { SmartCollectionAppItem } from '../types/smartCollections';

/**
 * Deduplicates candidates by appId while preserving the best score or highest position.
 * Guarantees exactly 0 duplicate appId within a single collection (Section 12).
 */
export function deduplicateCollectionItems(items: SmartCollectionAppItem[]): SmartCollectionAppItem[] {
  const seenMap = new Map<string, SmartCollectionAppItem>();

  for (const item of items) {
    if (!item.appId) continue;
    const existing = seenMap.get(item.appId);

    if (!existing) {
      seenMap.set(item.appId, item);
    } else {
      // If candidate already seen, retain the one with higher score or better reason
      const existingScore = existing.score ?? 0;
      const currentScore = item.score ?? 0;

      if (currentScore > existingScore) {
        seenMap.set(item.appId, {
          ...item,
          reason: item.reason || existing.reason,
          badge: item.badge || existing.badge
        });
      }
    }
  }

  // Re-index positions
  const deduped = Array.from(seenMap.values());
  return deduped.map((item, index) => ({
    ...item,
    position: index + 1
  }));
}

/**
 * Deduplicates raw app objects by id
 */
export function deduplicateApps<T extends { id: string }>(apps: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const app of apps) {
    if (!app || !app.id) continue;
    if (!seen.has(app.id)) {
      seen.add(app.id);
      result.push(app);
    }
  }

  return result;
}
