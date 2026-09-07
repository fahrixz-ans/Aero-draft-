import { ScoredCandidate } from './collectionRanking';

export interface ServerDiversityRules {
  maxSameDeveloper?: number;
  maxSameCategory?: number;
}

export class ServerCollectionDiversity {
  static applyDiversity(
    candidates: ScoredCandidate[],
    rules: ServerDiversityRules = { maxSameDeveloper: 2, maxSameCategory: 3 },
    limit: number = 10
  ): ScoredCandidate[] {
    const maxDev = rules.maxSameDeveloper ?? 2;
    const maxCat = rules.maxSameCategory ?? 3;

    const devCounts = new Map<string, number>();
    const catCounts = new Map<string, number>();
    const accepted: ScoredCandidate[] = [];
    const deferred: ScoredCandidate[] = [];

    for (const c of candidates) {
      const dev = (c.app.developerName || 'Unknown').trim().toLowerCase();
      const cat = (c.app.category || 'General').trim().toLowerCase();

      const currentDev = devCounts.get(dev) || 0;
      const currentCat = catCounts.get(cat) || 0;

      if (currentDev < maxDev && currentCat < maxCat) {
        devCounts.set(dev, currentDev + 1);
        catCounts.set(cat, currentCat + 1);
        accepted.push(c);

        if (accepted.length >= limit) {
          break;
        }
      } else {
        deferred.push(c);
      }
    }

    // Backfill if needed
    if (accepted.length < limit && deferred.length > 0) {
      for (const c of deferred) {
        if (accepted.length >= limit) break;
        accepted.push(c);
      }
    }

    return accepted;
  }
}
