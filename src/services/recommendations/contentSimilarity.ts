import { AppData } from '../../types';
import { computeAppQualityScore } from '../scoring/qualityScoring';

// Common stop-words in Indonesian and English to ignore during description keyword matching
const STOP_WORDS = new Set([
  'dan', 'atau', 'di', 'ke', 'dari', 'yang', 'ini', 'itu', 'untuk', 'pada', 'dengan', 
  'adalah', 'sebagai', 'oleh', 'serta', 'juga', 'akan', 'dapat', 'bisa', 'anda', 'kamu',
  'the', 'and', 'for', 'with', 'from', 'app', 'application', 'free', 'gratis', 'terbaik'
]);

/**
 * Extracts normalized keywords from application name, description, and permissions
 */
export function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
  return new Set(words);
}

/**
 * Calculates content similarity score between target application and a candidate application.
 * Returns a score between 0 and 100.
 */
export function calculateContentSimilarity(
  targetApp: AppData,
  candidateApp: AppData
): { score: number; matchingFactors: string[] } {
  if (targetApp.id === candidateApp.id) {
    return { score: 0, matchingFactors: [] };
  }

  const matchingFactors: string[] = [];

  // 1. Category Similarity (Weight: 40%)
  let categoryScore = 0;
  if (targetApp.category === candidateApp.category) {
    categoryScore = 100;
    matchingFactors.push(`Kategori yang sama (${targetApp.category})`);
  } else {
    // Cross-category semantic affinity (e.g. Video & Photography, Tools & Utilities, Social & Communication)
    const crossAffinities: Record<string, string[]> = {
      'Video': ['Photography', 'Entertainment'],
      'Photography': ['Video', 'Entertainment'],
      'Communication': ['Social', 'Productivity'],
      'Social': ['Communication', 'Entertainment'],
      'Tools': ['Utilities', 'Productivity'],
      'Utilities': ['Tools', 'Productivity'],
      'Games': ['Entertainment'],
      'Entertainment': ['Music', 'Video', 'Games'],
      'Music': ['Entertainment', 'Video'],
      'Productivity': ['Education', 'Tools']
    };

    const relatedCategories = crossAffinities[targetApp.category] || [];
    if (relatedCategories.includes(candidateApp.category)) {
      categoryScore = 60;
      matchingFactors.push(`Kategori terkait (${candidateApp.category})`);
    }
  }

  // 2. Keyword / Description Similarity (Weight: 25%)
  const targetKeywords = extractKeywords(`${targetApp.name} ${targetApp.description}`);
  const candidateKeywords = extractKeywords(`${candidateApp.name} ${candidateApp.description}`);

  let sharedCount = 0;
  const sharedSample: string[] = [];
  targetKeywords.forEach(k => {
    if (candidateKeywords.has(k)) {
      sharedCount++;
      if (sharedSample.length < 2) sharedSample.push(k);
    }
  });

  const unionSize = Math.max(1, targetKeywords.size + candidateKeywords.size - sharedCount);
  const jaccard = sharedCount / unionSize;
  const keywordScore = Math.min(100, Math.round(jaccard * 400));
  if (sharedSample.length > 0) {
    matchingFactors.push(`Fitur serupa (${sharedSample.join(', ')})`);
  }

  // 3. App Type & Platform Affinity (Weight: 10%)
  let typeScore = 50;
  if (targetApp.sourceType === candidateApp.sourceType) {
    typeScore = 100;
  }

  // 4. Quality & Popularity Baseline (Weight: 15%)
  const quality = computeAppQualityScore(candidateApp).totalScore;
  const popularity = Math.min(100, Math.log10(Math.max(10, candidateApp.downloads || 10)) * 15);
  const qualityScore = (quality * 0.6) + (popularity * 0.4);

  // 5. Freshness factor (Weight: 10%)
  let freshnessScore = 50;
  if (candidateApp.updatedAt) {
    const days = (Date.now() - new Date(candidateApp.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 30) freshnessScore = 100;
    else if (days <= 90) freshnessScore = 80;
    else freshnessScore = 40;
  }

  // Final Weighted Similarity
  const finalScore = Math.round(
    (categoryScore * 0.40) +
    (keywordScore * 0.25) +
    (typeScore * 0.10) +
    (qualityScore * 0.15) +
    (freshnessScore * 0.10)
  );

  return {
    score: finalScore,
    matchingFactors
  };
}

/**
 * Finds the most relevant Related Apps for an application using multi-dimensional intelligence
 */
export function getIntelligentRelatedApps(
  targetApp: AppData,
  allApps: AppData[],
  limit: number = 4
): { app: AppData; similarityScore: number; reason: string }[] {
  const eligible = allApps.filter(a => a.id !== targetApp.id && (a.status === 'published' || !a.status));

  const scored = eligible.map(candidate => {
    const { score, matchingFactors } = calculateContentSimilarity(targetApp, candidate);
    const reason = matchingFactors.length > 0 
      ? matchingFactors[0] 
      : `Pilihan populer di kategori ${candidate.category}`;
    return {
      app: candidate,
      similarityScore: score,
      reason
    };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, limit);
}
