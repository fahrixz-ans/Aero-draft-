import { firestore } from '../repositories';
import { normalizeAppData } from './metadata';
import { AppCollection } from '../../src/types';
import { appsData as INITIAL_APPS_DATA } from '../../src/data/appsData';
import { INITIAL_BLOG_DATA } from '../../src/services/blogService';

const BASE_URL = process.env.VITE_SITE_URL || process.env.AUTH_URL || 'https://fantra.modstation.vercel.app';

const GAME_CATEGORIES = new Set([
  'games', 'action', 'arcade', 'adventure', 'strategy', 'rpg', 'casual',
  'simulation', 'sports', 'racing', 'puzzle', 'board', 'card'
]);

function isGame(category?: string): boolean {
  if (!category) return false;
  const clean = category.toLowerCase().trim();
  return clean.includes('game') || GAME_CATEGORIES.has(clean);
}

function getCleanBaseUrl(baseUrl: string = BASE_URL): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function generateSitemapIndexXml(baseUrl: string = BASE_URL): string {
  const host = getCleanBaseUrl(baseUrl);
  const lastMod = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${host}/sitemaps/apps.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${host}/sitemaps/games.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${host}/sitemaps/categories.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${host}/sitemaps/blog.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${host}/sitemaps/collections.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
</sitemapindex>`;
}

export async function generateAppsSitemapXml(appsData?: any[], baseUrl: string = BASE_URL): Promise<string> {
  const host = getCleanBaseUrl(baseUrl);
  let apps: any[] = [];
  
  if (appsData && appsData.length > 0) {
    apps = appsData.map(normalizeAppData).filter(a => a.status === 'published' && a.securityStatus !== 'QUARANTINED' && !isGame(a.category));
  } else {
    try {
      const snapshot = await firestore.collection('applications')
        .where('status', 'in', ['PUBLISHED', 'published'])
        .get();
      if (!snapshot.empty) {
        apps = snapshot.docs
          .map(doc => normalizeAppData(doc.data()))
          .filter(a => a.status === 'published' && a.securityStatus !== 'QUARANTINED' && !isGame(a.category));
      }
    } catch (err) {
      console.warn('[Sitemap] Error fetching apps from Firestore:', err);
    }

    if (apps.length === 0) {
      apps = INITIAL_APPS_DATA.map(normalizeAppData).filter(a => !isGame(a.category));
    }
  }

  const staticUrls = [
    { loc: '/', priority: '1.0', freq: 'daily' },
    { loc: '/today', priority: '0.9', freq: 'daily' },
    { loc: '/apps', priority: '0.9', freq: 'daily' },
    { loc: '/mods', priority: '0.8', freq: 'daily' },
    { loc: '/popular', priority: '0.8', freq: 'daily' },
    { loc: '/charts', priority: '0.8', freq: 'daily' },
    { loc: '/donasi', priority: '0.7', freq: 'weekly' },
    { loc: '/premium', priority: '0.7', freq: 'weekly' },
    { loc: '/about', priority: '0.6', freq: 'monthly' },
    { loc: '/help', priority: '0.6', freq: 'monthly' },
    { loc: '/faq', priority: '0.6', freq: 'monthly' },
    { loc: '/contact', priority: '0.6', freq: 'monthly' },
    { loc: '/terms', priority: '0.5', freq: 'monthly' },
    { loc: '/privacy', priority: '0.5', freq: 'monthly' },
    { loc: '/dmca', priority: '0.5', freq: 'monthly' }
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const staticXml = staticUrls.map(u => `  <url>
    <loc>${host}${u.loc}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  const appUrlsXml = apps.map(app => {
    const slug = app.slug || app.id;
    const loc = `${host}/apps/${slug}`;
    const lastMod = (app.updatedAt || todayStr).split('T')[0];
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${appUrlsXml}
</urlset>`;
}

export async function generateGamesSitemapXml(appsData?: any[], baseUrl: string = BASE_URL): Promise<string> {
  const host = getCleanBaseUrl(baseUrl);
  let games: any[] = [];
  
  if (appsData && appsData.length > 0) {
    games = appsData.map(normalizeAppData).filter(a => a.status === 'published' && a.securityStatus !== 'QUARANTINED' && isGame(a.category));
  } else {
    try {
      const snapshot = await firestore.collection('applications')
        .where('status', 'in', ['PUBLISHED', 'published'])
        .get();
      if (!snapshot.empty) {
        games = snapshot.docs
          .map(doc => normalizeAppData(doc.data()))
          .filter(a => a.status === 'published' && a.securityStatus !== 'QUARANTINED' && isGame(a.category));
      }
    } catch (err) {
      console.warn('[Sitemap] Error fetching games from Firestore:', err);
    }

    if (games.length === 0) {
      games = INITIAL_APPS_DATA.map(normalizeAppData).filter(a => isGame(a.category));
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const urlsXml = games.map(game => {
    const slug = game.slug || game.id;
    const loc = `${host}/apps/${slug}`;
    const lastMod = (game.updatedAt || todayStr).split('T')[0];
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
    <loc>${host}/games</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${urlsXml}
</urlset>`;
}

export function generateCategoriesSitemapXml(categoriesList?: string[], baseUrl: string = BASE_URL): string {
  const host = getCleanBaseUrl(baseUrl);
  const categories = categoriesList || [
    'Tools', 'Social', 'Communication', 'Productivity', 'Photography', 
    'Video Players & Editors', 'Entertainment', 'Education', 'Finance', 'Games'
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const urlsXml = categories.map(cat => {
    const slug = encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'));
    const loc = `${host}/category/${slug}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/categories</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${urlsXml}
</urlset>`;
}

export async function generateBlogSitemapXml(blogsData?: any[], baseUrl: string = BASE_URL): Promise<string> {
  const host = getCleanBaseUrl(baseUrl);
  let blogs: any[] = [];
  
  if (blogsData && blogsData.length > 0) {
    blogs = blogsData;
  } else {
    try {
      const snapshot = await firestore.collection('blogs').get();
      if (!snapshot.empty) {
        blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('[Sitemap] Error fetching blogs from Firestore:', err);
    }

    if (blogs.length === 0) {
      blogs = INITIAL_BLOG_DATA;
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const urlsXml = blogs.map(b => {
    const loc = `${host}/blog/${b.slug || b.id}`;
    const lastMod = (b.publishedAt || todayStr).split('T')[0];
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/blog</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${urlsXml}
</urlset>`;
}

export async function generateCollectionsSitemapXml(collectionsData?: AppCollection[], baseUrl: string = BASE_URL): Promise<string> {
  const host = getCleanBaseUrl(baseUrl);
  let collectionsList: AppCollection[] = [];
  
  if (collectionsData) {
    collectionsList = collectionsData.filter(c => c.isPublished);
  } else {
    try {
      const snapshot = await firestore.collection('smart_collections')
        .where('isPublished', '==', true)
        .get();
      collectionsList = snapshot.docs.map(doc => doc.data() as AppCollection);
    } catch (err) {
      console.warn('[Sitemap] Error fetching collections:', err);
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const urlsXml = collectionsList.map(c => {
    const loc = `${host}/collections/${c.slug || c.id}`;
    const lastMod = (c.updatedAt || todayStr).split('T')[0];
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
