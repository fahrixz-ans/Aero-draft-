import { AppData } from '../../types';
import { getTrendingRankings } from '../ranking/trendingEngine';
import { getNewAndRisingApps } from '../ranking/newAndRisingEngine';

export interface SmartCollection {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  iconName: string;
  apps: AppData[];
}

/**
 * Computes live smart collections from actual catalog data and interaction intelligence
 */
export function getSmartCollections(allApps: AppData[]): SmartCollection[] {
  const publishedApps = allApps.filter(a => a.status === 'published' || !a.status);

  // 1. Most Downloaded / Actioned This Week (from 7d trending)
  const trending7d = getTrendingRankings(publishedApps, '7d', 6);
  const mostDownloadedApps = trending7d.map(t => t.app);

  // 2. Fastest Rising Apps (from New & Rising engine)
  const newAndRising = getNewAndRisingApps(publishedApps, 6);
  const fastestRisingApps = newAndRising.map(nr => nr.app);

  // 3. Recently Popular (High ratings and views)
  const recentlyPopular = [...publishedApps]
    .filter(a => a.popular || (a.rating && a.rating >= 4.3))
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 6);

  // 4. Highest Rated (Verified high satisfaction)
  const highestRated = [...publishedApps]
    .filter(a => (a.ratingAverage || a.rating || 0) >= 4.0)
    .sort((a, b) => {
      const rateA = a.ratingAverage || a.rating || 0;
      const rateB = b.ratingAverage || b.rating || 0;
      return rateB - rateA;
    })
    .slice(0, 6);

  // 5. Recently Updated (Sorted by recent date)
  const recentlyUpdated = [...publishedApps]
    .filter(a => !!a.updatedAt)
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 6);

  return [
    {
      id: 'most-downloaded-week',
      title: 'Paling Banyak Diunduh Minggu Ini',
      subtitle: 'Aplikasi pilihan paling diminati komunitas dalam 7 hari terakhir',
      badge: 'Tren 7 Hari',
      iconName: 'TrendingUp',
      apps: mostDownloadedApps
    },
    {
      id: 'fastest-rising',
      title: 'Aplikasi Tumbuh Tercepat',
      subtitle: 'Momentum pertumbuhan unduhan dan pencarian tertinggi',
      badge: 'Naik Daun',
      iconName: 'Zap',
      apps: fastestRisingApps
    },
    {
      id: 'highest-rated',
      title: 'Rating & Ulasan Terbaik',
      subtitle: 'Aplikasi dengan skor kepuasan ulasan tertinggi dari pengguna',
      badge: 'Rating 4.5+',
      iconName: 'Star',
      apps: highestRated
    },
    {
      id: 'recently-updated',
      title: 'Baru Diperbarui',
      subtitle: 'Mendapatkan peningkatan fitur, performa, dan tambalan keamanan terbaru',
      badge: 'Versi Terkini',
      iconName: 'Clock',
      apps: recentlyUpdated
    }
  ];
}
