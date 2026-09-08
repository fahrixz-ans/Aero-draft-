import { AppData } from '../../src/types';
import { normalizeAppData } from '../seo/metadata';
import { expandQueryTerms, normalizeQuery } from './queryUnderstanding';
import { getAiFeatureFlags } from './config';

export interface SemanticScoreResult {
  appId: string;
  relevanceScore: number; // 0.0 - 1.0
  reasons: string[];
}

export function scoreSemanticRelevance(query: string, rawApps: any[]): SemanticScoreResult[] {
  const flags = getAiFeatureFlags();
  const normalizedQuery = normalizeQuery(query);
  const terms = flags.AI_QUERY_EXPANSION_ENABLED ? expandQueryTerms(query) : [normalizedQuery];

  return rawApps.map(rawApp => {
    const app = normalizeAppData(rawApp);
    let score = 0;
    const reasons: string[] = [];

    const appNameLower = app.name.toLowerCase();
    const appDescLower = app.description.toLowerCase();
    const appCategoryLower = app.category.toLowerCase();
    const appDevLower = app.developer.toLowerCase();

    // 1. Direct Title Match (highest weight)
    if (terms.some(t => appNameLower.includes(t))) {
      score += 0.50;
      reasons.push('Judul aplikasi cocok dengan pencarian');
    }

    // 2. Exact Brand / Package Name Match
    if (appNameLower === normalizedQuery || app.slug === normalizedQuery) {
      score += 0.35;
      reasons.push('Pencarian persis nama merek / slug aplikasi');
    }

    // 3. Category Match
    if (terms.some(t => appCategoryLower.includes(t))) {
      score += 0.20;
      reasons.push(`Kategori '${app.category}' sesuai konteks pencarian`);
    }

    // 4. Developer Match
    if (terms.some(t => appDevLower.includes(t))) {
      score += 0.15;
      reasons.push(`Pengembang '${app.developer}' cocok`);
    }

    // 5. Description / Feature Match
    if (terms.some(t => appDescLower.includes(t))) {
      score += 0.10;
      reasons.push('Fitur / deskripsi aplikasi relevan');
    }

    // Normalize final score to 0.0 - 1.0
    const finalScore = Math.min(1.0, score);

    return {
      appId: app.id,
      relevanceScore: finalScore,
      reasons
    };
  });
}
