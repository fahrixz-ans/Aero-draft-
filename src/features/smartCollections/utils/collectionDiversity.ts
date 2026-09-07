import { SmartCollectionAppItem, SmartCollectionDiversityRules } from '../types/smartCollections';

/**
 * Enforces diversity constraints on candidate items (Section 13).
 * Limits the number of apps by the same developer and category.
 */
export function applyDiversityRules(
  items: SmartCollectionAppItem[],
  rules?: SmartCollectionDiversityRules,
  maxItems: number = 10
): SmartCollectionAppItem[] {
  const maxSameDeveloper = rules?.maxSameDeveloper ?? 2;
  const maxSameCategory = rules?.maxSameCategory ?? 3;

  const devCounts = new Map<string, number>();
  const catCounts = new Map<string, number>();
  const accepted: SmartCollectionAppItem[] = [];
  const deferred: SmartCollectionAppItem[] = [];

  for (const item of items) {
    const dev = (item.developerName || 'Unknown').trim().toLowerCase();
    const cat = (item.category || 'General').trim().toLowerCase();

    const currentDevCount = devCounts.get(dev) || 0;
    const currentCatCount = catCounts.get(cat) || 0;

    if (currentDevCount < maxSameDeveloper && currentCatCount < maxSameCategory) {
      devCounts.set(dev, currentDevCount + 1);
      catCounts.set(cat, currentCatCount + 1);
      accepted.push(item);

      if (accepted.length >= maxItems) {
        break;
      }
    } else {
      deferred.push(item);
    }
  }

  // If diversity was too strict and accepted is less than desired maxItems, backfill from deferred items
  if (accepted.length < maxItems && deferred.length > 0) {
    for (const item of deferred) {
      if (accepted.length >= maxItems) break;
      accepted.push(item);
    }
  }

  return accepted.map((item, idx) => ({
    ...item,
    position: idx + 1
  }));
}
