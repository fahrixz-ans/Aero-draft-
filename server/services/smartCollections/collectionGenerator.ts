import { AppRepository, AppEntity } from '../../repositories';
import { ServerCollectionEligibility } from './collectionEligibility';
import { ServerCollectionRanking, ScoredCandidate } from './collectionRanking';
import { ServerCollectionDiversity, ServerDiversityRules } from './collectionDiversity';
import { CollectionStateMachine } from './collectionStateMachine';

export interface ServerCollectionAppItem {
  appId: string;
  slug: string;
  name: string;
  developerName: string;
  iconUrl: string;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  downloadLabel: string;
  versionName: string;
  versionCode: number;
  apkSize: number;
  apkSizeLabel: string;
  category: string;
  badge?: { type: string; label: string };
  reason?: { type: string; label: string };
  score: number;
  position: number;
  isPublished: boolean;
  securityStatus: string;
  collectionId: string;
}

export interface ServerSmartCollection {
  id: string;
  title: string;
  description: string;
  type: 'PERSONALIZED' | 'POPULAR' | 'TRENDING' | 'FRESH' | 'CONTEXTUAL' | 'EDITORIAL';
  source: 'RECOMMENDATION' | 'RANKING' | 'SEARCH' | 'ANALYTICS' | 'EDITORIAL';
  placement: 'HOME' | 'SEARCH' | 'APP_DETAIL' | 'CATEGORY';
  algorithmVersion: string;
  items: ServerCollectionAppItem[];
  maxItems: number;
  enabled: boolean;
  priority: number;
  state: 'DRAFT' | 'VALIDATING' | 'GENERATING' | 'READY' | 'PUBLISHED' | 'STALE' | 'REGENERATING' | 'FAILED' | 'DISABLED' | 'ARCHIVED';
  generatedAt: string;
  expiresAt: string;
  sourceVersion: string;
  diversityRules: ServerDiversityRules;
  editorialAppIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export class ServerCollectionGenerator {
  static async generate(
    config: Partial<ServerSmartCollection>,
    context?: { query?: string; targetAppId?: string }
  ): Promise<ServerSmartCollection> {
    const colId = config.id || `sc_${Date.now()}`;
    const type = config.type || 'POPULAR';
    const limit = config.maxItems || 8;
    const diversity = config.diversityRules || { maxSameDeveloper: 2, maxSameCategory: 3 };

    // 1. Fetch published apps
    const publishedResult = await AppRepository.findPublished({ pageSize: 100 });
    const allPublished = publishedResult.data;

    // 2. Candidate generation & initial ranking
    let candidates: ScoredCandidate[] = [];

    if (type === 'POPULAR') {
      candidates = ServerCollectionRanking.rankByPopularity(allPublished);
    } else if (type === 'TRENDING') {
      candidates = ServerCollectionRanking.rankByTrending(allPublished);
    } else if (type === 'FRESH') {
      const isNew = config.id?.includes('new') || config.title?.toLowerCase().includes('baru ditambahkan');
      candidates = ServerCollectionRanking.rankByFreshness(allPublished, isNew);
    } else if (type === 'EDITORIAL') {
      const eIds = config.editorialAppIds || [];
      const matched = allPublished.filter(a => eIds.includes(a.id) || eIds.includes(a.slug));
      if (matched.length > 0) {
        candidates = matched.map((app, idx) => ({
          app,
          score: 1.0 - (idx * 0.05),
          badge: 'Pilihan Editor',
          reason: 'Kurasi langsung dari tim Aero'
        }));
      } else {
        candidates = ServerCollectionRanking.rankByPopularity(allPublished);
      }
    } else if (type === 'CONTEXTUAL' && context?.targetAppId) {
      const target = allPublished.find(a => a.id === context.targetAppId || a.slug === context.targetAppId);
      const sameCategory = allPublished.filter(a => a.id !== context.targetAppId && a.category === target?.category);
      candidates = ServerCollectionRanking.rankByPopularity(sameCategory.length > 0 ? sameCategory : allPublished);
    } else {
      candidates = ServerCollectionRanking.rankByPopularity(allPublished);
    }

    // 3. Eligibility filtering
    const eligible = candidates.filter(c => ServerCollectionEligibility.isAppEligible(c.app));

    // 4. Deduplication
    const seen = new Set<string>();
    const deduped: ScoredCandidate[] = [];
    for (const c of eligible) {
      if (!seen.has(c.app.id)) {
        seen.add(c.app.id);
        deduped.push(c);
      }
    }

    // 5. Diversity rules
    const diverse = ServerCollectionDiversity.applyDiversity(deduped, diversity, limit);

    // 6. Map to standardized items
    const items: ServerCollectionAppItem[] = diverse.map((c, idx) => ({
      appId: c.app.id,
      slug: c.app.slug,
      name: c.app.name,
      developerName: c.app.developerName,
      iconUrl: c.app.iconUrl,
      rating: c.app.rating || 4.5,
      ratingCount: c.app.reviewsCount || 100,
      downloadCount: c.app.downloads || 1000,
      downloadLabel: formatDownloads(c.app.downloads || 1000),
      versionName: c.app.versionName || '1.0.0',
      versionCode: c.app.versionCode || 1,
      apkSize: 35000000,
      apkSizeLabel: c.app.size || '35 MB',
      category: c.app.category,
      badge: c.badge ? { type: 'highlight', label: c.badge } : undefined,
      reason: c.reason ? { type: 'algorithmic', label: c.reason } : undefined,
      score: c.score,
      position: idx + 1,
      isPublished: true,
      securityStatus: 'passed',
      collectionId: colId
    }));

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      id: colId,
      title: config.title || 'Koleksi Aplikasi',
      description: config.description || 'Kumpulan aplikasi terbaik untuk Anda.',
      type,
      source: config.source || 'RANKING',
      placement: config.placement || 'HOME',
      algorithmVersion: '9.9.0',
      items,
      maxItems: limit,
      enabled: config.enabled ?? true,
      priority: config.priority ?? 1,
      state: 'PUBLISHED',
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      sourceVersion: '1.0',
      diversityRules: diversity,
      editorialAppIds: config.editorialAppIds,
      createdAt: config.createdAt || now.toISOString(),
      updatedAt: now.toISOString()
    };
  }
}

function formatDownloads(count: number): string {
  if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}M+ Unduhan`;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}Jt+ Unduhan`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}Rb+ Unduhan`;
  return `${count} Unduhan`;
}
