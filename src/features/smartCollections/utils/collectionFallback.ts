import { AppData } from '../../../types';
import { SmartCollectionAppItem } from '../types/smartCollections';
import { isAppEligibleForCollection } from './collectionEligibility';

/**
 * Maps an AppData entity into a standardized SmartCollectionAppItem.
 */
export function mapAppToCollectionItem(
  app: AppData,
  collectionId: string,
  position: number,
  options?: {
    score?: number;
    badgeLabel?: string;
    badgeType?: string;
    reasonLabel?: string;
    reasonType?: string;
  }
): SmartCollectionAppItem {
  return {
    appId: app.id,
    slug: app.slug || app.id,
    name: app.name,
    developerName: app.developer || 'Pengembang Resmi',
    iconUrl: app.icon,

    rating: app.ratingAverage || app.rating || 0,
    ratingCount: (app as any).ratingCount || (app as any).reviewsCount || 0,

    downloadCount: app.downloads || 0,
    downloadLabel: formatDownloadCount(app.downloads || 0),

    versionName: app.version || '1.0.0',
    versionCode: (app as any).versionCode || 1,
    apkSize: (app as any).fileSize || 0,
    apkSizeLabel: app.size || '35 MB',

    category: app.category || 'Alat & Utilitas',
    secondaryCategories: (app as any).secondaryCategories || [],

    badge: options?.badgeLabel ? {
      type: options.badgeType || 'highlight',
      label: options.badgeLabel
    } : undefined,

    reason: options?.reasonLabel ? {
      type: options.reasonType || 'algorithmic',
      label: options.reasonLabel
    } : undefined,

    score: options?.score ?? 0.85,
    position,

    isPublished: isAppEligibleForCollection(app),
    securityStatus: (app as any).securityStatus || 'passed',

    collectionId
  };
}

function formatDownloadCount(downloads: number): string {
  if (downloads >= 1000000000) {
    return `${(downloads / 1000000000).toFixed(1)}M+ Unduhan`;
  }
  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}Jt+ Unduhan`;
  }
  if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(0)}Rb+ Unduhan`;
  }
  return `${downloads} Unduhan`;
}

/**
 * Fallback resolver if specialized recommendation or search fails.
 * Resolves apps from available catalog using priority:
 * Trending -> Popular -> Highest Rated -> New Releases
 */
export function getCatalogFallbackItems(
  allApps: AppData[],
  collectionId: string,
  limit: number = 8
): SmartCollectionAppItem[] {
  const eligible = allApps.filter(isAppEligibleForCollection);

  if (eligible.length === 0) {
    return [];
  }

  // Sort by popular / downloads / ratings
  const sorted = [...eligible].sort((a, b) => {
    const scoreA = (a.downloads || 0) * 0.6 + (a.rating || 0) * 10000;
    const scoreB = (b.downloads || 0) * 0.6 + (b.rating || 0) * 10000;
    return scoreB - scoreA;
  });

  return sorted.slice(0, limit).map((app, idx) => 
    mapAppToCollectionItem(app, collectionId, idx + 1, {
      badgeLabel: 'Pilihan Populer',
      reasonLabel: 'Populer di komunitas Aero'
    })
  );
}
