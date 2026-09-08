import { SearchIntent } from '../../src/types';
import { getAiFeatureFlags, AI_THRESHOLDS } from './config';

export function classifyQueryIntent(query: string): SearchIntent {
  const flags = getAiFeatureFlags();
  if (!flags.AI_DISCOVERY_ENABLED || !flags.AI_SEARCH_INTENT_ENABLED) {
    return {
      type: 'GENERAL_DISCOVERY',
      confidence: 0.5
    };
  }

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { type: 'GENERAL_DISCOVERY', confidence: 1.0 };
  }

  // 1. Similar App Intent: e.g. "apps like capcut", "alternatif whatsapp"
  if (/^(apps like|aplikasi mirip|alternatif|similar to|mirip)\s+(.+)/i.test(trimmed)) {
    const match = trimmed.match(/^(apps like|aplikasi mirip|alternatif|similar to|mirip)\s+(.+)/i);
    return {
      type: 'SIMILAR_APP',
      confidence: 0.92,
      targetAppSlug: match ? match[2].trim().replace(/\s+/g, '-') : undefined
    };
  }

  // 2. Version Discovery Intent: e.g. "whatsapp latest", "capcut v2.5", "versi terbaru telegram"
  if (/(latest|terbaru|versi|v\d+|\d+\.\d+)/i.test(trimmed)) {
    return {
      type: 'VERSION_DISCOVERY',
      confidence: 0.88,
      versionName: 'latest'
    };
  }

  // 3. Recommendation Intent: e.g. "best video editor", "rekomendasi game android"
  if (/(best|top|rekomendasi|terbaik|pilihan|bagus)/i.test(trimmed)) {
    return {
      type: 'RECOMMENDATION',
      confidence: 0.89
    };
  }

  // 4. Category Discovery Intent: e.g. "video editor", "social media", "tools", "games"
  const categories = [
    'tools', 'utilitas', 'social', 'sosial', 'communication', 'komunikasi', 
    'productivity', 'produktivitas', 'photography', 'fotografi', 'video', 
    'entertainment', 'hiburan', 'finance', 'keuangan', 'games', 'game'
  ];
  if (categories.some(cat => trimmed.includes(cat))) {
    const matchedCategory = categories.find(cat => trimmed.includes(cat));
    return {
      type: 'CATEGORY_DISCOVERY',
      confidence: 0.85,
      categoryName: matchedCategory
    };
  }

  // 5. Use Case Discovery Intent: e.g. "apps for editing reels", "edit foto estetik"
  if (/(for|untuk|cara|edit|buat|bikin|download|unduh)\s+(.+)/i.test(trimmed)) {
    return {
      type: 'USE_CASE_DISCOVERY',
      confidence: 0.80,
      useCaseKeywords: trimmed.split(/\s+/)
    };
  }

  // 6. Specific App Lookup: single word or brand name (e.g. "whatsapp", "capcut", "canva")
  if (trimmed.split(/\s+/).length <= 2) {
    return {
      type: 'APP_LOOKUP',
      confidence: 0.90,
      entityName: trimmed
    };
  }

  return {
    type: 'GENERAL_DISCOVERY',
    confidence: 0.70
  };
}
