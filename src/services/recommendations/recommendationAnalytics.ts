import { collection, addDoc, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppData } from '../../types';
import { 
  RecommendationAnalyticsEvent, 
  RecommendationAnalyticsEventType,
  RecommendationPerformanceSummary,
  ShelfPerformanceMetric,
  AppRecommendationMetric,
  RecommendationFallbackLevel
} from './recommendationTypes';

const LOCAL_EVENTS_KEY = 'aero_rec_analytics_events_v1';
const MAX_LOCAL_EVENTS = 200;

// In-memory real-time performance cache for instantaneous retrieval
let performanceCache: RecommendationPerformanceSummary | null = null;
let lastCacheTime = 0;

export async function trackRecommendationEvent(
  eventType: RecommendationAnalyticsEventType,
  data: {
    shelfId: string;
    appId: string;
    userId?: string;
    score?: number;
    position?: number;
    fallbackLevel?: RecommendationFallbackLevel;
  }
): Promise<void> {
  const now = Date.now();
  const event: RecommendationAnalyticsEvent = {
    id: `recev_${now}_${Math.random().toString(36).substring(2, 7)}`,
    eventType,
    shelfId: data.shelfId,
    appId: data.appId,
    userId: data.userId,
    score: data.score,
    position: data.position ?? 0,
    fallbackLevel: data.fallbackLevel,
    timestamp: now
  };

  // 1. Store in LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    const existing: RecommendationAnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    const updated = [event, ...existing].slice(0, MAX_LOCAL_EVENTS);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // 2. Invalidate cache on new interaction events
  if (eventType !== 'impression') {
    performanceCache = null;
  }

  // 3. Persist to Firestore asynchronously (debounced/sampled)
  try {
    if (eventType !== 'impression' || Math.random() < 0.2) {
      addDoc(collection(db, 'recommendationEvents'), event).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export async function getRecommendationAnalyticsSummary(
  allApps: AppData[] = [],
  forceRefresh = false
): Promise<RecommendationPerformanceSummary> {
  const now = Date.now();
  if (!forceRefresh && performanceCache && now - lastCacheTime < 30 * 1000) {
    return performanceCache;
  }

  // Load events from LocalStorage
  let events: RecommendationAnalyticsEvent[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    if (raw) {
      events = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  // Also query recent events from Firestore if available
  try {
    const q = query(collection(db, 'recommendationEvents'), orderBy('timestamp', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    const firestoreEvents: RecommendationAnalyticsEvent[] = [];
    snapshot.forEach(doc => {
      firestoreEvents.push({ ...doc.data() } as RecommendationAnalyticsEvent);
    });
    // Merge without duplicates
    const eventIds = new Set(events.map(e => e.id));
    firestoreEvents.forEach(e => {
      if (!eventIds.has(e.id)) {
        events.push(e);
        eventIds.add(e.id);
      }
    });
  } catch (err) {
    // Firestore events optional
  }

  // Aggregate stats
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;

  const shelfMap: Record<string, { impressions: number; clicks: number; conversions: number }> = {
    forYou: { impressions: 0, clicks: 0, conversions: 0 },
    youMightLike: { impressions: 0, clicks: 0, conversions: 0 },
    similarApps: { impressions: 0, clicks: 0, conversions: 0 },
    newAndRising: { impressions: 0, clicks: 0, conversions: 0 },
    trending: { impressions: 0, clicks: 0, conversions: 0 },
    editorPicks: { impressions: 0, clicks: 0, conversions: 0 }
  };

  const appStats: Record<string, { impressions: number; clicks: number; conversions: number }> = {};

  events.forEach(ev => {
    const sId = ev.shelfId || 'forYou';
    if (!shelfMap[sId]) {
      shelfMap[sId] = { impressions: 0, clicks: 0, conversions: 0 };
    }
    if (!appStats[ev.appId]) {
      appStats[ev.appId] = { impressions: 0, clicks: 0, conversions: 0 };
    }

    if (ev.eventType === 'impression') {
      totalImpressions++;
      shelfMap[sId].impressions++;
      appStats[ev.appId].impressions++;
    } else if (ev.eventType === 'click') {
      totalClicks++;
      shelfMap[sId].clicks++;
      appStats[ev.appId].clicks++;
    } else if (ev.eventType.startsWith('convert_')) {
      totalConversions++;
      shelfMap[sId].conversions++;
      appStats[ev.appId].conversions++;
    }
  });

  // Build shelf metrics
  const shelfNames: Record<string, string> = {
    forYou: 'Untuk Anda (Personalized)',
    youMightLike: 'Mungkin Anda Suka (Discovery)',
    similarApps: 'Aplikasi Serupa (Contextual)',
    newAndRising: 'Aplikasi Naik Daun',
    trending: 'Sedang Tren',
    editorPicks: 'Pilihan Editor'
  };

  const shelfMetrics: ShelfPerformanceMetric[] = Object.entries(shelfMap).map(([id, data]) => {
    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
    const convRate = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
    return {
      shelfId: id,
      shelfTitle: shelfNames[id] || id,
      impressions: data.impressions,
      clicks: data.clicks,
      conversions: data.conversions,
      ctr: parseFloat(ctr.toFixed(1)),
      conversionRate: parseFloat(convRate.toFixed(1))
    };
  });

  // App metrics mapping
  const appMetrics: AppRecommendationMetric[] = Object.entries(appStats).map(([appId, stats]) => {
    const foundApp = allApps.find(a => a.id === appId);
    const ctr = stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0;
    return {
      appId,
      appName: foundApp?.name || `App ${appId}`,
      iconUrl: foundApp?.iconUrl,
      category: foundApp?.category || 'Umum',
      impressions: stats.impressions,
      clicks: stats.clicks,
      conversions: stats.conversions,
      ctr: parseFloat(ctr.toFixed(1))
    };
  });

  const topRecommendedApps = [...appMetrics]
    .filter(a => a.impressions >= 1)
    .sort((a, b) => b.clicks - a.clicks || b.ctr - a.ctr)
    .slice(0, 5);

  const poorPerformingApps = [...appMetrics]
    .filter(a => a.impressions >= 3 && a.ctr < 5)
    .sort((a, b) => a.ctr - b.ctr)
    .slice(0, 5);

  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  const summary: RecommendationPerformanceSummary = {
    totalImpressions,
    totalClicks,
    totalConversions,
    overallCtr: parseFloat(overallCtr.toFixed(1)),
    overallConversionRate: parseFloat(overallConversionRate.toFixed(1)),
    shelfMetrics,
    topRecommendedApps,
    poorPerformingApps,
    period: '30d'
  };

  performanceCache = summary;
  lastCacheTime = now;
  return summary;
}
