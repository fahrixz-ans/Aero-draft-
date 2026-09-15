import { firestore } from '../repositories';
import { normalizeAppData } from './metadata';
import { AppCollection } from '../../src/types';
import { appsData as INITIAL_APPS_DATA } from '../../src/data/appsData';
import { INITIAL_BLOG_DATA } from '../../src/services/blogService';

const BASE_URL = process.env.AUTH_URL || 'https://aeroapk.com';

const GAME_CATEGORIES = new Set([
  'games', 'action', 'arcade', 'adventure', 'strategy', 'rpg', 'casual',
  'simulation', 'sports', 'racing', 'puzzle', 'board', 'card'
]);

function isGame(category?: string): boolean {
  if (!category) return false;
  const clean = category.toLowerCase().trim();
  return clean.includes('game') || GAME_CATEGORIES.has(clean);
}

export function generateSitemapIndexXml(baseUrl: string = BASE_URL): string {
  const lastMod = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-apps.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-games.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/apps.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/categories.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/collections.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>
</sitemapindex>`;
}

export async function generateAppsSitemapXml(appsData?: any[], baseUrl: string = BASE_URL): Promise<string> {
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
      console.warn('[Sitemap] Error fetching apps from Firestore, using baseline catalog:', err);
    }

    // Always ensure verified baseline apps are included
    if (apps.length === 0) {
      apps = INITIAL_APPS_DATA.map(normalizeAppData).filter(a => !isGame(a.category));
    }
  }

  const urlsXml = apps.map(app => {
    const loc = `${baseUrl}/apps/${app.slug || app.id}`;
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
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/apps</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${urlsXml}
</urlset>`;
}

export async function generateGamesSitemapXml(appsData?: any[], baseUrl: string = BASE_URL): Promise<string> {
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

  const urlsXml = games.map(game => {
    const loc = `${baseUrl}/apps/${game.slug || game.id}`;
    const lastMod = (game.updatedAt || new Date().toISOString()).split('T')[0];
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
    <loc>${baseUrl}/games</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${urlsXml}
</urlset>`;
}

export function generateCategoriesSitemapXml(categoriesList?: string[], baseUrl: string = BASE_URL): string {
  const categories = categoriesList || [
    'Tools', 'Social', 'Communication', 'Productivity', 'Photography', 
    'Video Players & Editors', 'Entertainment', 'Education', 'Finance', 'Games'
  ];

  const urlsXml = categories.map(cat => {
    const slug = encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'));
    const loc = `${baseUrl}/categories/${slug}`;
    return `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${urlsXml}
</urlset>`;
}

export async function generateBlogSitemapXml(blogsData?: any[], baseUrl: string = BASE_URL): Promise<string> {
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

  const urlsXml = blogs.map(b => {
    const loc = `${baseUrl}/blog/${b.slug || b.id}`;
    const lastMod = (b.publishedAt || new Date().toISOString()).split('T')[0];
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
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${urlsXml}
</urlset>`;
}

export async function generateCollectionsSitemapXml(collectionsData?: AppCollection[], baseUrl: string = BASE_URL): Promise<string> {
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

  const urlsXml = collectionsList.map(c => {
    const loc = `${baseUrl}/collections/${c.slug || c.id}`;
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
