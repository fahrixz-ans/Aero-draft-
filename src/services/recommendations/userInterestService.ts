import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppData } from '../../types';
import { 
  UserInterestProfile, 
  UserInteractionEvent, 
  UserInteractionType,
  RecommendationConfig 
} from './recommendationTypes';
import { getRecommendationConfig } from './recommendationConfig';

const LOCAL_STORAGE_PROFILE_PREFIX = 'aero_user_rec_profile_';
const ANONYMOUS_USER_KEY = 'guest_user';
const MAX_STORED_INTERACTIONS = 50;

// In-memory cache for ultra-responsive recommendation queries
const profileCache = new Map<string, { profile: UserInterestProfile; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export function getAnonymousUserId(): string {
  try {
    let id = localStorage.getItem('aero_guest_id');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('aero_guest_id', id);
    }
    return id;
  } catch {
    return ANONYMOUS_USER_KEY;
  }
}

export async function getUserInterestProfile(userId?: string): Promise<UserInterestProfile> {
  const targetId = userId || getAnonymousUserId();
  const now = Date.now();

  const cached = profileCache.get(targetId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.profile;
  }

  let profile: UserInterestProfile = {
    userId: targetId,
    isAnonymous: !userId || targetId.startsWith('guest_'),
    categoryAffinities: {},
    tagAffinities: {},
    recentInteractions: [],
    dislikedAppIds: [],
    preferredCategories: [],
    totalInteractionCount: 0,
    lastUpdated: now
  };

  // 1. Try LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_PREFIX + targetId);
    if (raw) {
      const parsed = JSON.parse(raw);
      profile = { ...profile, ...parsed };
    }
  } catch {
    // ignore
  }

  // 2. If user is authenticated, sync with Firestore
  if (userId && !targetId.startsWith('guest_')) {
    try {
      const docRef = doc(db, 'userRecommendationProfiles', targetId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const firestoreData = snapshot.data() as Partial<UserInterestProfile>;
        profile = {
          ...profile,
          ...firestoreData,
          categoryAffinities: { ...profile.categoryAffinities, ...firestoreData.categoryAffinities },
          tagAffinities: { ...profile.tagAffinities, ...firestoreData.tagAffinities },
          dislikedAppIds: Array.from(new Set([...(profile.dislikedAppIds || []), ...(firestoreData.dislikedAppIds || [])]))
        };
      }
    } catch (err) {
      console.warn('[UserInterestService] Firestore profile fetch failed:', err);
    }
  }

  // Recalculate decayed scores based on current timestamp
  const config = await getRecommendationConfig();
  profile = recalculateAffinitiesWithDecay(profile, config);

  profileCache.set(targetId, { profile, timestamp: now });
  return profile;
}

export async function trackUserInteraction(
  type: UserInteractionType,
  data: {
    app?: AppData;
    appId?: string;
    category?: string;
    tags?: string[];
    query?: string;
    metadata?: Record<string, any>;
  },
  userId?: string
): Promise<UserInterestProfile> {
  const targetId = userId || getAnonymousUserId();
  const profile = await getUserInterestProfile(targetId);
  const config = await getRecommendationConfig();

  const now = Date.now();
  const newEvent: UserInteractionEvent = {
    id: `ev_${now}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    appId: data.app?.id || data.appId,
    category: data.app?.category || data.category,
    tags: data.app?.tags || data.tags || (data.app?.keywords || []),
    query: data.query,
    timestamp: now,
    metadata: data.metadata
  };

  // If user indicated negative feedback or disliked app, record in dislikedAppIds
  if (type === 'feedback_negative' && newEvent.appId) {
    if (!profile.dislikedAppIds.includes(newEvent.appId)) {
      profile.dislikedAppIds.push(newEvent.appId);
    }
  }

  // Add event to interaction history
  profile.recentInteractions = [newEvent, ...(profile.recentInteractions || [])].slice(0, MAX_STORED_INTERACTIONS);
  profile.totalInteractionCount = (profile.totalInteractionCount || 0) + 1;
  profile.lastUpdated = now;

  // Recalculate affinities with fresh decay
  const updatedProfile = recalculateAffinitiesWithDecay(profile, config);

  // Update in-memory cache
  profileCache.set(targetId, { profile: updatedProfile, timestamp: now });

  // Persist locally
  try {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_PREFIX + targetId, JSON.stringify(updatedProfile));
  } catch {
    // ignore
  }

  // Persist to Firestore asynchronously (debounced/fire-and-forget)
  if (userId && !targetId.startsWith('guest_')) {
    try {
      const docRef = doc(db, 'userRecommendationProfiles', targetId);
      setDoc(docRef, updatedProfile, { merge: true }).catch(err => {
        console.warn('[UserInterestService] Failed to sync profile to Firestore:', err);
      });
    } catch {
      // ignore
    }
  }

  return updatedProfile;
}

export function recalculateAffinitiesWithDecay(
  profile: UserInterestProfile,
  config: RecommendationConfig
): UserInterestProfile {
  const categoryScores: Record<string, number> = {};
  const tagScores: Record<string, number> = {};
  const now = Date.now();
  const halfLifeMs = (config.timeDecayHalfLifeDays || 14) * 24 * 60 * 60 * 1000;

  for (const event of profile.recentInteractions || []) {
    const ageMs = Math.max(0, now - event.timestamp);
    // Exponential decay: score = baseWeight * (0.5 ^ (age / halfLife))
    const decayMultiplier = Math.pow(0.5, ageMs / halfLifeMs);

    let baseWeight = config.behaviorWeights.view;
    switch (event.type) {
      case 'search':
        baseWeight = config.behaviorWeights.search;
        break;
      case 'official_click':
        baseWeight = config.behaviorWeights.officialClick;
        break;
      case 'save':
        baseWeight = config.behaviorWeights.save;
        break;
      case 'unsave':
        baseWeight = -config.behaviorWeights.save * 0.5;
        break;
      case 'share':
        baseWeight = config.behaviorWeights.share;
        break;
      case 'download':
        baseWeight = config.behaviorWeights.download;
        break;
      case 'feedback_positive':
        baseWeight = config.behaviorWeights.feedbackPositive;
        break;
      case 'feedback_negative':
        baseWeight = config.behaviorWeights.feedbackNegative;
        break;
      case 'view':
      default:
        baseWeight = config.behaviorWeights.view;
        break;
    }

    const effectiveScore = baseWeight * decayMultiplier;

    // Track category affinity
    if (event.category) {
      const catKey = event.category.trim();
      if (catKey) {
        categoryScores[catKey] = (categoryScores[catKey] || 0) + effectiveScore;
      }
    }

    // Track search query signals (Stage 9.2 Search Intelligence integration)
    if (event.type === 'search' && event.query) {
      const tokens = event.query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      tokens.forEach(tok => {
        tagScores[tok] = (tagScores[tok] || 0) + effectiveScore * 0.5;
      });
    }

    // Track tags and keywords
    if (event.tags && Array.isArray(event.tags)) {
      for (const tag of event.tags) {
        const cleanedTag = tag.trim().toLowerCase();
        if (cleanedTag && cleanedTag.length > 1) {
          tagScores[cleanedTag] = (tagScores[cleanedTag] || 0) + effectiveScore * 0.4;
        }
      }
    }
  }

  // Determine top preferred categories
  const sortedCategories = Object.entries(categoryScores)
    .filter(([_, score]) => score > 0.5)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  return {
    ...profile,
    categoryAffinities: categoryScores,
    tagAffinities: tagScores,
    preferredCategories: sortedCategories
  };
}

export async function clearUserInterestProfile(userId?: string): Promise<void> {
  const targetId = userId || getAnonymousUserId();
  profileCache.delete(targetId);

  try {
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_PREFIX + targetId);
  } catch {
    // ignore
  }

  if (userId && !targetId.startsWith('guest_')) {
    try {
      const docRef = doc(db, 'userRecommendationProfiles', targetId);
      await setDoc(docRef, {
        userId: targetId,
        categoryAffinities: {},
        tagAffinities: {},
        recentInteractions: [],
        dislikedAppIds: [],
        preferredCategories: [],
        totalInteractionCount: 0,
        lastUpdated: Date.now()
      });
    } catch {
      // ignore
    }
  }
}
