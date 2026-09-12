import { AppData } from '../types';
import { CATEGORIES_100, CATEGORY_ALIASES, RELATED_CATEGORIES_MAP } from '../data/categories100';

export interface CategoryStat {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  totalDownloads: number;
  topApps: AppData[];
}

/**
 * Converts category name to clean URL-friendly slug
 * Examples:
 * - "Alat" -> "alat"
 * - "Anak-anak" -> "anak-anak"
 * - "Android Auto" -> "android-auto"
 * - "AI & Asisten" -> "ai-asisten"
 * - "Saham & Sekuritas" -> "saham-sekuritas"
 * - "Bisnis & Wirausaha" -> "bisnis-wirausaha"
 */
export function categoryToSlug(name: string): string {
  if (!name) return 'kategori';
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'kategori';
}

/**
 * Resolves canonical category name from a slug.
 * Returns null if the slug does not correspond to a valid category.
 */
export function slugToCategoryName(
  slug: string, 
  apps: AppData[] = [], 
  customCategories: string[] = []
): string | null {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Direct match with official 100 categories
  const match100 = CATEGORIES_100.find(c => categoryToSlug(c) === cleanSlug);
  if (match100) return match100;

  // 2. Match with known aliases (e.g. "social" -> "Sosial", "games" -> "Game")
  if (CATEGORY_ALIASES[cleanSlug]) {
    return CATEGORY_ALIASES[cleanSlug];
  }

  // 3. Match against custom categories
  const customMatch = customCategories.find(c => categoryToSlug(c) === cleanSlug);
  if (customMatch) return customMatch;

  // 4. Match against apps categories in database
  const appMatch = apps.find(a => {
    if (a.category && categoryToSlug(a.category) === cleanSlug) return true;
    if (Array.isArray(a.categories) && a.categories.some(c => categoryToSlug(c) === cleanSlug)) return true;
    return false;
  });
  if (appMatch) {
    if (appMatch.category && categoryToSlug(appMatch.category) === cleanSlug) {
      return appMatch.category;
    }
    const matchedArrCat = appMatch.categories?.find(c => categoryToSlug(c) === cleanSlug);
    if (matchedArrCat) return matchedArrCat;
  }

  return null;
}

/**
 * Extracts all multi-label categories assigned or inferred for an application.
 * Honors multi-label guidelines while keeping financial categories distinct.
 */
export function getAppCategories(app: AppData): string[] {
  if (!app) return ['Alat'];
  const results = new Set<string>();

  // 1. Explicit categories array
  if (Array.isArray(app.categories)) {
    app.categories.forEach(c => {
      const trimmed = c.trim();
      if (trimmed) {
        // Resolve alias if needed
        const slug = categoryToSlug(trimmed);
        const resolved = CATEGORY_ALIASES[slug] || trimmed;
        results.add(resolved);
      }
    });
  }

  // 2. Primary category
  if (app.category) {
    const trimmed = app.category.trim();
    const slug = categoryToSlug(trimmed);
    const resolved = CATEGORY_ALIASES[slug] || trimmed;
    results.add(resolved);
  }

  // 3. Secondary category / tags
  if (app.secondaryCategory) {
    const trimmed = app.secondaryCategory.trim();
    const slug = categoryToSlug(trimmed);
    const resolved = CATEGORY_ALIASES[slug] || trimmed;
    results.add(resolved);
  }
  if (Array.isArray(app.tags)) {
    app.tags.forEach(t => {
      const slug = categoryToSlug(t);
      const resolved = CATEGORY_ALIASES[slug];
      if (resolved) results.add(resolved);
    });
  }

  // 4. Inferred multi-labels based on semantic content (without losing strict financial separation)
  const combinedText = `${app.name} ${app.description || ''} ${app.developer || ''}`.toLowerCase();

  // Social & Communication
  if (results.has('Sosial') || results.has('Social')) {
    results.add('Sosial');
    if (combinedText.includes('chat') || combinedText.includes('pesan') || combinedText.includes('video call')) {
      results.add('Komunikasi');
      results.add('Pesan & Chat');
    }
    results.add('Media Sosial');
  }
  if (results.has('Komunikasi') || results.has('Communication')) {
    results.add('Komunikasi');
    results.add('Pesan & Chat');
    results.add('Sosial');
  }

  // Photography & Video
  if (results.has('Fotografi') || results.has('Photography')) {
    results.add('Fotografi');
    results.add('Editor Foto');
    if (combinedText.includes('video') || combinedText.includes('reels')) {
      results.add('Pemutar & Editor Video');
    }
  }
  if (results.has('Video') || results.has('Pemutar & Editor Video')) {
    results.add('Pemutar & Editor Video');
    if (combinedText.includes('stream') || combinedText.includes('nonton')) {
      results.add('Streaming');
    }
  }

  // Games
  if (results.has('Game') || results.has('Games')) {
    results.add('Game');
    results.add('Hiburan');
  }

  // Music & Audio
  if (results.has('Music') || results.has('Musik & Audio')) {
    results.add('Musik & Audio');
    results.add('Pemutar Musik');
    if (combinedText.includes('podcast')) results.add('Podcast');
    if (combinedText.includes('radio')) results.add('Radio');
  }

  // Productivity
  if (results.has('Productivity') || results.has('Produktivitas')) {
    results.add('Produktivitas');
    if (combinedText.includes('catatan') || combinedText.includes('notes') || combinedText.includes('memo')) {
      results.add('Catatan & Memo');
    }
    if (combinedText.includes('dokumen') || combinedText.includes('doc') || combinedText.includes('pdf')) {
      results.add('Editor Dokumen');
      results.add('PDF & Dokumen');
    }
  }

  // Strict Financial categories distribution
  const hasFinancePrimary = results.has('Finance') || results.has('Keuangan');
  if (hasFinancePrimary) {
    results.add('Keuangan'); // Broad financial category
  }

  // Investasi (reksa dana, emas, investasi umum)
  if (
    combinedText.includes('reksa dana') || 
    combinedText.includes('investasi') || 
    combinedText.includes('emas') || 
    combinedText.includes('bibit') || 
    combinedText.includes('bareksa') || 
    combinedText.includes('pluang')
  ) {
    results.add('Investasi');
    results.add('Keuangan');
  }

  // Saham & Sekuritas (saham, broker, sekuritas, trading)
  if (
    combinedText.includes('saham') || 
    combinedText.includes('sekuritas') || 
    combinedText.includes('broker') || 
    combinedText.includes('trading') || 
    combinedText.includes('idx') || 
    combinedText.includes('stockbit') || 
    combinedText.includes('ajaib')
  ) {
    results.add('Saham & Sekuritas');
    results.add('Keuangan');
  }

  // Perbankan (bank digital dan konvensional)
  if (
    combinedText.includes('bank') || 
    combinedText.includes('banking') || 
    combinedText.includes('bca') || 
    combinedText.includes('mandiri') || 
    combinedText.includes('bri') || 
    combinedText.includes('bni') || 
    combinedText.includes('jago') || 
    combinedText.includes('seabank') || 
    combinedText.includes('neobank')
  ) {
    results.add('Perbankan');
    results.add('Keuangan');
  }

  // Pembayaran Digital (payment gateway, QRIS, pembayaran)
  if (
    combinedText.includes('qris') || 
    combinedText.includes('payment gateway') || 
    combinedText.includes('pembayaran')
  ) {
    results.add('Pembayaran Digital');
    results.add('Keuangan');
  }

  // Dompet Digital (e-wallet)
  if (
    combinedText.includes('dompet digital') || 
    combinedText.includes('e-wallet') || 
    combinedText.includes('ewallet') || 
    combinedText.includes('gopay') || 
    combinedText.includes('ovo') || 
    combinedText.includes('dana') || 
    combinedText.includes('linkaja') || 
    combinedText.includes('shopeepay')
  ) {
    results.add('Dompet Digital');
    results.add('Keuangan');
  }

  // Asuransi (aplikasi asuransi)
  if (
    combinedText.includes('asuransi') || 
    combinedText.includes('insurance') || 
    combinedText.includes('bpjs kesehatan') || 
    combinedText.includes('prudential')
  ) {
    results.add('Asuransi');
    results.add('Keuangan');
  }

  // Produktivitas Keuangan (budgeting dan pencatatan keuangan)
  if (
    combinedText.includes('budgeting') || 
    combinedText.includes('pencatatan keuangan') || 
    combinedText.includes('catat keuangan') || 
    combinedText.includes('buku kas') || 
    combinedText.includes('anggaran') || 
    combinedText.includes('pengeluaran') || 
    combinedText.includes('money manager')
  ) {
    results.add('Produktivitas Keuangan');
    results.add('Keuangan');
  }

  // Bisnis & Wirausaha (kasir, POS, toko, kelola bisnis)
  if (
    combinedText.includes('kasir') || 
    combinedText.includes('pos') || 
    combinedText.includes('wirausaha') || 
    combinedText.includes('umkm') || 
    combinedText.includes('kelola bisnis') || 
    combinedText.includes('bukuwarung') || 
    combinedText.includes('majoo')
  ) {
    results.add('Bisnis & Wirausaha');
    results.add('Bisnis');
  }

  return Array.from(results);
}

/**
 * Determines whether an application matches the given target category.
 * Fully supports multi-label categorization and slug comparisons.
 */
export function appMatchesCategory(app: AppData, targetCategory: string): boolean {
  if (!app || !targetCategory) return false;
  const targetSlug = categoryToSlug(targetCategory);
  const targetCanonical = slugToCategoryName(targetSlug) || targetCategory;

  const appCategories = getAppCategories(app);
  return appCategories.some(c => {
    return (
      c.toLowerCase() === targetCanonical.toLowerCase() ||
      categoryToSlug(c) === targetSlug
    );
  });
}

/**
 * Returns related apps for a category based on curated affinities
 */
export function getRelatedAppsForCategory(
  categoryName: string, 
  allApps: AppData[], 
  currentCategoryApps: AppData[] = []
): AppData[] {
  const currentAppIds = new Set(currentCategoryApps.map(a => a.id));
  const relatedCategoryNames = RELATED_CATEGORIES_MAP[categoryName] || [];

  const matchedApps: AppData[] = [];
  const seenIds = new Set<string>();

  // 1. Apps from explicitly related categories
  for (const relCat of relatedCategoryNames) {
    for (const app of allApps) {
      if (!currentAppIds.has(app.id) && !seenIds.has(app.id) && appMatchesCategory(app, relCat)) {
        matchedApps.push(app);
        seenIds.add(app.id);
      }
    }
  }

  // 2. If pool is small, add popular apps that share broad affinities
  if (matchedApps.length < 8) {
    for (const app of allApps) {
      if (!currentAppIds.has(app.id) && !seenIds.has(app.id) && (app.popular || app.featured)) {
        matchedApps.push(app);
        seenIds.add(app.id);
      }
    }
  }

  return matchedApps.slice(0, 12);
}

/**
 * Aggregates all 100 categories with live app counts, download volume, and top apps.
 */
export function getCategoriesWithStats(apps: AppData[], customCategories: string[] = []): CategoryStat[] {
  const map = new Map<string, CategoryStat>();

  // 1. Initialize with canonical 100 categories
  CATEGORIES_100.forEach(name => {
    const slug = categoryToSlug(name);
    map.set(slug, {
      id: slug,
      name,
      slug,
      description: `Koleksi aplikasi dan game Android terverifikasi kategori ${name}.`,
      count: 0,
      totalDownloads: 0,
      topApps: []
    });
  });

  // 2. Add custom categories
  customCategories.forEach(catName => {
    const slug = categoryToSlug(catName);
    if (!map.has(slug)) {
      map.set(slug, {
        id: slug,
        name: catName,
        slug,
        description: `Koleksi aplikasi dan game pilihan kategori ${catName}.`,
        count: 0,
        totalDownloads: 0,
        topApps: []
      });
    }
  });

  // 3. Aggregate each app into all categories it matches (multi-label)
  apps.forEach(app => {
    const appCats = getAppCategories(app);
    appCats.forEach(catName => {
      const slug = categoryToSlug(catName);
      let cat = map.get(slug);

      if (!cat) {
        cat = {
          id: slug,
          name: catName,
          slug,
          description: `Koleksi aplikasi dan game pilihan kategori ${catName}.`,
          count: 0,
          totalDownloads: 0,
          topApps: []
        };
        map.set(slug, cat);
      }

      cat.count += 1;
      cat.totalDownloads += app.downloads || 0;
      if (!cat.topApps.some(a => a.id === app.id)) {
        cat.topApps.push(app);
      }
    });
  });

  // 4. Sort top apps for each category
  const list = Array.from(map.values()).map(cat => {
    cat.topApps.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    return cat;
  });

  // 5. Sort categories: categories with apps first, then alphabetically
  return list.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, 'id');
  });
}
