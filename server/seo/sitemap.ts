import { db } from '../../src/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { normalizeAppData } from './metadata';
import { AppCollection } from '../../src/types';

const BASE_URL = process.env.AUTH_URL || 'https://aeroapk.com';

export function generateSitemapIndexXml(): string {
  const lastMod = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemaps/apps.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemaps/categories.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemaps/collections.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
</sitemapindex>`;
}

export async function generateAppsSitemapXml(appsData?: any[]): Promise<string> {
  let apps: any[] = [];
  
  if (appsData && appsData.length > 0) {
    apps = appsData.map(normalizeAppData).filter(a => a.status === 'published' && a.securityStatus !== 'QUARANTINED');
  } else {
    try {
      const q = query(collection(db, 'applications'), where('status', 'in', ['PUBLISHED', 'published']));
      const snapshot = await getDocs(q);
      apps = snapshot.docs
        .map(doc => normalizeAppData(doc.data()))
        .filter(a => a.status === 'published' && a.securityStatus !== 'QUARANTINED');
    } catch (err) {
      console.warn('[Sitemap] Error fetching apps from Firestore:', err);
    }
  }

  const urlsXml = apps.map(app => {
    const loc = `${BASE_URL}/apps/${app.slug || app.id}`;
    const lastMod = (app.updatedAt || new Date().toISOString()).split('T')[0];
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urlsXml}
</urlset>`;
}

export function generateCategoriesSitemapXml(categoriesList?: string[]): string {
  const categories = categoriesList || [
    'Tools', 'Social', 'Communication', 'Productivity', 'Photography', 
    'Video Players & Editors', 'Entertainment', 'Education', 'Finance', 'Games'
  ];

  const urlsXml = categories.map(cat => {
    const slug = encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'));
    const loc = `${BASE_URL}/categories/${slug}`;
    return `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

export async function generateCollectionsSitemapXml(collectionsData?: AppCollection[]): Promise<string> {
  let collectionsList: AppCollection[] = [];
  
  if (collectionsData) {
    collectionsList = collectionsData.filter(c => c.isPublished);
  } else {
    try {
      const q = query(collection(db, 'smart_collections'), where('isPublished', '==', true));
      const snapshot = await getDocs(q);
      collectionsList = snapshot.docs.map(doc => doc.data() as AppCollection);
    } catch (err) {
      console.warn('[Sitemap] Error fetching collections:', err);
    }
  }

  const urlsXml = collectionsList.map(c => {
    const loc = `${BASE_URL}/collections/${c.slug || c.id}`;
    const lastMod = (c.updatedAt || new Date().toISOString()).split('T')[0];
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}
