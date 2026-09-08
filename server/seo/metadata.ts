import { AppData, AppCollection } from '../../src/types';

export interface PageSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  robots: string;
}

const BASE_URL = process.env.AUTH_URL || 'https://aeroapk.com';

export function normalizeAppData(app: any): AppData {
  return {
    id: app.id,
    name: app.name,
    slug: app.slug || app.id,
    developer: app.developer || app.developerName || 'Developer Resmi',
    category: app.category || 'Utilities',
    version: app.version || app.versionName || '1.0.0',
    size: app.size || 'N/A',
    androidVersion: app.androidVersion || 'Android 5.0+',
    rating: app.rating || 4.5,
    downloads: app.downloads || 0,
    releaseDate: app.releaseDate || app.createdAt || new Date().toISOString().split('T')[0],
    downloadUrl: app.downloadUrl || `/apps/${app.slug || app.id}/download`,
    featured: !!app.featured,
    popular: !!app.popular,
    status: (app.status === 'PUBLISHED' || app.status === 'published') ? 'published' : (app.status?.toLowerCase() as any) || 'draft',
    description: app.description || app.shortDescription || '',
    icon: app.icon || app.iconUrl || '',
    screenshots: app.screenshots || (app.bannerUrl ? [app.bannerUrl] : []),
    updatedAt: app.updatedAt || new Date().toISOString(),
    securityStatus: app.securityStatus
  };
}

export function getAppPageSeo(rawApp: any): PageSeoMetadata {
  const app = normalizeAppData(rawApp);
  const isEligible = app.status === 'published' && app.securityStatus !== 'QUARANTINED';
  const canonicalUrl = `${BASE_URL}/apps/${app.slug || app.id}`;
  const title = `${app.name} APK v${app.version} — Download & Info Android | AERO`;
  const description = `Unduh APK ${app.name} versi ${app.version} resmi karya ${app.developer}. Ukuran ${app.size || 'N/A'}, terverifikasi aman di AERO.`;
  const ogImage = app.icon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop&q=80';

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogType: 'website',
    robots: isEligible ? 'index, follow' : 'noindex, follow'
  };
}

export function getCategoryPageSeo(categoryName: string): PageSeoMetadata {
  const slug = encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, '-'));
  const canonicalUrl = `${BASE_URL}/categories/${slug}`;
  const title = `Aplikasi Android Kategori ${categoryName} Terbaik — AERO`;
  const description = `Temukan dan unduh APK Android terpopuler di kategori ${categoryName}. Gratis, cepat, dan terverifikasi aman di AERO.`;
  const ogImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop&q=80';

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogType: 'website',
    robots: 'index, follow'
  };
}

export function getCollectionPageSeo(collection: AppCollection): PageSeoMetadata {
  const isEligible = collection.isPublished;
  const canonicalUrl = `${BASE_URL}/collections/${collection.slug || collection.id}`;
  const title = `${collection.title} — Koleksi APK Android | AERO`;
  const description = collection.description || `Koleksi aplikasi Android pilihan: ${collection.title} di AERO.`;
  const ogImage = collection.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop&q=80';

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogType: 'website',
    robots: isEligible ? 'index, follow' : 'noindex, follow'
  };
}

export function getSearchPageSeo(query?: string): PageSeoMetadata {
  const canonicalUrl = `${BASE_URL}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  const title = query ? `Hasil Pencarian untuk "${query}" — AERO` : 'Cari Aplikasi & Game Android — AERO';
  const description = query ? `Hasil pencarian APK Android untuk ${query} di AERO.` : 'Cari dan temukan aplikasi Android resmi terverifikasi di AERO.';

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop&q=80',
    ogType: 'website',
    robots: 'noindex, follow'
  };
}
