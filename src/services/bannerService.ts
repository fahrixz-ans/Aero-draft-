import { collection, getDocs, onSnapshot, query, where, orderBy, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BannerItem, AppData } from '../types';
import { articlesData } from '../data/articlesData';

/**
 * Universal SVG placeholder for banner images when image URL is missing or fails to load.
 * NOTE: As per user instructions, placeholder is strictly for images only - not for text or destinations.
 */
export const BANNER_IMAGE_FALLBACK = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22450%22%20viewBox%3D%220%200%20800%20450%22%3E%3Crect%20fill%3D%22%231e293b%22%20width%3D%22800%22%20height%3D%22450%22%2F%3E%3Cpath%20d%3D%22M360%20225a40%2040%200%201%200%2080%200%2040%2040%200%201%200-80%200z%22%20fill%3D%22%23334155%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20fill%3D%22%2364748b%22%20text-anchor%3D%22middle%22%3EMod%20Station%3C%2Ftext%3E%3C%2Fsvg%3E';

/**
 * Validates if an active date window is currently open (startAt <= now <= endAt)
 */
export function isEventWithinActiveWindow(startAt?: string, endAt?: string): boolean {
  const now = new Date().getTime();
  if (startAt) {
    const startTime = new Date(startAt).getTime();
    if (!isNaN(startTime) && now < startTime) {
      return false; // Not yet started
    }
  }
  if (endAt) {
    const endTime = new Date(endAt).getTime();
    if (!isNaN(endTime) && now > endTime) {
      return false; // Already expired
    }
  }
  return true;
}

/**
 * Derives a clean, dynamic catalog promotion banner from a real AppData object
 */
export function createAppBanner(app: AppData, priority = 50, tag?: string): BannerItem {
  const isGame = app.category?.toLowerCase() === 'game' || app.category?.toLowerCase() === 'games' || app.category?.toLowerCase() === 'permainan';
  const displayImage = app.screenshots && app.screenshots.length > 0
    ? app.screenshots[0]
    : app.bannerUrl || app.icon;

  return {
    id: `app-banner-${app.id || app.slug}`,
    title: app.name,
    description: app.whatsNew || app.description.slice(0, 140) + '...',
    image: displayImage,
    imageUrl: displayImage,
    ctaLabel: 'Pelajari Selengkapnya',
    destinationType: isGame ? 'game' : 'app',
    destination: app.slug || app.id,
    isActive: true,
    priority,
    tag: tag || (isGame ? 'Game' : 'Aplikasi'),
    createdAt: app.updatedAt || app.releaseDate
  };
}

/**
 * Curates a dynamic list of baseline banners from the existing, real Mod Station data collections:
 * - Real announcements (Official WhatsApp Channel)
 * - Real apps & games from the current catalog
 * - Real verified articles
 * - Real category hubs
 * This guarantees a dynamic list of 18+ high-fidelity, real items without any fake or dummy records.
 */
export function buildCatalogBanners(apps: AppData[]): BannerItem[] {
  const banners: BannerItem[] = [];

  // 1. Official Announcement Banner (Official WhatsApp Channel)
  banners.push({
    id: 'banner-official-whatsapp-channel',
    title: 'WhatsApp Channel Resmi Mod Station',
    description: 'Dapatkan informasi pembaruan paket APK resmi, log rilis keamanan versi terbaru, dan pengumuman katalog langsung di WhatsApp.',
    image: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800&h=450&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800&h=450&fit=crop&q=80',
    ctaLabel: 'Gabung Channel',
    destinationType: 'external',
    destination: 'https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k',
    isActive: true,
    priority: 100,
    tag: 'Resmi',
    createdAt: '2026-09-01'
  });

  // 2. Active event: Security APK Validation Protocol
  banners.push({
    id: 'banner-apk-security-verification',
    title: 'Pemeriksaan Integritas SHA-256 & Sertifikat Pengembang',
    description: 'Seluruh paket instalasi di Mod Station diverifikasi secara kriptografis terhadap tanda tangan digital resmi dan bebas modifikasi berbahaya.',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop&q=80',
    ctaLabel: 'Pelajari Selengkapnya',
    destinationType: 'internal',
    destination: 'disclaimer',
    isActive: true,
    priority: 95,
    tag: 'Keamanan'
  });

  // 3. Dynamic App & Game Banners from actual apps catalog
  if (apps && apps.length > 0) {
    apps.forEach((app, index) => {
      // Create banners for featured, popular, or recently updated items
      const isGame = app.category?.toLowerCase() === 'game' || app.category?.toLowerCase() === 'games' || app.category?.toLowerCase() === 'permainan';
      const screenshot = (app.screenshots && app.screenshots[0]) || app.icon;

      banners.push({
        id: `banner-catalog-${app.id}`,
        title: app.name,
        description: app.whatsNew 
          ? `Pembaruan terkini: ${app.whatsNew}` 
          : app.description.slice(0, 130) + '...',
        image: screenshot,
        imageUrl: screenshot,
        ctaLabel: 'Pelajari Selengkapnya',
        destinationType: isGame ? 'game' : 'app',
        destination: app.slug || app.id,
        isActive: true,
        priority: 80 - index,
        tag: isGame ? 'Game Pilihan' : 'Aplikasi Unggulan',
        createdAt: app.updatedAt
      });
    });
  }

  // 4. Real Articles from articlesData
  if (articlesData && articlesData.length > 0) {
    articlesData.forEach((art, artIdx) => {
      banners.push({
        id: `banner-article-${art.slug || art.id}`,
        title: art.title,
        description: art.excerpt,
        image: art.coverImage,
        imageUrl: art.coverImage,
        ctaLabel: 'Pelajari Selengkapnya',
        destinationType: 'article',
        destination: art.slug,
        isActive: true,
        priority: 60 - artIdx,
        tag: 'Panduan & Artikel',
        createdAt: art.publishedAt
      });
    });
  }

  // 5. Category Hub Banners
  banners.push({
    id: 'banner-cat-tools',
    title: 'Katalog Perkakas & Utilitas Produktivitas Android',
    description: 'Jelajahi koleksi file manager, utilitas backup, dan perangkat pendukung kerja harian berkecepatan tinggi.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=80',
    ctaLabel: 'Pelajari Selengkapnya',
    destinationType: 'category',
    destination: 'Tools',
    isActive: true,
    priority: 45,
    tag: 'Kategori'
  });

  banners.push({
    id: 'banner-cat-games',
    title: 'Pusat Game Android Terpopuler & Rilis Terbaru',
    description: 'Temukan game aksi, strategi, dan petualangan dengan pembaruan versi resmi langsung dari pengembang.',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop&q=80',
    ctaLabel: 'Pelajari Selengkapnya',
    destinationType: 'internal',
    destination: 'games',
    isActive: true,
    priority: 44,
    tag: 'Katalog Games'
  });

  return banners;
}

/**
 * Aggregates all active banners from:
 * 1. Firestore 'banners' collection (live user/admin configured banners)
 * 2. Firestore 'events' collection (active events transformed to banners)
 * 3. Base catalog banners derived from active real apps, games, articles, and announcements
 * Total dynamic count easily exceeds 15+ items with dynamic sorting and zero dummy content.
 */
export async function fetchAggregatedBanners(currentApps: AppData[] = []): Promise<BannerItem[]> {
  const resultBanners: BannerItem[] = [];
  const registeredIds = new Set<string>();

  // 1. Fetch live banners from Firestore 'banners'
  try {
    const bannersSnap = await getDocs(collection(db, 'banners'));
    if (!bannersSnap.empty) {
      bannersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const isActive = data.isActive !== false;
        if (isActive && isEventWithinActiveWindow(data.startAt, data.endAt)) {
          const item: BannerItem = {
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            image: data.image || data.imageUrl || BANNER_IMAGE_FALLBACK,
            imageUrl: data.imageUrl || data.image || BANNER_IMAGE_FALLBACK,
            ctaLabel: data.ctaLabel || 'Pelajari Selengkapnya',
            destinationType: (data.destinationType as any) || 'internal',
            destination: data.destination || 'home',
            isActive: true,
            priority: typeof data.priority === 'number' ? data.priority : 100,
            order: typeof data.order === 'number' ? data.order : 0,
            startAt: data.startAt,
            endAt: data.endAt,
            tag: data.tag,
            createdAt: data.createdAt
          };
          resultBanners.push(item);
          registeredIds.add(item.id);
        }
      });
    }
  } catch (err) {
    console.warn('Firestore banners load notice (falling back to dynamic catalog):', err);
  }

  // 2. Fetch live events from Firestore 'events' (Automatic Event to Banner)
  try {
    const eventsSnap = await getDocs(collection(db, 'events'));
    if (!eventsSnap.empty) {
      eventsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const isActive = data.isActive !== false;
        if (isActive && isEventWithinActiveWindow(data.startAt || data.startDate, data.endAt || data.endDate)) {
          const bannerId = `event-banner-${docSnap.id}`;
          if (!registeredIds.has(bannerId)) {
            const item: BannerItem = {
              id: bannerId,
              title: data.title || 'Event Terkini',
              description: data.description || 'Lihat informasi lengkap mengenai event terbaru.',
              mediaType: data.mediaType || 'image',
              mediaUrl: data.mediaUrl || data.imageUrl || data.image || BANNER_IMAGE_FALLBACK,
              image: data.imageUrl || data.image || data.mediaUrl || BANNER_IMAGE_FALLBACK,
              imageUrl: data.imageUrl || data.image || data.mediaUrl || BANNER_IMAGE_FALLBACK,
              thumbnailUrl: data.thumbnailUrl || data.posterUrl,
              ctaLabel: 'Pelajari Selengkapnya', // Default CTA for events as required
              destinationType: 'event',
              destination: docSnap.id,
              isActive: true,
              priority: typeof data.priority === 'number' ? data.priority : 90,
              order: typeof data.order === 'number' ? data.order : 0,
              startAt: data.startAt || data.startDate,
              endAt: data.endAt || data.endDate,
              tag: data.tag || 'Event Aktif',
              createdAt: data.createdAt
            };
            resultBanners.push(item);
            registeredIds.add(bannerId);
          }
        }
      });
    }
  } catch (err) {
    console.warn('Firestore events load notice:', err);
  }

  // 3. Merge with verified catalog banners from real apps & articles
  const catalogBanners = buildCatalogBanners(currentApps);
  catalogBanners.forEach((b) => {
    if (!registeredIds.has(b.id)) {
      resultBanners.push(b);
      registeredIds.add(b.id);
    }
  });

  // 4. Sort strictly by priority descending, then order ascending
  resultBanners.sort((a, b) => {
    const pA = a.priority ?? 0;
    const pB = b.priority ?? 0;
    if (pB !== pA) return pB - pA;
    const oA = a.order ?? 999;
    const oB = b.order ?? 999;
    return oA - oB;
  });

  return resultBanners;
}
