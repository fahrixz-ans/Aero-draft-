import { AppData } from '../../types';
import { 
  RecommendationConfig, 
  RecommendationScoreBreakdown, 
  UserInterestProfile,
  RecommendationConfidence 
} from './recommendationTypes';

// Semantic cross-affinity matrix for related domains
export const CROSS_CATEGORY_AFFINITIES: Record<string, Record<string, number>> = {
  'Tools': { 'Productivity': 0.8, 'Utilities': 0.9, 'Personalization': 0.6, 'Security': 0.75 },
  'Productivity': { 'Tools': 0.8, 'Business': 0.85, 'Finance': 0.65, 'Education': 0.7 },
  'Photography': { 'Video Players': 0.85, 'Art & Design': 0.8, 'Social': 0.7, 'Media': 0.75 },
  'Video Players': { 'Photography': 0.85, 'Entertainment': 0.9, 'Music & Audio': 0.8 },
  'Music & Audio': { 'Entertainment': 0.85, 'Video Players': 0.8, 'Audio': 0.9 },
  'Entertainment': { 'Video Players': 0.9, 'Music & Audio': 0.85, 'Games': 0.65 },
  'Social': { 'Communication': 0.95, 'Photography': 0.7, 'Entertainment': 0.6 },
  'Communication': { 'Social': 0.95, 'Tools': 0.6, 'Productivity': 0.65 },
  'Finance': { 'Business': 0.8, 'Productivity': 0.65, 'Tools': 0.5 },
  'Education': { 'Books & Reference': 0.9, 'Productivity': 0.7, 'News': 0.6 },
  'Games': { 'Entertainment': 0.7, 'Action': 0.9, 'Casual': 0.9 }
};

export function computeAppSimilarityScore(
  targetApp: AppData,
  candidateApp: AppData
): { score: number; matchingFactors: string[] } {
  if (targetApp.id === candidateApp.id) {
    return { score: 0, matchingFactors: [] };
  }

  const matchingFactors: string[] = [];
  let similarityPoints = 0;

  // 1. Category Matching (Weight: 45 points)
  const targetCat = (targetApp.category || '').trim();
  const candidateCat = (candidateApp.category || '').trim();

  if (targetCat && candidateCat) {
    if (targetCat.toLowerCase() === candidateCat.toLowerCase()) {
      similarityPoints += 45;
      matchingFactors.push(`Kategori yang sama (${targetCat})`);
    } else {
      const crossWeight = CROSS_CATEGORY_AFFINITIES[targetCat]?.[candidateCat] || 
                          CROSS_CATEGORY_AFFINITIES[candidateCat]?.[targetCat] || 0;
      if (crossWeight > 0) {
        const pts = Math.round(crossWeight * 40);
        similarityPoints += pts;
        matchingFactors.push(`Kategori terkait (${candidateCat})`);
      }
    }
  }

  // 2. Developer Matching (Weight: 15 points)
  if (targetApp.developer && candidateApp.developer &&
      targetApp.developer.toLowerCase().trim() === candidateApp.developer.toLowerCase().trim()) {
    similarityPoints += 15;
    matchingFactors.push(`Pengembang yang sama (${targetApp.developer})`);
  }

  // 3. Keywords and Tags Overlap (Weight: 25 points)
  const getTokens = (app: AppData): Set<string> => {
    const set = new Set<string>();
    const fields = [
      app.name || '',
      app.shortDescription || app.description || '',
      app.category || '',
      ...(app.tags || []),
      ...(app.keywords || [])
    ];
    fields.forEach(str => {
      str.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
        .forEach(w => set.add(w));
    });
    return set;
  };

  const targetTokens = getTokens(targetApp);
  const candidateTokens = getTokens(candidateApp);

  let sharedTokenCount = 0;
  const sharedSample: string[] = [];
  targetTokens.forEach(token => {
    if (candidateTokens.has(token)) {
      sharedTokenCount++;
      if (sharedSample.length < 2) sharedSample.push(token);
    }
  });

  const unionSize = new Set([...targetTokens, ...candidateTokens]).size;
  const jaccard = unionSize > 0 ? sharedTokenCount / unionSize : 0;
  const keywordPoints = Math.min(25, Math.round(jaccard * 100 * 0.8) + (sharedTokenCount > 0 ? 5 : 0));
  similarityPoints += keywordPoints;

  if (sharedSample.length > 0 && keywordPoints >= 8) {
    matchingFactors.push(`Fitur serupa (${sharedSample.join(', ')})`);
  }

  // 4. Feature & Permission Profile Alignment (Weight: 15 points)
  if (targetApp.androidVersion && candidateApp.androidVersion) {
    similarityPoints += 5;
  }
  if ((targetApp.isOfficialVerified || targetApp.verifiedBadge) && (candidateApp.isOfficialVerified || candidateApp.verifiedBadge)) {
    similarityPoints += 10;
    matchingFactors.push('Terverifikasi resmi');
  }

  const normalizedScore = Math.min(100, Math.max(0, similarityPoints));
  return { score: normalizedScore, matchingFactors };
}

export function computeUserInterestScore(
  candidateApp: AppData,
  profile: UserInterestProfile
): { score: number; matchingFactors: string[] } {
  const matchingFactors: string[] = [];
  let interestPoints = 0;

  // 1. Category Affinity Match
  const cat = (candidateApp.category || '').trim();
  if (cat && profile.categoryAffinities[cat]) {
    const affinityVal = profile.categoryAffinities[cat];
    // Scale affinity to 0 - 60 points
    const catPoints = Math.min(60, Math.round(affinityVal * 6));
    interestPoints += catPoints;
    if (catPoints > 10) {
      matchingFactors.push(`Sesuai minat kategori (${cat})`);
    }
  }

  // 2. Tag & Keyword Affinity Match
  const appTokens = new Set<string>();
  const fields = [
    candidateApp.name || '',
    candidateApp.shortDescription || candidateApp.description || '',
    ...(candidateApp.tags || []),
    ...(candidateApp.keywords || [])
  ];
  fields.forEach(f => {
    f.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2).forEach(w => appTokens.add(w));
  });

  let tagMatchesScore = 0;
  let matchedTagCount = 0;
  for (const [tag, tagAffinity] of Object.entries(profile.tagAffinities || {})) {
    if (appTokens.has(tag)) {
      tagMatchesScore += (tagAffinity as number) * 3;
      matchedTagCount++;
    }
  }

  const tagPoints = Math.min(40, Math.round(tagMatchesScore));
  interestPoints += tagPoints;
  if (matchedTagCount > 0 && tagPoints >= 10) {
    matchingFactors.push('Sesuai topik penelusuran Anda');
  }

  return {
    score: Math.min(100, Math.max(0, interestPoints)),
    matchingFactors
  };
}

export function computePopularityScore(app: AppData): number {
  // Parse download count safely
  let dlCount = 0;
  const rawDl = String(app.downloads || '0');
  const clean = rawDl.replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    if (rawDl.toUpperCase().includes('M')) dlCount = num * 1000000;
    else if (rawDl.toUpperCase().includes('K') || rawDl.toUpperCase().includes('RB')) dlCount = num * 1000;
    else dlCount = num;
  }

  // Logarithmic scale for downloads (0 to 60 pts)
  const logDl = Math.log10(Math.max(1, dlCount));
  const dlPoints = Math.min(60, Math.round((logDl / 7) * 60));

  // Rating count / rating score (0 to 40 pts)
  const rating = Number(app.rating) || 4.0;
  const ratingPoints = Math.min(40, Math.round(((rating - 3.0) / 2.0) * 40));

  return Math.min(100, Math.max(0, dlPoints + ratingPoints));
}

export function computeFreshnessScore(app: AppData): number {
  const dateStr = app.updatedAt || app.publishAt || app.releaseDate || app.createdAt;
  if (!dateStr) return 50;

  const appTime = new Date(dateStr).getTime();
  if (isNaN(appTime)) return 50;

  const now = Date.now();
  const ageInDays = Math.max(0, (now - appTime) / (1000 * 60 * 60 * 24));

  if (ageInDays <= 7) return 100;
  if (ageInDays <= 30) return 85;
  if (ageInDays <= 90) return 70;
  if (ageInDays <= 180) return 50;
  if (ageInDays <= 365) return 30;
  return 15;
}

export function computeQualityScore(app: AppData): number {
  let score = 40; // Base score

  // Rating value (up to 30 pts)
  const rating = Number(app.rating) || 4.0;
  score += Math.min(30, Math.round((rating / 5.0) * 30));

  // Verified official security badge (+15 pts)
  if (app.isOfficialVerified || app.verifiedBadge || app.verifiedSource || (app.securityScan && app.securityScan.status === 'passed')) {
    score += 15;
  }

  // Rich metadata completeness (+15 pts)
  if (app.screenshots && app.screenshots.length >= 2) score += 5;
  if (app.description && app.description.length > 30) score += 5;
  if (app.size) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function computeTrendingScore(app: AppData): number {
  let trendingPoints = 30;

  if (app.trending || app.featured || (app.trendingScore && app.trendingScore > 50)) {
    trendingPoints += 35;
  }

  if (app.badges && Array.isArray(app.badges)) {
    if (app.badges.some((b: any) => typeof b === 'string' ? (b === 'trending' || b === 'rising') : (b?.type === 'trending' || b?.type === 'rising'))) {
      trendingPoints += 20;
    }
  }

  // Views & downloads weight
  const viewCount = app.viewCount || app.analytics?.views || 0;
  if (viewCount > 100) trendingPoints += 15;

  return Math.min(100, Math.max(0, trendingPoints));
}

export function calculateComprehensiveScore(
  candidateApp: AppData,
  context: {
    targetApp?: AppData;
    profile?: UserInterestProfile;
    config: RecommendationConfig;
  }
): RecommendationScoreBreakdown {
  const { targetApp, profile, config } = context;
  const factors = config.factors;

  // 1. Compute Individual Component Scores (0 - 100)
  const simResult = targetApp 
    ? computeAppSimilarityScore(targetApp, candidateApp) 
    : { score: 50, matchingFactors: [] };
  
  const interestResult = profile 
    ? computeUserInterestScore(candidateApp, profile) 
    : { score: 50, matchingFactors: [] };

  const popScore = computePopularityScore(candidateApp);
  const freshScore = computeFreshnessScore(candidateApp);
  const qualScore = computeQualityScore(candidateApp);
  const trendScore = computeTrendingScore(candidateApp);

  // 2. Compute Weighted Final Score
  const finalScore = Math.round(
    simResult.score * factors.similarity +
    interestResult.score * factors.interest +
    popScore * factors.popularity +
    freshScore * factors.freshness +
    qualScore * factors.quality +
    trendScore * factors.trending
  );

  // 3. Compile Matching Factors & Reason
  const combinedFactors = Array.from(new Set([
    ...simResult.matchingFactors,
    ...interestResult.matchingFactors
  ]));

  if (qualScore >= 85 && candidateApp.rating) {
    combinedFactors.push(`Rating tinggi (${candidateApp.rating}★)`);
  }
  if (freshScore >= 80) {
    combinedFactors.push('Update baru');
  }

  // 4. Primary Reason Generation (Indonesian copywriting)
  let primaryReason = '';
  if (profile && interestResult.score >= 50 && profile.preferredCategories.length > 0) {
    primaryReason = `Berdasarkan minat ${profile.preferredCategories[0]}`;
  } else if (targetApp && simResult.score >= 60) {
    primaryReason = `Serupa dengan ${targetApp.name}`;
  } else if (trendScore >= 70) {
    primaryReason = 'Sedang tren di komunitas';
  } else if (candidateApp.rating && candidateApp.rating >= 4.5) {
    primaryReason = `Pilihan teratas (${candidateApp.rating}★)`;
  } else {
    primaryReason = `Kategori ${candidateApp.category || 'Populer'}`;
  }

  // 5. Confidence Calculation
  let confidence: RecommendationConfidence = 'LOW';
  if (finalScore >= 65 || (profile && interestResult.score >= 60) || (targetApp && simResult.score >= 70)) {
    confidence = 'HIGH';
  } else if (finalScore >= 40) {
    confidence = 'MEDIUM';
  }

  return {
    similarityScore: simResult.score,
    interestScore: interestResult.score,
    popularityScore: popScore,
    freshnessScore: freshScore,
    qualityScore: qualScore,
    trendingScore: trendScore,
    finalScore: Math.min(100, Math.max(0, finalScore)),
    confidence,
    primaryReason,
    matchingFactors: combinedFactors.slice(0, 3)
  };
}
