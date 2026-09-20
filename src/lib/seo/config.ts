/**
 * Central SEO Configuration for Mod Station
 * Production Canonical Host: https://fantra.modstation.vercel.app
 */

export interface SeoConfigType {
  siteName: string;
  siteTitleTemplate: string;
  productionUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultLogo: string;
  defaultOgImage: string;
  defaultLocale: string;
  language: string;
  region: string;
  twitterHandle: string;
  defaultRobots: string;
  noIndexRobots: string;
  searchRobots: string;
  organization: {
    name: string;
    url: string;
    logo: string;
    email: string;
    sameAs: string[];
  };
}

export const SEO_CONFIG: SeoConfigType = {
  siteName: 'Mod Station',
  siteTitleTemplate: '%s | Mod Station',
  productionUrl: 'https://fantra.modstation.vercel.app',
  
  defaultTitle: 'Mod Station — Pusat Download APK Android Resmi, Aman & Cepat',
  defaultDescription: 'Mod Station adalah platform download APK Android gratis, resmi, cepat, dan terpercaya di Indonesia. Unduh ribuan aplikasi dan game populer terverifikasi aman.',
  
  defaultLogo: 'https://fantra.modstation.vercel.app/assets/mod-station-logo.svg',
  defaultOgImage: 'https://fantra.modstation.vercel.app/assets/mod-station-logo.svg',
  
  defaultLocale: 'id_ID',
  language: 'Indonesian',
  region: 'ID',
  
  twitterHandle: '@ModStation',
  
  defaultRobots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  noIndexRobots: 'noindex, nofollow',
  searchRobots: 'noindex, follow',

  organization: {
    name: 'Mod Station',
    url: 'https://fantra.modstation.vercel.app',
    logo: 'https://fantra.modstation.vercel.app/assets/mod-station-logo.svg',
    email: 'support@modstation.com',
    sameAs: [
      'https://twitter.com/ModStation',
      'https://t.me/ModStation'
    ]
  }
};

export function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const host = window.location.hostname;
    if (host.includes('modstation.vercel.app') || host.includes('fantra')) {
      return SEO_CONFIG.productionUrl;
    }
    return window.location.origin;
  }
  return SEO_CONFIG.productionUrl;
}
