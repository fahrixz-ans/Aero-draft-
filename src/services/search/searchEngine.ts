import { AppData, SearchIntentType, SearchFilterParams, RankedSearchResult, SearchSuggestionGroup, SearchPipelineResult, SearchAlias, SearchQualityScore, SearchAnalyticsAggregated, SortOption } from '../../types';

// ---------------------------------------------------------------------------
// 1. DEFAULT SEARCH ALIASES DICTIONARY
// ---------------------------------------------------------------------------
export const DEFAULT_SEARCH_ALIASES: Record<string, string> = {
  'wa': 'WhatsApp',
  'ig': 'Instagram',
  'insta': 'Instagram',
  'ml': 'Mobile Legends',
  'mlbb': 'Mobile Legends: Bang Bang',
  'ff': 'Free Fire',
  'epep': 'Free Fire',
  'yt': 'YouTube',
  'fb': 'Facebook',
  'tg': 'Telegram',
  'tele': 'Telegram',
  'tt': 'TikTok',
  'tik tok': 'TikTok',
  'pubg': 'PUBG Mobile',
  'genshin': 'Genshin Impact',
  'canva': 'Canva',
  'vn': 'VN Video Editor',
  'capcut': 'CapCut',
  'roblox': 'Roblox',
  'spotify': 'Spotify',
  'bca': 'BCA mobile',
  'dana': 'DANA',
  'gopay': 'GoPay',
  'ovo': 'OVO',
  'shopee': 'Shopee',
  'tokped': 'Tokopedia'
};

// ---------------------------------------------------------------------------
// 2. COMMON TYPO DICTIONARY (INSTANT LOOKUP)
// ---------------------------------------------------------------------------
export const COMMON_TYPOS: Record<string, string> = {
  'whatsap': 'WhatsApp',
  'whtasapp': 'WhatsApp',
  'watsapp': 'WhatsApp',
  'watsap': 'WhatsApp',
  'capcu': 'CapCut',
  'caput': 'CapCut',
  'tikok': 'TikTok',
  'tiktk': 'TikTok',
  'instgram': 'Instagram',
  'ingstagram': 'Instagram',
  'mincraft': 'Minecraft',
  'minecraf': 'Minecraft',
  'sportify': 'Spotify',
  'spotifi': 'Spotify',
  'tellegram': 'Telegram',
  'telegam': 'Telegram',
  'mobel legend': 'Mobile Legends',
  'moba': 'Mobile Legends',
  'fre fire': 'Free Fire',
  'freefir': 'Free Fire',
  'youtub': 'YouTube',
  'yutub': 'YouTube',
  'facebok': 'Facebook',
  'fesbuk': 'Facebook'
};

// ---------------------------------------------------------------------------
// 3. CATEGORY & GAME KEYWORD MAPS FOR INTENT RECOGNITION
// ---------------------------------------------------------------------------
const GAME_KEYWORDS = [
  'game', 'games', 'permainan', 'rpg', 'moba', 'fps', 'racing', 'balap', 
  'arcade', 'simulator', 'petualangan', 'adventure', 'puzzle', 'teka-teki',
  'offline game', 'game offline', 'game online', 'action game', 'action', 'strategy', 'strategi'
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Fotografi': ['foto', 'photo', 'camera', 'kamera', 'filter', 'edit foto', 'photo editor', 'gallery', 'galeri'],
  'Pemutar & Editor Video': ['video', 'edit video', 'video editor', 'player', 'pemutar video', 'render', 'cinema'],
  'Alat': ['alat', 'tools', 'utility', 'utilitas', 'cleaner', 'booster', 'file manager', 'calculator', 'kalkulator', 'scanner', 'vpn'],
  'Komunikasi': ['chat', 'pesan', 'obrolan', 'telepon', 'call', 'komunikasi', 'messenger', 'sms', 'video call'],
  'Sosial': ['sosial', 'social', 'media sosial', 'status', 'feed', 'post', 'stories', 'komunitas'],
  'Produktivitas': ['kantor', 'office', 'dokumen', 'catatan', 'notes', 'pdf', 'scanner', 'produktivitas', 'work', 'tugas'],
  'Musik & Audio': ['musik', 'music', 'lagu', 'mp3', 'audio', 'sound', 'streaming musik', 'radio', 'podcast'],
  'Belanja': ['belanja', 'shopping', 'toko', 'marketplace', 'beli', 'jual', 'diskon', 'promo', 'olshop'],
  'Keuangan': ['uang', 'finance', 'dompet', 'wallet', 'bank', 'banking', 'transfer', 'qris', 'pinjaman', 'investasi'],
  'Personalisasi': ['tema', 'theme', 'wallpaper', 'launcher', 'icon pack', 'ringtone', 'font'],
  'Edukasi': ['edukasi', 'belajar', 'pendidikan', 'kursus', 'sekolah', 'buku', 'kamus', 'soal', 'kuis']
};

const VERSION_TERMS = ['latest', 'terbaru', 'update', 'versi lama', 'old version', 'v1', 'v2', 'v3', 'v4', 'v5', 'apk mod', 'mod apk', 'mod', 'pro'];

// ---------------------------------------------------------------------------
// 4. NORMALIZATION PIPELINE
// ---------------------------------------------------------------------------
export function normalizeQuery(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFKD') // Unicode normalization
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^\w\s\d.-]/gi, ' ') // replace special punctuation with spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

// ---------------------------------------------------------------------------
// 5. LEVENSHTEIN DISTANCE (FUZZY MATCHING)
// ---------------------------------------------------------------------------
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// ---------------------------------------------------------------------------
// 6. INTENT RECOGNITION PIPELINE
// ---------------------------------------------------------------------------
export function analyzeSearchIntent(
  rawQuery: string,
  availableApps: AppData[] = [],
  availableCategories: string[] = []
): { intent: SearchIntentType; tokens: string[]; matchedEntity?: string; didYouMean?: string | null } {
  const normalized = normalizeQuery(rawQuery);
  if (!normalized) {
    return { intent: 'GENERAL', tokens: [] };
  }

  const tokens = normalized.split(' ').filter(Boolean);

  // Check Exact App Match or Alias
  const aliasMatch = DEFAULT_SEARCH_ALIASES[normalized];
  if (aliasMatch) {
    return { intent: 'EXACT_APP', tokens, matchedEntity: aliasMatch };
  }

  const exactApp = availableApps.find(a => 
    normalizeQuery(a.name) === normalized ||
    (a.packageName && normalizeQuery(a.packageName) === normalized)
  );
  if (exactApp) {
    return { intent: 'EXACT_APP', tokens, matchedEntity: exactApp.name };
  }

  // Check Developer Match
  const developerMatch = availableApps.find(a => 
    normalizeQuery(a.developer || a.developerName || '') === normalized
  );
  if (developerMatch) {
    return { intent: 'DEVELOPER', tokens, matchedEntity: developerMatch.developer || developerMatch.developerName };
  }

  // Check Version Match
  const isVersionSearch = VERSION_TERMS.some(t => normalized.includes(t));
  if (isVersionSearch) {
    return { intent: 'VERSION', tokens };
  }

  // Check Game Discovery Match
  const isGameQuery = GAME_KEYWORDS.some(k => normalized.includes(k));
  if (isGameQuery) {
    return { intent: 'GAME_DISCOVERY', tokens };
  }

  // Check Category Match
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (normalizeQuery(catName) === normalized || keywords.some(k => normalized === k || normalized.includes(k))) {
      return { intent: 'CATEGORY', tokens, matchedEntity: catName };
    }
  }
  const matchedDirectCat = availableCategories.find(c => normalizeQuery(c) === normalized);
  if (matchedDirectCat) {
    return { intent: 'CATEGORY', tokens, matchedEntity: matchedDirectCat };
  }

  // Check General App Discovery
  if (tokens.some(t => ['terbaik', 'top', 'bagus', 'rekomendasi', 'aplikasi', 'app', 'android'].includes(t))) {
    return { intent: 'APP_DISCOVERY', tokens };
  }

  return { intent: 'GENERAL', tokens };
}

// ---------------------------------------------------------------------------
// 7. TYPO DETECTION & CORRECTION ENGINE
// ---------------------------------------------------------------------------
export function detectTypoAndSuggest(
  rawQuery: string,
  availableApps: AppData[] = [],
  availableDevelopers: string[] = []
): { didYouMean: string | null; correctedQuery: string | null } {
  const normalized = normalizeQuery(rawQuery);
  if (!normalized || normalized.length < 3) {
    return { didYouMean: null, correctedQuery: null };
  }

  // Check dictionary typos first
  if (COMMON_TYPOS[normalized]) {
    return {
      didYouMean: COMMON_TYPOS[normalized],
      correctedQuery: normalizeQuery(COMMON_TYPOS[normalized])
    };
  }

  // Check if query is close to any popular app name
  let bestAppName: string | null = null;
  let lowestAppDist = 999;

  for (const app of availableApps) {
    const appNorm = normalizeQuery(app.name);
    if (appNorm === normalized) return { didYouMean: null, correctedQuery: null }; // Exact match, no typo

    const dist = calculateLevenshteinDistance(normalized, appNorm);
    const maxAllowedDist = normalized.length <= 4 ? 1 : normalized.length <= 8 ? 2 : 3;

    if (dist <= maxAllowedDist && dist < lowestAppDist) {
      lowestAppDist = dist;
      bestAppName = app.name;
    }
  }

  if (bestAppName) {
    return {
      didYouMean: bestAppName,
      correctedQuery: normalizeQuery(bestAppName)
    };
  }

  // Check developers
  for (const dev of availableDevelopers) {
    const devNorm = normalizeQuery(dev);
    const dist = calculateLevenshteinDistance(normalized, devNorm);
    if (dist <= 2) {
      return {
        didYouMean: dev,
        correctedQuery: devNorm
      };
    }
  }

  return { didYouMean: null, correctedQuery: null };
}

// ---------------------------------------------------------------------------
// 8. MULTI-FACTOR RANKING ENGINE
// ---------------------------------------------------------------------------
export function scoreAndRankCandidate(
  app: AppData,
  rawQuery: string,
  normalizedQuery: string,
  tokens: string[],
  aliasTarget: string | null = null
): RankedSearchResult | null {
  const appNameNorm = normalizeQuery(app.name);
  const appDevNorm = normalizeQuery(app.developer || app.developerName || '');
  const appCatNorm = normalizeQuery(app.category || '');
  const appDescNorm = normalizeQuery(app.description || '');
  const appPkgNorm = normalizeQuery(app.packageName || '');

  let textRelevance = 0;
  let matchedField: RankedSearchResult['matchedField'] = 'name';
  let matched = false;

  // 1. Exact Match (100)
  if (appNameNorm === normalizedQuery) {
    textRelevance = 100;
    matchedField = 'name';
    matched = true;
  }
  // 2. Alias Match (95)
  else if (aliasTarget && normalizeQuery(aliasTarget) === appNameNorm) {
    textRelevance = 95;
    matchedField = 'alias';
    matched = true;
  }
  // 3. Name Starts With / Prefix (85)
  else if (appNameNorm.startsWith(normalizedQuery)) {
    textRelevance = 85;
    matchedField = 'prefix';
    matched = true;
  }
  // 4. Name Contains (75)
  else if (appNameNorm.includes(normalizedQuery)) {
    textRelevance = 75;
    matchedField = 'name';
    matched = true;
  }
  // 5. Developer Exact / StartsWith (65)
  else if (appDevNorm === normalizedQuery || appDevNorm.startsWith(normalizedQuery)) {
    textRelevance = 65;
    matchedField = 'developer';
    matched = true;
  }
  // 6. Package Name Contains (60)
  else if (appPkgNorm.includes(normalizedQuery)) {
    textRelevance = 60;
    matchedField = 'packageName';
    matched = true;
  }
  // 7. Category Matches (50)
  else if (appCatNorm.includes(normalizedQuery)) {
    textRelevance = 50;
    matchedField = 'category';
    matched = true;
  }
  // 8. Multi-token partial matches in name or dev
  else {
    let tokenMatches = 0;
    for (const t of tokens) {
      if (appNameNorm.includes(t)) tokenMatches += 2;
      else if (appDevNorm.includes(t)) tokenMatches += 1.5;
      else if (appCatNorm.includes(t)) tokenMatches += 1;
      else if (appDescNorm.includes(t)) tokenMatches += 0.5;
    }

    if (tokenMatches > 0) {
      textRelevance = Math.min(60, tokenMatches * 15);
      matchedField = appNameNorm.includes(tokens[0]) ? 'name' : 'description';
      matched = true;
    }
  }

  // Fuzzy match fallback if not directly matched
  if (!matched && normalizedQuery.length >= 4) {
    const dist = calculateLevenshteinDistance(normalizedQuery, appNameNorm);
    if (dist <= 2) {
      textRelevance = 40;
      matchedField = 'fuzzy';
      matched = true;
    }
  }

  if (!matched) return null;

  // Compute other factors
  // Quality Factor (0 - 100): rating average / 5 * 100
  const ratingVal = app.ratingAverage || app.rating || 4.0;
  const quality = Math.min(100, Math.max(0, (ratingVal / 5) * 100));

  // Popularity Factor (0 - 100): Logarithmic downloads scale (10M+ = 100, 1M = 80, 100K = 60, 10K = 40)
  const dls = app.downloads || 0;
  const popularity = Math.min(100, Math.max(10, Math.log10(Math.max(1, dls)) * 14.28));

  // CTR / Search Frequency Factor (0 - 100)
  const searchFreq = app.analytics?.searchFrequency || 0;
  const ctr = Math.min(100, Math.max(20, searchFreq * 5 + 30));

  // Freshness Factor (0 - 100): Based on updatedAt date
  let freshness = 50;
  if (app.updatedAt) {
    const ageDays = (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 7) freshness = 100;
    else if (ageDays <= 30) freshness = 85;
    else if (ageDays <= 90) freshness = 70;
    else if (ageDays <= 180) freshness = 50;
    else freshness = 30;
  }

  // Multi-factor weighted aggregate:
  // Text Relevance: 45%
  // Quality: 20%
  // Popularity: 15%
  // CTR: 10%
  // Freshness: 10%
  const totalScore = (
    textRelevance * 0.45 +
    quality * 0.20 +
    popularity * 0.15 +
    ctr * 0.10 +
    freshness * 0.10
  );

  return {
    app,
    scoreBreakdown: {
      textRelevance,
      quality,
      popularity,
      ctr,
      freshness,
      totalScore: Number(totalScore.toFixed(2))
    },
    matchedField,
    highlightTerm: normalizedQuery
  };
}

// ---------------------------------------------------------------------------
// 9. SEARCH PIPELINE EXECUTOR
// ---------------------------------------------------------------------------
export function executeSearchPipeline(
  rawQuery: string,
  allApps: AppData[] = [],
  filters: SearchFilterParams = {},
  sortOption: SortOption = 'latest',
  customAliases: Record<string, string> = {}
): SearchPipelineResult {
  const startTime = performance.now();
  const normalizedQuery = normalizeQuery(rawQuery);

  const categories = Array.from(new Set(allApps.map(a => a.category).filter(Boolean)));
  const developers = Array.from(new Set(allApps.map(a => a.developer || a.developerName || '').filter(Boolean)));

  // 1. Intent Analysis
  const intentResult = analyzeSearchIntent(rawQuery, allApps, categories);
  const tokens = intentResult.tokens;

  // 2. Alias resolution
  const mergedAliases = { ...DEFAULT_SEARCH_ALIASES, ...customAliases };
  const aliasTarget = mergedAliases[normalizedQuery] || null;

  // 3. Typo Detection & Did you mean
  const typoResult = detectTypoAndSuggest(rawQuery, allApps, developers);

  // 4. Candidate Scoring & Filtering
  let candidates: RankedSearchResult[] = [];

  if (normalizedQuery) {
    for (const app of allApps) {
      // Exclude non-published if status exists
      if (app.status && app.status !== 'published') continue;

      const scored = scoreAndRankCandidate(app, rawQuery, normalizedQuery, tokens, aliasTarget);
      if (scored) {
        candidates.push(scored);
      }
    }
  } else {
    // If empty query, return published apps ranked by popularity/rating
    candidates = allApps
      .filter(a => !a.status || a.status === 'published')
      .map(app => ({
        app,
        scoreBreakdown: {
          textRelevance: 50,
          quality: (app.ratingAverage || app.rating || 4) * 20,
          popularity: Math.min(100, Math.log10(Math.max(1, app.downloads || 0)) * 14.28),
          ctr: 50,
          freshness: 50,
          totalScore: 50
        },
        matchedField: 'name' as const
      }));
  }

  // If 0 results found with normal query, try typo-corrected query as fallback
  if (candidates.length === 0 && typoResult.correctedQuery) {
    const typoTokens = typoResult.correctedQuery.split(' ').filter(Boolean);
    for (const app of allApps) {
      if (app.status && app.status !== 'published') continue;
      const scored = scoreAndRankCandidate(app, typoResult.didYouMean || '', typoResult.correctedQuery, typoTokens, null);
      if (scored) {
        candidates.push(scored);
      }
    }
  }

  // 5. Apply User Filters
  let filtered = candidates.filter(item => {
    const app = item.app;

    // Type Filter (All / Apps / Games)
    if (filters.type === 'games') {
      const isGame = app.category?.toLowerCase().includes('game') || 
                     app.category?.toLowerCase().includes('permainan') ||
                     ['rpg', 'action', 'arcade', 'strategy', 'puzzle'].some(g => app.category?.toLowerCase().includes(g));
      if (!isGame) return false;
    } else if (filters.type === 'apps') {
      const isGame = app.category?.toLowerCase().includes('game') || 
                     app.category?.toLowerCase().includes('permainan') ||
                     ['rpg', 'action', 'arcade', 'strategy', 'puzzle'].some(g => app.category?.toLowerCase().includes(g));
      if (isGame) return false;
    }

    // Category Filter
    if (filters.category && filters.category !== 'Semua' && filters.category !== 'all') {
      if (app.category !== filters.category) return false;
    }

    // Developer Filter
    if (filters.developer) {
      const dev = (app.developer || app.developerName || '').toLowerCase();
      if (!dev.includes(filters.developer.toLowerCase())) return false;
    }

    // Rating Filter
    if (filters.rating === '4.5+') {
      const r = app.ratingAverage || app.rating || 0;
      if (r < 4.5) return false;
    } else if (filters.rating === '4.0+') {
      const r = app.ratingAverage || app.rating || 0;
      if (r < 4.0) return false;
    }

    // Android Version
    if (filters.minAndroid) {
      if (app.androidVersion && !app.androidVersion.includes(filters.minAndroid)) {
        // loose check
      }
    }

    // APK Available
    if (filters.hasApk) {
      if (!app.apkFileUrl && !app.downloadUrl) return false;
    }

    // Official Website Available
    if (filters.hasOfficialWebsite) {
      if (!app.officialUrl && !app.officialDownloadUrl) return false;
    }

    // Recently Updated (last 30 days)
    if (filters.recentlyUpdated && app.updatedAt) {
      const days = (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (days > 30) return false;
    }

    return true;
  });

  // 6. Sorting
  const sort = filters.sort || sortOption;
  filtered.sort((a, b) => {
    if (sort === 'popular') {
      return (b.app.downloads || 0) - (a.app.downloads || 0);
    }
    if (sort === 'rating') {
      const rA = a.app.ratingAverage || a.app.rating || 0;
      const rB = b.app.ratingAverage || b.app.rating || 0;
      return rB - rA;
    }
    if (sort === 'updated' || sort === 'latest') {
      const tA = new Date(a.app.updatedAt || a.app.releaseDate || 0).getTime();
      const tB = new Date(b.app.updatedAt || b.app.releaseDate || 0).getTime();
      return tB - tA;
    }
    if (sort === 'a-z') {
      return a.app.name.localeCompare(b.app.name);
    }
    if (sort === 'z-a') {
      return b.app.name.localeCompare(a.app.name);
    }
    // Default: Total Multi-factor Score (Relevance)
    return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
  });

  // 7. Suggestions Generation
  const suggestions = generateSearchSuggestions(rawQuery, allApps, categories, developers, typoResult.didYouMean);

  const timingMs = Number((performance.now() - startTime).toFixed(1));

  return {
    query: rawQuery,
    normalizedQuery,
    intent: filtered.length === 0 && normalizedQuery ? 'NO_RESULT' : intentResult.intent,
    tokens,
    didYouMean: typoResult.didYouMean,
    appliedFilters: filters,
    totalCandidates: filtered.length,
    results: filtered,
    suggestions,
    timingMs
  };
}

// ---------------------------------------------------------------------------
// 10. SUGGESTION & AUTOCOMPLETE GENERATOR
// ---------------------------------------------------------------------------
export function generateSearchSuggestions(
  rawQuery: string,
  allApps: AppData[],
  categories: string[],
  developers: string[],
  didYouMean: string | null = null
): SearchSuggestionGroup {
  const norm = normalizeQuery(rawQuery);
  if (!norm) {
    return {
      apps: allApps.slice(0, 5).map(a => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        icon: a.icon || a.iconUrl || '',
        category: a.category,
        rating: a.ratingAverage || a.rating || 4.5,
        developer: a.developer || a.developerName || '',
        downloads: a.downloads
      })),
      developers: developers.slice(0, 4),
      categories: categories.slice(0, 5),
      queries: ['WhatsApp', 'CapCut', 'Mobile Legends', 'Instagram', 'Spotify'],
      didYouMean: null
    };
  }

  // Matched Apps
  const matchedApps = allApps
    .filter(a => {
      const name = normalizeQuery(a.name);
      return name.includes(norm) || (a.packageName && normalizeQuery(a.packageName).includes(norm));
    })
    .slice(0, 6)
    .map(a => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      icon: a.icon || a.iconUrl || '',
      category: a.category,
      rating: a.ratingAverage || a.rating || 4.5,
      developer: a.developer || a.developerName || '',
      downloads: a.downloads
    }));

  // Matched Developers
  const matchedDevs = developers
    .filter(d => normalizeQuery(d).includes(norm))
    .slice(0, 4);

  // Matched Categories
  const matchedCats = categories
    .filter(c => normalizeQuery(c).includes(norm))
    .slice(0, 4);

  // Suggested Queries
  const querySet = new Set<string>();
  if (matchedApps.length > 0) {
    matchedApps.slice(0, 3).forEach(a => querySet.add(a.name));
  }
  if (matchedCats.length > 0) {
    matchedCats.forEach(c => querySet.add(`Aplikasi ${c}`));
  }
  if (didYouMean) {
    querySet.add(didYouMean);
  }

  return {
    apps: matchedApps,
    developers: matchedDevs,
    categories: matchedCats,
    queries: Array.from(querySet),
    didYouMean
  };
}

// ---------------------------------------------------------------------------
// 11. SEARCH QUALITY SCORE ENGINE (FOR ADMIN INTELLIGENCE)
// ---------------------------------------------------------------------------
export function computeSearchQualityScore(analytics: SearchAnalyticsAggregated[]): SearchQualityScore {
  if (!analytics || analytics.length === 0) {
    return {
      overallScore: 88,
      relevanceScore: 90,
      ctrScore: 85,
      noResultRateScore: 88,
      abandonmentScore: 89,
      recommendations: ['Tingkatkan pengindeksan kata kunci lokal.', 'Pantau kata kunci tanpa hasil secara berkala.']
    };
  }

  const totalSearches = analytics.reduce((acc, curr) => acc + (curr.searchCount || 0), 0);
  const totalClicks = analytics.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);
  const totalNoResults = analytics.reduce((acc, curr) => acc + (curr.noResultCount || 0), 0);

  const avgCtr = totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 75;
  const noResultRate = totalSearches > 0 ? (totalNoResults / totalSearches) * 100 : 5;

  const ctrScore = Math.min(100, Math.max(10, avgCtr * 1.2));
  const noResultRateScore = Math.min(100, Math.max(10, 100 - noResultRate * 3));
  const relevanceScore = Math.round((ctrScore * 0.6 + noResultRateScore * 0.4));
  const abandonmentScore = Math.max(60, 100 - (100 - ctrScore) * 0.5);

  const overallScore = Math.round(
    relevanceScore * 0.35 +
    ctrScore * 0.30 +
    noResultRateScore * 0.20 +
    abandonmentScore * 0.15
  );

  const recommendations: string[] = [];
  if (noResultRate > 8) {
    recommendations.push('Tingkat pencarian tanpa hasil mencapai >8%. Tambahkan alias atau aplikasi baru untuk kata kunci gap.');
  }
  if (avgCtr < 60) {
    recommendations.push('Rata-rata CTR di bawah 60%. Periksa relevansi urutan hasil pencarian teratas.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Performa pencarian optimal dan relevansi katalog sangat baik.');
    recommendations.push('Pertahankan pembaruan metadata dan alias pencarian berkala.');
  }

  return {
    overallScore,
    relevanceScore: Math.round(relevanceScore),
    ctrScore: Math.round(ctrScore),
    noResultRateScore: Math.round(noResultRateScore),
    abandonmentScore: Math.round(abandonmentScore),
    recommendations
  };
}
