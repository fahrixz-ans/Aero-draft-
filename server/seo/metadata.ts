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

export function getAppPageSeo(rawApp: any, baseUrl: string = BASE_URL): PageSeoMetadata {
  const app = normalizeAppData(rawApp);
  const isEligible = app.status === 'published' && app.securityStatus !== 'QUARANTINED';
  const canonicalUrl = `${baseUrl}/apps/${app.slug || app.id}`;
  const title = `${app.name} APK — Download & Info | Mod Station`;
  const description = `Unduh APK ${app.name} versi ${app.version} karya ${app.developer}. Ukuran ${app.size || 'N/A'}, kategori ${app.category}. Bebas malware dan terverifikasi aman di Mod Station.`;
  const ogImage = app.icon || `${baseUrl}/assets/mod-station-logo.svg`;

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

export function getCategoryPageSeo(categoryName: string, baseUrl: string = BASE_URL): PageSeoMetadata {
  const slug = encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, '-'));
  const canonicalUrl = `${baseUrl}/categories/${slug}`;
  const title = `Aplikasi ${categoryName} Android — Mod Station`;
  const description = `Temukan dan unduh aplikasi APK kategori ${categoryName} Android terbaik, resmi, dan terverifikasi di Mod Station.`;
  const ogImage = `${baseUrl}/assets/mod-station-logo.svg`;

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

export function getDeveloperPageSeo(developerName: string, slug?: string, baseUrl: string = BASE_URL): PageSeoMetadata {
  const devSlug = slug || encodeURIComponent(developerName.toLowerCase().replace(/\s+/g, '-'));
  const canonicalUrl = `${baseUrl}/developer/${devSlug}`;
  const title = `${developerName} — Unduh Aplikasi & Game Android | Mod Station`;
  const description = `Daftar aplikasi dan game Android resmi yang dikembangkan oleh ${developerName} di Mod Station.`;
  const ogImage = `${baseUrl}/assets/mod-station-logo.svg`;

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogType: 'profile',
    robots: 'index, follow'
  };
}

export function getCollectionPageSeo(collection: AppCollection, baseUrl: string = BASE_URL): PageSeoMetadata {
  const isEligible = collection.isPublished;
  const canonicalUrl = `${baseUrl}/collections/${collection.slug || collection.id}`;
  const title = `${collection.title} — Koleksi APK Android | Mod Station`;
  const description = collection.description || `Koleksi aplikasi Android pilihan: ${collection.title} di Mod Station.`;
  const ogImage = collection.bannerUrl || `${baseUrl}/assets/mod-station-logo.svg`;

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

export function getBlogPageSeo(blog: any, baseUrl: string = BASE_URL): PageSeoMetadata {
  const canonicalUrl = `${baseUrl}/blog/${blog.slug || blog.id}`;
  const title = `${blog.title} — Mod Station Blog`;
  const description = blog.excerpt || blog.description || blog.title;
  const ogImage = blog.coverImage || `${baseUrl}/assets/mod-station-logo.svg`;

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogType: 'article',
    robots: 'index, follow'
  };
}

export function getSearchPageSeo(query?: string, baseUrl: string = BASE_URL): PageSeoMetadata {
  const canonicalUrl = `${baseUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  const title = query ? `Hasil Pencarian untuk "${query}" — Mod Station` : 'Cari Aplikasi & Game Android — Mod Station';
  const description = query ? `Hasil pencarian aplikasi APK Android untuk ${query} di Mod Station.` : 'Cari dan temukan aplikasi Android resmi terverifikasi di Mod Station.';

  return {
    title,
    description,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage: `${baseUrl}/assets/mod-station-logo.svg`,
    ogType: 'website',
    robots: 'noindex, follow'
  };
}
