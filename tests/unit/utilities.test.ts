// ---------------------------------------------------------------------------
// AERO QA UNIT TESTS: UTILITIES (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';

// Utility functions under test
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function sanitizeFilename(filename: string): string {
  // Prevent Path Traversal attacks (.. / \ null bytes)
  const basename = filename.split(/[/\\]/).pop() || 'file.apk';
  return basename
    .replace(/\0/g, '')
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .replace(/\.{2,}/g, '.');
}

export function calculateFreshnessDays(updatedAtISO: string): number {
  const diffMs = Date.now() - new Date(updatedAtISO).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function paginateArray<T>(items: T[], page = 1, pageSize = 20): { data: T[]; total: number; totalPages: number } {
  const validPage = Math.max(1, page);
  const validPageSize = Math.max(1, Math.min(100, pageSize));
  const total = items.length;
  const totalPages = Math.ceil(total / validPageSize) || 1;
  const startIndex = (validPage - 1) * validPageSize;
  const data = items.slice(startIndex, startIndex + validPageSize);
  return { data, total, totalPages };
}

export function calculateConversionRate(downloads: number, impressions: number): number {
  if (!impressions || impressions <= 0) return 0;
  return Math.min(100, Number(((downloads / impressions) * 100).toFixed(2)));
}

describe('Utilities & Formatters', () => {
  describe('Slug Generation', () => {
    it('generates clean URL slugs from app titles', () => {
      expect(generateSlug('WhatsApp Messenger')).toBe('whatsapp-messenger');
      expect(generateSlug(' CapCut - Video Editor 2026! ')).toBe('capcut-video-editor-2026');
      expect(generateSlug('Spotify: Music & Podcasts')).toBe('spotify-music-podcasts');
    });

    it('handles non-alphanumeric and multiple dashes gracefully', () => {
      expect(generateSlug('App @#$ Name')).toBe('app-name');
      expect(generateSlug('Aero---APK___App')).toBe('aero-apk-app');
    });
  });

  describe('Filename Sanitizer (Path Traversal Protection)', () => {
    it('strips directory paths and prevents path traversal attempts', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('..\\..\\Windows\\System32\\cmd.exe')).toBe('cmd.exe');
      expect(sanitizeFilename('../uploads/malicious.apk')).toBe('malicious.apk');
    });

    it('removes null bytes and dangerous character patterns', () => {
      expect(sanitizeFilename('shell.php\0.apk')).toBe('shell.php.apk');
      expect(sanitizeFilename('my app (1) <v2>.apk')).toBe('my_app__1___v2_.apk');
    });
  });

  describe('Freshness Calculation', () => {
    it('calculates accurate freshness in days', () => {
      const now = new Date().toISOString();
      expect(calculateFreshnessDays(now)).toBe(0);

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(calculateFreshnessDays(threeDaysAgo)).toBe(3);
    });
  });

  describe('Pagination Logic', () => {
    it('paginates data correctly and clamps page sizes', () => {
      const mockList = Array.from({ length: 45 }, (_, i) => i + 1);
      const resPage1 = paginateArray(mockList, 1, 20);
      expect(resPage1.data.length).toBe(20);
      expect(resPage1.total).toBe(45);
      expect(resPage1.totalPages).toBe(3);

      const resPage3 = paginateArray(mockList, 3, 20);
      expect(resPage3.data.length).toBe(5);
      expect(resPage3.data[0]).toBe(41);
    });
  });

  describe('Conversion Rate Calculation', () => {
    it('returns accurate percentage and handles zero impressions gracefully', () => {
      expect(calculateConversionRate(50, 200)).toBe(25);
      expect(calculateConversionRate(10, 0)).toBe(0);
      expect(calculateConversionRate(300, 200)).toBe(100);
    });
  });
});
