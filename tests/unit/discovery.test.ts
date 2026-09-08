// ---------------------------------------------------------------------------
// AERO QA UNIT TESTS: DISCOVERY & RECOMMENDATIONS (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { AppEntity } from '../../server/repositories';
import { createTestApp } from '../fixtures/testFactories';

export type RecommendationStrategy = 'personalized' | 'contextual' | 'trending' | 'popular' | 'new_releases';

export function filterDiscoveryCandidates(apps: AppEntity[]): AppEntity[] {
  // Only PUBLISHED apps with distributionType APK or Web are eligible
  return apps.filter(a => {
    if (a.status !== 'PUBLISHED') return false;
    if (a.distributionType === 'OFFICIAL_WEBSITE' || (a.distributionType as string) === 'EXTERNAL_OFFICIAL_LINK') return false;
    return true;
  });
}

export function deduplicateCandidates(apps: AppEntity[]): AppEntity[] {
  const seenIds = new Set<string>();
  const seenPackages = new Set<string>();
  const result: AppEntity[] = [];

  for (const app of apps) {
    if (!seenIds.has(app.id) && !seenPackages.has(app.packageName)) {
      seenIds.add(app.id);
      seenPackages.add(app.packageName);
      result.push(app);
    }
  }
  return result;
}

export function resolveRecommendationFallback(
  userHistoryCount: number,
  categoryMatchCount: number,
  trendingCount: number
): RecommendationStrategy {
  if (userHistoryCount >= 3) return 'personalized';
  if (categoryMatchCount >= 2) return 'contextual';
  if (trendingCount >= 1) return 'trending';
  return 'popular';
}

describe('Discovery & Recommendation Engine', () => {
  describe('Candidate Filtering', () => {
    it('filters out unpublished or external website apps', () => {
      const published = createTestApp({ id: 'app_pub', status: 'PUBLISHED', distributionType: 'APK' });
      const draft = createTestApp({ id: 'app_draft', status: 'DRAFT' });
      const external = createTestApp({ id: 'app_ext', status: 'PUBLISHED', distributionType: 'OFFICIAL_WEBSITE' });

      const filtered = filterDiscoveryCandidates([published, draft, external]);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('app_pub');
    });
  });

  describe('Deduplication', () => {
    it('deduplicates recommendations by app ID and package name', () => {
      const app1 = createTestApp({ id: 'app_1', packageName: 'com.aero.app1' });
      const app1Duplicate = createTestApp({ id: 'app_1', packageName: 'com.aero.app1' });
      const app2SamePackage = createTestApp({ id: 'app_2', packageName: 'com.aero.app1' });
      const app3Unique = createTestApp({ id: 'app_3', packageName: 'com.aero.app3' });

      const clean = deduplicateCandidates([app1, app1Duplicate, app2SamePackage, app3Unique]);
      expect(clean.length).toBe(2);
      expect(clean.map(a => a.id)).toEqual(['app_1', 'app_3']);
    });
  });

  describe('Recommendation Strategy Fallback Cascade', () => {
    it('selects personalized when sufficient user history exists', () => {
      expect(resolveRecommendationFallback(5, 0, 0)).toBe('personalized');
    });

    it('falls back to contextual when history is sparse but category matches', () => {
      expect(resolveRecommendationFallback(1, 3, 0)).toBe('contextual');
    });

    it('falls back to trending or popular for cold-start users', () => {
      expect(resolveRecommendationFallback(0, 0, 5)).toBe('trending');
      expect(resolveRecommendationFallback(0, 0, 0)).toBe('popular');
    });
  });
});
