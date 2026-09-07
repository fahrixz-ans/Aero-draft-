import { AppData } from '../../../types';
import {
  SmartCollection,
  SmartCollectionAppItem,
  CollectionType,
  CollectionPlacement,
  CollectionState,
  CollectionGenerationResult,
  canTransitionCollectionState
} from '../types/smartCollections';
import { isAppEligibleForCollection } from '../utils/collectionEligibility';
import { deduplicateCollectionItems } from '../utils/collectionDeduplication';
import { applyDiversityRules } from '../utils/collectionDiversity';
import { mapAppToCollectionItem, getCatalogFallbackItems } from '../utils/collectionFallback';

// Integration with Existing Engines (Stage 9.2, 9.3, 9.4, 9.5)
import { getTrendingRankings } from '../../../services/ranking/trendingEngine';
import { getNewAndRisingApps } from '../../../services/ranking/newAndRisingEngine';
import { getIntelligentRelatedApps } from '../../../services/recommendations/contentSimilarity';
import {
  getSearchHistory,
  getRecentlyViewed,
  getSavedApps,
  getFollowedCategories
} from '../../../services/userService';

// Firestore integration for persistence
import { db } from '../../../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

const ALGORITHM_VERSION = '9.9.0';
const DEFAULT_TTL_HOURS = 24;

export interface GenerateCollectionOptions {
  user?: any;
  userId?: string | null;
  sessionId?: string;
  contextApp?: AppData | null;
  searchQuery?: string;
  category?: string;
  maxItems?: number;
  userInteractions?: {
    downloadedAppIds?: string[];
    viewedAppIds?: string[];
    searchedQueries?: string[];
  };
}

/**
 * Executes the full Smart Collection Generation Pipeline:
 * Data Sources -> Candidates -> Eligibility -> Ranking -> Deduplication -> Diversity -> Contract
 */
export function generateSmartCollection(
  template: Partial<SmartCollection>,
  allApps: AppData[],
  options?: GenerateCollectionOptions
): CollectionGenerationResult {
  const startTime = Date.now();
  const collectionId = template.id || `sc_${Date.now()}`;
  const maxItems = template.maxItems || 8;
  const placement = template.placement || 'HOME';
  const type = template.type || 'POPULAR';

  let rawCandidates: { app: AppData; score?: number; badge?: string; reason?: string }[] = [];

  // ----------------------------------------------------
  // STEP 1: CANDIDATE GENERATION (FROM RELEVANT ENGINE)
  // ----------------------------------------------------
  if (type === 'PERSONALIZED') {
    // Stage 9.3 Personalization Engine
    const userPrefs = options?.userInteractions?.searchedQueries || [];
    const viewedIds = new Set(options?.userInteractions?.viewedAppIds || []);
    const downloadedIds = new Set(options?.userInteractions?.downloadedAppIds || []);

    const scored = allApps.map(app => {
      let score = (app.rating || 4.0) * 10;
      let reason = 'Rekomendasi pilihan berdasarkan katalog';
      if (viewedIds.has(app.id)) {
        score += 25;
        reason = 'Berdasarkan aplikasi yang baru Anda lihat';
      }
      if (downloadedIds.has(app.id)) {
        score += 15;
        reason = 'Terkait aplikasi terinstal Anda';
      }
      if (app.category && userPrefs.some(q => app.category.toLowerCase().includes(q.toLowerCase()))) {
        score += 30;
        reason = `Sesuai minat pencarian Anda di kategori ${app.category}`;
      }
      if (app.downloads && app.downloads > 100000) {
        score += 10;
      }
      return {
        app,
        score: Math.min(1.0, score / 100),
        badge: 'Untuk Anda',
        reason
      };
    }).sort((a, b) => b.score - a.score);

    rawCandidates = scored.slice(0, 16);
  } else if (type === 'POPULAR') {
    // Popularity candidates by total downloads, rating and satisfaction
    const sorted = [...allApps].sort((a, b) => {
      const scoreA = (a.downloads || 0) * 0.7 + (a.rating || 0) * 50000;
      const scoreB = (b.downloads || 0) * 0.7 + (b.rating || 0) * 50000;
      return scoreB - scoreA;
    });
    rawCandidates = sorted.slice(0, 16).map((app, idx) => ({
      app,
      score: 0.95 - (idx * 0.03),
      badge: 'Populer',
      reason: `${app.downloads ? (app.downloads >= 1000000 ? `${(app.downloads/1000000).toFixed(0)}Jt+ Unduhan` : `${(app.downloads/1000).toFixed(0)}Rb+ Unduhan`) : 'Pilihan Pengguna'} ★ ${(app.rating || 4.5).toFixed(1)}`
    }));
  } else if (type === 'TRENDING') {
    // Stage 9.4 Trending Engine
    const trending = getTrendingRankings(allApps, '7d', 16);
    rawCandidates = trending.map((t) => ({
      app: t.app,
      score: (t.score || 50) / 100,
      badge: 'Tren Minggu Ini',
      reason: t.reasons?.[0] || `Peringkat #${t.rank} di tangga aplikasi populer`
    }));
  } else if (type === 'FRESH') {
    // Freshness: Check if newly added or recently updated
    const isNew = template.id?.includes('new') || template.title?.toLowerCase().includes('baru ditambahkan');
    const sorted = [...allApps].sort((a, b) => {
      const dateA = new Date(isNew ? (a.releaseDate || a.createdAt || 0) : (a.updatedAt || 0)).getTime();
      const dateB = new Date(isNew ? (b.releaseDate || b.createdAt || 0) : (b.updatedAt || 0)).getTime();
      return dateB - dateA;
    });
    rawCandidates = sorted.slice(0, 16).map((app, idx) => ({
      app,
      score: 0.9 - (idx * 0.02),
      badge: isNew ? 'Rilis Terbaru' : 'Versi Baru',
      reason: isNew 
        ? `Tersedia sejak ${app.releaseDate || 'baru saja'}`
        : `Pembaruan terkini v${app.version || '1.0'}`
    }));
  } else if (type === 'CONTEXTUAL') {
    if (options?.contextApp) {
      // Related apps for App Detail page (Stage 9.3 Content Similarity)
      const related = getIntelligentRelatedApps(options.contextApp, allApps, 16);
      rawCandidates = related.map((r) => ({
        app: r.app,
        score: r.similarityScore / 100,
        badge: 'Serupa',
        reason: r.reason || `Serupa dengan ${options.contextApp?.name}`
      }));
    } else if (options?.searchQuery) {
      // Related apps for Search results (matching category/query affinity)
      const q = options.searchQuery.toLowerCase();
      const matched = allApps.filter(a => 
        a.category.toLowerCase().includes(q) || 
        a.name.toLowerCase().includes(q) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
      );
      const candidates = matched.length > 0 ? matched : allApps;
      rawCandidates = candidates.slice(0, 16).map((app, idx) => ({
        app,
        score: 0.85 - (idx * 0.02),
        badge: 'Relevan',
        reason: `Relevan dengan pencarian "${options.searchQuery}"`
      }));
    } else {
      rawCandidates = allApps.slice(0, 16).map(app => ({ app }));
    }
  } else if (type === 'EDITORIAL') {
    // Editorial picks configured by admin
    const editorialIds = template.editorialAppIds || [];
    const matchedApps: AppData[] = [];
    for (const eid of editorialIds) {
      const found = allApps.find(a => a.id === eid || a.slug === eid);
      if (found) matchedApps.push(found);
    }
    // If no apps configured yet, fallback to top rated editor picks
    if (matchedApps.length === 0) {
      const topRated = [...allApps]
        .filter(a => (a.rating || 0) >= 4.3)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 16);
      rawCandidates = topRated.map((app, idx) => ({
        app,
        score: 0.95 - (idx * 0.03),
        badge: 'Pilihan Editor',
        reason: `Rating luar biasa ★ ${(app.rating || 4.5).toFixed(1)} & lolos uji kurasi`
      }));
    } else {
      rawCandidates = matchedApps.map((app, idx) => ({
        app,
        score: 1.0 - (idx * 0.02),
        badge: 'Pilihan Tim Aero',
        reason: 'Dikurasi langsung oleh kurator Aero'
      }));
    }
  }

  const candidatesCount = rawCandidates.length;

  // ----------------------------------------------------
  // STEP 2: ELIGIBILITY FILTER (Stage 9.6 + 9.7 + 9.8)
  // ----------------------------------------------------
  const eligibleCandidates = rawCandidates.filter(c => isAppEligibleForCollection(c.app));
  const eligibleCount = eligibleCandidates.length;

  // If no candidates eligible, use catalog fallback (Section 21)
  let workingCandidates = eligibleCandidates;
  if (workingCandidates.length === 0) {
    const fallbackApps = allApps.filter(isAppEligibleForCollection);
    workingCandidates = fallbackApps.slice(0, 12).map((app, idx) => ({
      app,
      score: 0.7 - (idx * 0.03),
      badge: 'Rekomendasi',
      reason: 'Aplikasi terverifikasi aman'
    }));
  }

  // ----------------------------------------------------
  // STEP 3: MAPPING TO STANDARDIZED APPS CONTRACT
  // ----------------------------------------------------
  const mappedItems: SmartCollectionAppItem[] = workingCandidates.map((c, index) => 
    mapAppToCollectionItem(c.app, collectionId, index + 1, {
      score: c.score,
      badgeLabel: c.badge,
      reasonLabel: c.reason
    })
  );

  // ----------------------------------------------------
  // STEP 4: DEDUPLICATION (Section 12: exactly 0 duplicates)
  // ----------------------------------------------------
  const dedupedItems = deduplicateCollectionItems(mappedItems);
  const dedupedCount = dedupedItems.length;

  // ----------------------------------------------------
  // STEP 5: DIVERSITY (Section 13: developer & category limits)
  // ----------------------------------------------------
  const diverseItems = applyDiversityRules(
    dedupedItems,
    template.diversityRules || { maxSameDeveloper: 2, maxSameCategory: 3 },
    maxItems
  );

  const now = new Date();
  const expires = new Date(now.getTime() + DEFAULT_TTL_HOURS * 60 * 60 * 1000);

  const finalCollection: SmartCollection = {
    id: collectionId,
    title: template.title || 'Koleksi Aplikasi',
    description: template.description || 'Kumpulan aplikasi terbaik untuk perangkat Android Anda.',
    type,
    source: template.source || (type === 'PERSONALIZED' ? 'RECOMMENDATION' : type === 'TRENDING' ? 'RANKING' : type === 'EDITORIAL' ? 'EDITORIAL' : 'ANALYTICS'),
    placement,
    algorithmVersion: ALGORITHM_VERSION,
    items: diverseItems,
    maxItems,
    enabled: template.enabled ?? true,
    priority: template.priority ?? 1,
    state: 'PUBLISHED',
    generatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    sourceVersion: '1.0',
    diversityRules: template.diversityRules || { maxSameDeveloper: 2, maxSameCategory: 3 },
    editorialAppIds: template.editorialAppIds,
    contextAppId: options?.contextApp?.id,
    contextQuery: options?.searchQuery,
    createdAt: template.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: template.createdBy || 'system',
    updatedBy: 'system'
  };

  const durationMs = Date.now() - startTime;

  return {
    collection: finalCollection,
    candidatesCount,
    eligibleCount,
    dedupedCount,
    finalCount: diverseItems.length,
    durationMs
  };
}

/**
 * Standard Home Shelves presets (Section 5 & 31)
 */
export const DEFAULT_HOME_COLLECTIONS_CONFIG: Partial<SmartCollection>[] = [
  {
    id: 'sc_home_personalized',
    title: 'Direkomendasikan Untuk Anda',
    description: 'Rekomendasi terpersonalisasi berdasarkan interaksi, riwayat pencarian, dan preferensi aplikasi Anda.',
    type: 'PERSONALIZED',
    source: 'RECOMMENDATION',
    placement: 'HOME',
    priority: 1,
    enabled: true,
    maxItems: 8
  },
  {
    id: 'sc_home_trending',
    title: 'Trending Sekarang',
    description: 'Aplikasi dengan lonjakan unduhan dan pencarian tertinggi dalam minggu ini.',
    type: 'TRENDING',
    source: 'RANKING',
    placement: 'HOME',
    priority: 2,
    enabled: true,
    maxItems: 8
  },
  {
    id: 'sc_home_popular',
    title: 'Populer Sekarang',
    description: 'Aplikasi terfavorit dengan reputasi ulasan dan total unduhan tertinggi di Aero.',
    type: 'POPULAR',
    source: 'ANALYTICS',
    placement: 'HOME',
    priority: 3,
    enabled: true,
    maxItems: 8
  },
  {
    id: 'sc_home_editors_pick',
    title: 'Pilihan Editor',
    description: 'Koleksi kurasi eksklusif dengan verifikasi ketat dan integrasi performa optimal.',
    type: 'EDITORIAL',
    source: 'EDITORIAL',
    placement: 'HOME',
    priority: 4,
    enabled: true,
    maxItems: 8
  },
  {
    id: 'sc_home_new_releases',
    title: 'Baru Ditambahkan',
    description: 'Aplikasi terbaru yang baru dirilis dan terdaftar di direktori resmi.',
    type: 'FRESH',
    source: 'ANALYTICS',
    placement: 'HOME',
    priority: 5,
    enabled: true,
    maxItems: 8
  },
  {
    id: 'sc_home_recently_updated',
    title: 'Baru Diperbarui',
    description: 'Versi mutakhir dengan pembaruan stabilitas, fitur terkini, dan tambalan keamanan.',
    type: 'FRESH',
    source: 'ANALYTICS',
    placement: 'HOME',
    priority: 6,
    enabled: true,
    maxItems: 8
  }
];

/**
 * Generates all Home collections using the pipeline
 */
export function generateAllHomeCollections(
  allApps: AppData[],
  options?: GenerateCollectionOptions,
  customConfigs?: SmartCollection[]
): SmartCollection[] {
  const configsToUse = (customConfigs && customConfigs.length > 0)
    ? customConfigs.filter(c => c.enabled && c.placement === 'HOME')
    : DEFAULT_HOME_COLLECTIONS_CONFIG;

  const results: SmartCollection[] = [];

  for (const conf of configsToUse) {
    try {
      const res = generateSmartCollection(conf, allApps, options);
      if (res.collection.items.length > 0) {
        results.push(res.collection);
      }
    } catch (err) {
      console.error(`Error generating smart collection ${conf.id}:`, err);
    }
  }

  // Sort by priority
  results.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  return results;
}

/**
 * Generates Contextual Shelves for Search Results (Section 6)
 * - "Aplikasi Serupa"
 * - "Pengguna Juga Melihat"
 * - "Lebih Banyak Pilihan"
 */
export function generateSearchContextualCollections(
  query: string,
  allApps: AppData[],
  options?: GenerateCollectionOptions
): SmartCollection[] {
  if (!query || query.trim() === '') return [];

  const results: SmartCollection[] = [];

  // 1. Similar Apps
  const similar = generateSmartCollection({
    id: `sc_search_similar_${encodeURIComponent(query)}`,
    title: 'Aplikasi Serupa',
    description: `Aplikasi dalam kategori serupa dengan pencarian "${query}".`,
    type: 'CONTEXTUAL',
    source: 'SEARCH',
    placement: 'SEARCH',
    priority: 1,
    enabled: true,
    maxItems: 6
  }, allApps, { ...options, searchQuery: query });

  if (similar.collection.items.length > 0) {
    results.push(similar.collection);
  }

  // 2. Users Also Viewed
  const usersAlsoViewed = generateSmartCollection({
    id: `sc_search_users_viewed_${encodeURIComponent(query)}`,
    title: 'Pengguna Juga Melihat',
    description: `Aplikasi populer yang sering dieksplorasi bersamaan.`,
    type: 'POPULAR',
    source: 'ANALYTICS',
    placement: 'SEARCH',
    priority: 2,
    enabled: true,
    maxItems: 6
  }, allApps, options);

  if (usersAlsoViewed.collection.items.length > 0) {
    results.push(usersAlsoViewed.collection);
  }

  return results;
}

/**
 * Generates Contextual Shelves for App Detail (Section 7)
 * - "Aplikasi Serupa"
 * - "Pengguna Juga Melihat"
 */
export function generateAppDetailCollections(
  targetApp: AppData,
  allApps: AppData[],
  options?: GenerateCollectionOptions
): SmartCollection[] {
  if (!targetApp) return [];

  const results: SmartCollection[] = [];

  // 1. Similar Apps (Stage 9.3 Content Similarity)
  const similar = generateSmartCollection({
    id: `sc_detail_similar_${targetApp.id}`,
    title: 'Aplikasi Serupa',
    description: `Aplikasi alternatif dan terkait dengan fungsi ${targetApp.name}.`,
    type: 'CONTEXTUAL',
    source: 'RECOMMENDATION',
    placement: 'APP_DETAIL',
    priority: 1,
    enabled: true,
    maxItems: 6
  }, allApps, { ...options, contextApp: targetApp });

  if (similar.collection.items.length > 0) {
    results.push(similar.collection);
  }

  // 2. Users Also Viewed
  const usersAlsoViewed = generateSmartCollection({
    id: `sc_detail_users_viewed_${targetApp.id}`,
    title: 'Pengguna Juga Melihat',
    description: `Aplikasi populer pilihan komunitas di kategori ${targetApp.category}.`,
    type: 'POPULAR',
    source: 'ANALYTICS',
    placement: 'APP_DETAIL',
    priority: 2,
    enabled: true,
    maxItems: 6
  }, allApps, options);

  if (usersAlsoViewed.collection.items.length > 0) {
    results.push(usersAlsoViewed.collection);
  }

  return results;
}

// ----------------------------------------------------
// FIRESTORE SYNC & ADMIN PERSISTENCE OPERATIONS
// ----------------------------------------------------

/**
 * Fetches all smart collections from Firestore
 */
export async function fetchFirestoreSmartCollections(): Promise<SmartCollection[]> {
  try {
    const colRef = collection(db, 'smartCollections');
    const q = query(colRef, orderBy('priority', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: SmartCollection[] = [];
    snapshot.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() } as SmartCollection);
    });

    return list;
  } catch (err) {
    console.warn('Firestore smart collections fetch warning:', err);
    return [];
  }
}

/**
 * Saves a SmartCollection to Firestore
 */
export async function saveFirestoreSmartCollection(colData: SmartCollection): Promise<void> {
  const docRef = doc(db, 'smartCollections', colData.id);
  await setDoc(docRef, {
    ...colData,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Transitions collection state with validation
 */
export async function transitionCollectionState(
  colData: SmartCollection,
  nextState: CollectionState
): Promise<SmartCollection> {
  if (!canTransitionCollectionState(colData.state, nextState)) {
    throw new Error(`Transisi tidak valid dari ${colData.state} ke ${nextState}`);
  }

  const updated: SmartCollection = {
    ...colData,
    state: nextState,
    enabled: nextState === 'PUBLISHED' ? true : (nextState === 'DISABLED' ? false : colData.enabled),
    updatedAt: new Date().toISOString()
  };

  await saveFirestoreSmartCollection(updated);
  return updated;
}

/**
 * Deletes or archives a SmartCollection in Firestore
 */
export async function deleteFirestoreSmartCollection(id: string): Promise<void> {
  const docRef = doc(db, 'smartCollections', id);
  await deleteDoc(docRef);
}

/**
 * Unified SmartCollectionsService providing convenience methods for UI components and Admin Panel.
 */
export const SmartCollectionsService = {
  fetchSmartCollections: async (): Promise<SmartCollection[]> => {
    try {
      const res = await fetch('/api/admin/collections');
      if (res.ok) {
        const data = await res.json();
        if (data.collections && Array.isArray(data.collections) && data.collections.length > 0) {
          return data.collections;
        }
      }
    } catch {
      // fallback
    }
    return fetchFirestoreSmartCollections();
  },
  generateHomeShelves: async (apps: AppData[], options?: GenerateCollectionOptions): Promise<SmartCollection[]> => {
    return generateAllHomeCollections(apps, options);
  },
  generateCollection: async (
    template: Partial<SmartCollection>,
    apps: AppData[],
    options?: GenerateCollectionOptions
  ): Promise<SmartCollection> => {
    const res = generateSmartCollection(template, apps, options);
    return res.collection;
  },
  saveSmartCollection: async (col: SmartCollection): Promise<void> => {
    try {
      await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(col)
      });
    } catch {
      // fallback
    }
    return saveFirestoreSmartCollection(col);
  },
  deleteSmartCollection: async (id: string): Promise<void> => {
    try {
      await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' });
    } catch {
      // fallback
    }
    return deleteFirestoreSmartCollection(id);
  }
};
