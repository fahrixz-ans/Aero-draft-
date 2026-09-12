import { AppData } from '../types';
import { CATEGORIES_METADATA } from '../components/views/CategoriesView';

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
 * Converts category name to URL-friendly slug
 */
export function categoryToSlug(name: string): string {
  if (!name) return 'kategori';
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'kategori';
}

/**
 * Resolves category name from a slug
 */
export function slugToCategoryName(slug: string, apps: AppData[], customCategories: string[] = []): string {
  if (!slug) return 'Kategori';
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Match against known categories metadata
  const metaMatch = CATEGORIES_METADATA.find(m => categoryToSlug(m.name) === cleanSlug);
  if (metaMatch) return metaMatch.name;

  // 2. Match against custom categories
  const customMatch = customCategories.find(c => categoryToSlug(c) === cleanSlug);
  if (customMatch) return customMatch;

  // 3. Match against apps categories
  const appMatch = apps.find(a => a.category && categoryToSlug(a.category) === cleanSlug);
  if (appMatch) return appMatch.category;

  // Fallback Title Case
  return slug
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Aggregates all categories with counts, download volume, and top apps
 */
export function getCategoriesWithStats(apps: AppData[], customCategories: string[] = []): CategoryStat[] {
  const map = new Map<string, CategoryStat>();

  // Initialize known metadata categories
  CATEGORIES_METADATA.forEach(meta => {
    const slug = categoryToSlug(meta.name);
    map.set(slug, {
      id: slug,
      name: meta.name,
      slug,
      description: meta.description,
      count: 0,
      totalDownloads: 0,
      topApps: []
    });
  });

  // Add any custom categories
  customCategories.forEach(catName => {
    const slug = categoryToSlug(catName);
    if (!map.has(slug)) {
      map.set(slug, {
        id: slug,
        name: catName,
        slug,
        description: `Koleksi aplikasi dan game pilihan kategori ${catName}`,
        count: 0,
        totalDownloads: 0,
        topApps: []
      });
    }
  });

  // Aggregate apps into categories
  apps.forEach(app => {
    const catName = (app.category || '').trim();
    if (!catName) return;

    const slug = categoryToSlug(catName);
    let cat = map.get(slug);

    if (!cat) {
      cat = {
        id: slug,
        name: catName,
        slug,
        description: `Koleksi aplikasi dan game pilihan kategori ${catName}`,
        count: 0,
        totalDownloads: 0,
        topApps: []
      };
      map.set(slug, cat);
    }

    cat.count += 1;
    cat.totalDownloads += app.downloads || 0;
    cat.topApps.push(app);
  });

  // Sort topApps for each category by downloads / rating
  const list = Array.from(map.values()).map(cat => {
    cat.topApps.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    return cat;
  });

  // Sort categories by count and download volume
  return list.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.totalDownloads - a.totalDownloads;
  });
}
