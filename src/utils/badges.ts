import { AppData, AppBadgeInfo } from '../types';

export function formatDownloads(num: number): string {
  if (!num || num < 0) return '0';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)}B+`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M+`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
  return num.toString();
}

/**
 * Formats a date string or timestamp into dynamic relative Indonesian text
 * e.g., "Baru saja", "1 jam lalu", "2 hari lalu", "5 hari lalu", "1 minggu lalu", "2 minggu lalu"
 */
export function getRelativeTimeString(dateString?: string): string {
  if (!dateString) return 'Baru saja';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Baru saja';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Baru saja';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} menit lalu`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} hari lalu`;
    }
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} minggu lalu`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} bulan lalu`;
    }
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} tahun lalu`;
  } catch (err) {
    return 'Baru saja';
  }
}

/**
 * Checks if a given date string is within the past X days
 */
export function isWithinPastDays(dateString?: string, days: number = 7): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  } catch {
    return false;
  }
}

/**
 * Validates whether an official download URL meets strict Verified Source criteria
 */
export function isValidVerifiedSourceUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.hostname.length > 3 && !parsed.hostname.includes(' ');
  } catch {
    return false;
  }
}

/**
 * Calculates dynamic badges for an application based on defined mathematical rules
 */
export function calculateAppBadges(app: AppData): AppBadgeInfo[] {
  const badges: AppBadgeInfo[] = [];

  // 1. NEW Badge: Created within 7 days
  const effectiveCreatedAt = app.createdAt || app.releaseDate;
  if (isWithinPastDays(effectiveCreatedAt, 7)) {
    badges.push({
      type: 'new',
      label: 'Baru',
      description: 'Aplikasi baru saja ditambahkan ke platform',
      colorClass: '',
      styleClasses: ''
    });
  }

  // 2. UPDATED Badge: Updated within 7 days
  if (isWithinPastDays(app.updatedAt, 7)) {
    const relativeTime = getRelativeTimeString(app.updatedAt);
    badges.push({
      type: 'updated',
      label: 'Update',
      description: `Aplikasi diperbarui ${relativeTime}`,
      colorClass: '',
      styleClasses: ''
    });
  }

  // 3. FEATURED Badge
  if (app.featured) {
    badges.push({
      type: 'featured',
      label: 'Featured',
      description: 'Aplikasi pilihan editorial AeroAPK',
      colorClass: '',
      styleClasses: ''
    });
  }

  // 4. POPULAR Badge: Explicit override OR threshold performance
  const isAutoPopular = (app.downloads >= 100000000) || ((app.analytics?.views || 0) >= 500) || ((app.trendingScore || 0) >= 50);
  if (app.popular || isAutoPopular) {
    badges.push({
      type: 'popular',
      label: 'Populer',
      description: 'Banyak diunduh dan dicari pengguna',
      colorClass: '',
      styleClasses: ''
    });
  }

  // 5. VERIFIED BADGE: Strict Criteria (Requirement 34)
  let isVerified = false;
  if (app.sourceType === 'apk') {
    const hasSha256 = !!(app.sha256 && app.sha256.length >= 32);
    const hasSignature = !!(app.signingCertificate?.sha256 || app.signingCertificate?.issuer);
    const hasMetadata = !!(app.packageName && (app.targetSdk || app.minSdk || app.androidVersion));
    const isApproved = app.verifiedSource === true || app.verifiedBadge === true;
    isVerified = hasSha256 && hasSignature && hasMetadata && isApproved;
  } else {
    // Official link
    const hasValidOfficialUrl = isValidVerifiedSourceUrl(app.officialUrl || app.officialDownloadUrl);
    isVerified = hasValidOfficialUrl && app.verifiedSource === true;
  }

  if (isVerified) {
    badges.push({
      type: 'verified',
      label: 'Terverifikasi',
      description: 'Berkas dan metadata telah dianalisis kriptografi dan diverifikasi aman',
      colorClass: '',
      styleClasses: ''
    });
  }

  return badges;
}
