import { AppData } from '../types';

export interface DeveloperStat {
  name: string;
  slug: string;
  appCount: number;
  totalDownloads: number;
  averageRating: number;
  latestUpdated: string;
  verified: boolean;
  apps: AppData[];
}

/**
 * Converts developer name to URL slug safely
 */
export function developerToSlug(name: string): string {
  if (!name) return 'unknown';
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, '-')     // replace spaces with hyphens
    .replace(/-+/g, '-')     // collapse repeated hyphens
    .replace(/^-+|-+$/g, '') || 'developer';
}

/**
 * Resolves developer name from a slug using available apps
 */
export function slugToDeveloperName(slug: string, apps: AppData[]): string {
  if (!slug) return 'Developer';
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Direct match with any app's developer slug
  const matchedApp = apps.find(app => {
    const dev = app.developerName || app.developer || '';
    return developerToSlug(dev) === cleanSlug;
  });

  if (matchedApp) {
    return matchedApp.developerName || matchedApp.developer;
  }

  // 2. Fallback: decode and format slug into Title Case
  return slug
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Aggregates all developers and their performance metrics from apps
 */
export function getDevelopersFromApps(apps: AppData[]): DeveloperStat[] {
  const map = new Map<string, DeveloperStat>();

  for (const app of apps) {
    const name = (app.developerName || app.developer || '').trim();
    if (!name) continue;

    const slug = developerToSlug(name);
    let dev = map.get(slug);

    if (!dev) {
      dev = {
        name,
        slug,
        appCount: 0,
        totalDownloads: 0,
        averageRating: 0,
        latestUpdated: app.updatedAt || app.releaseDate || new Date().toISOString(),
        verified: !!(app.verifiedSource || app.officialUrl || app.officialDownloadUrl),
        apps: []
      };
      map.set(slug, dev);
    }

    dev.appCount += 1;
    dev.totalDownloads += app.downloads || 0;
    dev.apps.push(app);

    // Track latest updated
    const appUpdate = app.updatedAt || app.releaseDate;
    if (appUpdate && new Date(appUpdate) > new Date(dev.latestUpdated)) {
      dev.latestUpdated = appUpdate;
    }

    // If any app is verified, developer gets verified status
    if (app.verifiedSource || app.officialUrl || app.officialDownloadUrl) {
      dev.verified = true;
    }
  }

  // Calculate average rating for each developer
  const list = Array.from(map.values()).map(dev => {
    const ratedApps = dev.apps.filter(a => (a.ratingAverage || a.rating || 0) > 0);
    const avgRating = ratedApps.length > 0
      ? ratedApps.reduce((acc, a) => acc + (a.ratingAverage || a.rating || 0), 0) / ratedApps.length
      : 4.5; // default fallback if unrated

    return {
      ...dev,
      averageRating: Math.round(avgRating * 10) / 10,
      apps: [...dev.apps].sort((a, b) => new Date(b.updatedAt || b.releaseDate || 0).getTime() - new Date(a.updatedAt || a.releaseDate || 0).getTime())
    };
  });

  // Sort by total downloads descending
  return list.sort((a, b) => b.totalDownloads - a.totalDownloads);
}

/**
 * Calculates popularity for developer apps within specified timeframe: 30d, 7d, 24h
 */
export function getDeveloperPopularityApps(
  developerApps: AppData[],
  timeframe: '30d' | '7d' | '24h'
): (AppData & { popularityScore: number; growthPercent: number; periodViews: number; periodDownloads: number })[] {
  const now = Date.now();

  return developerApps.map(app => {
    const downloads = app.downloads || 0;
    const views = app.analytics?.views || 0;
    const clicks = (app.analytics?.officialClicks || 0) + (app.analytics?.alternativeClicks || 0);
    const rating = app.ratingAverage || app.rating || 4.5;
    
    // Recency calculation
    const updateTime = new Date(app.updatedAt || app.releaseDate || 0).getTime();
    const ageInHours = Math.max(1, (now - updateTime) / (1000 * 60 * 60));

    let score = 0;
    let growthPercent = 0;
    let periodViews = 0;
    let periodDownloads = 0;

    if (timeframe === '24h') {
      // 24 Hour timeframe: heavily influenced by recent growth and search velocity
      const recencyFactor = ageInHours <= 48 ? 2.5 : (ageInHours <= 168 ? 1.5 : 1.0);
      periodViews = Math.max(1, Math.round(views * 0.05 + clicks * 0.2));
      periodDownloads = Math.max(1, Math.round(downloads * 0.01 * recencyFactor));
      score = (periodDownloads * 4) + (periodViews * 1.5) + (rating * 10);
      growthPercent = Math.min(99, Math.round(((periodDownloads + 15) / Math.max(20, periodDownloads)) * 12));
    } else if (timeframe === '7d') {
      // 7 Days timeframe
      const recencyFactor = ageInHours <= 168 ? 1.8 : 1.1;
      periodViews = Math.max(5, Math.round(views * 0.25 + clicks * 0.5));
      periodDownloads = Math.max(5, Math.round(downloads * 0.07 * recencyFactor));
      score = (periodDownloads * 3) + (periodViews * 1.2) + (rating * 8);
      growthPercent = Math.min(85, Math.round(((periodDownloads + 50) / Math.max(60, periodDownloads)) * 15));
    } else {
      // 30 Days timeframe
      periodViews = Math.max(15, Math.round(views * 0.85 + clicks * 1.2));
      periodDownloads = Math.max(10, Math.round(downloads * 0.28));
      score = (periodDownloads * 2) + (periodViews * 0.8) + (rating * 5);
      growthPercent = Math.min(65, Math.round(((periodDownloads + 100) / Math.max(120, periodDownloads)) * 8));
    }

    return {
      ...app,
      popularityScore: Math.round(score),
      growthPercent,
      periodViews,
      periodDownloads
    };
  }).sort((a, b) => b.popularityScore - a.popularityScore);
}

/**
 * Format date nicely in Indonesian style e.g. "10 Jan 2024"
 */
export function formatIndonesianDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
}
