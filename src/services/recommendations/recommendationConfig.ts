import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { RecommendationConfig } from './recommendationTypes';

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  factors: {
    similarity: 0.25,
    interest: 0.30,
    popularity: 0.15,
    freshness: 0.10,
    quality: 0.10,
    trending: 0.10
  },
  behaviorWeights: {
    view: 1.0,
    search: 2.0,
    officialClick: 3.0,
    save: 4.0,
    share: 4.0,
    download: 5.0,
    feedbackPositive: 3.0,
    feedbackNegative: -5.0
  },
  timeDecayHalfLifeDays: 14,
  diversity: {
    primary: 70,
    adjacent: 20,
    discovery: 10
  },
  minimumConfidenceThreshold: 15,
  excludedAppIds: [],
  pinnedAppIds: {
    forYou: [],
    youMightLike: [],
    similarApps: [],
    newAndRising: [],
    trending: [],
    editorPicks: []
  },
  shelves: {
    forYou: {
      id: 'forYou',
      title: 'Untuk Anda',
      subtitle: 'Rekomendasi yang dipersonalisasi berdasarkan minat dan aktivitas eksplorasi Anda',
      enabled: true,
      limit: 8,
      showExplanationBadge: true,
      allowDismiss: true
    },
    youMightLike: {
      id: 'youMightLike',
      title: 'Mungkin Anda Suka',
      subtitle: 'Aplikasi pilihan relevan dengan kombinasi kategori dan penemuan baru',
      enabled: true,
      limit: 8,
      showExplanationBadge: true,
      allowDismiss: true
    },
    similarApps: {
      id: 'similarApps',
      title: 'Aplikasi Serupa Terkait',
      subtitle: 'Aplikasi dengan fungsi, kecocokan kategori, dan fitur yang relevan',
      enabled: true,
      limit: 6,
      showExplanationBadge: true,
      allowDismiss: false
    },
    newAndRising: {
      id: 'newAndRising',
      title: 'Aplikasi Naik Daun',
      subtitle: 'Rilis terbaru dengan pertumbuhan unduhan dan kualitas tinggi',
      enabled: true,
      limit: 8,
      showExplanationBadge: true,
      allowDismiss: false
    },
    trending: {
      id: 'trending',
      title: 'Sedang Tren',
      subtitle: 'Paling banyak dilihat dan diakses oleh komunitas Aero minggu ini',
      enabled: true,
      limit: 8,
      showExplanationBadge: true,
      allowDismiss: false
    },
    editorPicks: {
      id: 'editorPicks',
      title: 'Pilihan Editor',
      subtitle: 'Kurasi aplikasi terbaik dengan standar kualitas dan keamanan unggul',
      enabled: true,
      limit: 8,
      showExplanationBadge: true,
      allowDismiss: false
    }
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

const LOCAL_STORAGE_KEY = 'aero_recommendation_config_v1';
let memoryConfigCache: RecommendationConfig | null = null;

export async function getRecommendationConfig(): Promise<RecommendationConfig> {
  if (memoryConfigCache) {
    return memoryConfigCache;
  }

  // 1. Try LocalStorage for ultra-fast instant startup
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      memoryConfigCache = { ...DEFAULT_RECOMMENDATION_CONFIG, ...parsed };
    }
  } catch {
    // Ignore storage parse error
  }

  // 2. Fetch from Firestore asynchronously without blocking
  try {
    const docRef = doc(db, 'recommendationConfigs', 'global');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const remoteData = snapshot.data() as Partial<RecommendationConfig>;
      memoryConfigCache = {
        ...DEFAULT_RECOMMENDATION_CONFIG,
        ...remoteData,
        factors: { ...DEFAULT_RECOMMENDATION_CONFIG.factors, ...remoteData.factors },
        behaviorWeights: { ...DEFAULT_RECOMMENDATION_CONFIG.behaviorWeights, ...remoteData.behaviorWeights },
        diversity: { ...DEFAULT_RECOMMENDATION_CONFIG.diversity, ...remoteData.diversity },
        shelves: { ...DEFAULT_RECOMMENDATION_CONFIG.shelves, ...remoteData.shelves },
        pinnedAppIds: { ...DEFAULT_RECOMMENDATION_CONFIG.pinnedAppIds, ...remoteData.pinnedAppIds }
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memoryConfigCache));
      } catch {
        // quota exceeded
      }
      return memoryConfigCache;
    }
  } catch (err) {
    console.warn('[RecommendationConfig] Could not sync with Firestore:', err);
  }

  if (!memoryConfigCache) {
    memoryConfigCache = { ...DEFAULT_RECOMMENDATION_CONFIG };
  }
  return memoryConfigCache;
}

export async function saveRecommendationConfig(
  newConfig: Partial<RecommendationConfig>,
  adminEmail: string = 'admin@aeroapk.com'
): Promise<RecommendationConfig> {
  const current = await getRecommendationConfig();
  const updated: RecommendationConfig = {
    ...current,
    ...newConfig,
    factors: { ...current.factors, ...newConfig.factors },
    behaviorWeights: { ...current.behaviorWeights, ...newConfig.behaviorWeights },
    diversity: { ...current.diversity, ...newConfig.diversity },
    shelves: { ...current.shelves, ...newConfig.shelves },
    pinnedAppIds: { ...current.pinnedAppIds, ...newConfig.pinnedAppIds },
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail
  };

  memoryConfigCache = updated;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  try {
    const docRef = doc(db, 'recommendationConfigs', 'global');
    await setDoc(docRef, updated, { merge: true });
  } catch (err) {
    console.error('[RecommendationConfig] Failed to save config to Firestore:', err);
  }

  return updated;
}

export async function resetRecommendationConfigToDefaults(
  adminEmail: string = 'admin@aeroapk.com'
): Promise<RecommendationConfig> {
  const resetConfig: RecommendationConfig = {
    ...DEFAULT_RECOMMENDATION_CONFIG,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail
  };

  memoryConfigCache = resetConfig;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resetConfig));
  } catch {
    // ignore
  }

  try {
    const docRef = doc(db, 'recommendationConfigs', 'global');
    await setDoc(docRef, resetConfig);
  } catch (err) {
    console.error('[RecommendationConfig] Failed to reset config in Firestore:', err);
  }

  return resetConfig;
}
