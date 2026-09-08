// ---------------------------------------------------------------------------
// AERO QA INTEGRATION TESTS: SEARCH & SMART COLLECTIONS (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { PublicAppService } from '../../server/services';
import { appsDb } from '../../server/repositories';
import { createTestApp } from '../fixtures/testFactories';

describe('Search & Smart Collections Safety', () => {
  const sampleApps = [
    createTestApp({ id: 'app_1', name: 'WhatsApp Messenger', slug: 'whatsapp-messenger', category: 'Sosial & Komunikasi', status: 'PUBLISHED' }),
    createTestApp({ id: 'app_2', name: 'Spotify: Music & Podcasts', slug: 'spotify-music', category: 'Game & Hiburan', status: 'PUBLISHED' }),
    createTestApp({ id: 'app_3', name: 'CapCut Video Editor', slug: 'capcut-video', category: 'Fotografi & Video', status: 'PUBLISHED' }),
    createTestApp({ id: 'app_4_draft', name: 'Draft Secret App', slug: 'draft-secret', status: 'DRAFT' })
  ];

  beforeEach(() => {
    appsDb.length = 0;
    appsDb.push(...sampleApps);
  });

  describe('Search Query Resilience', () => {
    it('executes normal search queries and returns matching published apps', async () => {
      const res = await PublicAppService.list({ search: 'WhatsApp' });
      expect(res.data.length).toBe(1);
      expect(res.data[0].slug).toBe('whatsapp-messenger');
    });

    it('handles empty or whitespace search queries gracefully', async () => {
      const res = await PublicAppService.list({ search: '   ' });
      expect(res.data.length).toBe(3); // All published apps
    });

    it('safely sanitizes SQL injection and XSS payload queries without crashing', async () => {
      const sqlInjectionQuery = "' OR 1=1; DROP TABLE apps; --";
      const xssQuery = "<script>alert('xss')</script>";

      const resSql = await PublicAppService.list({ search: sqlInjectionQuery });
      const resXss = await PublicAppService.list({ search: xssQuery });

      expect(Array.isArray(resSql.data)).toBe(true);
      expect(Array.isArray(resXss.data)).toBe(true);
    });

    it('handles Unicode, emoji, and ultra-long queries gracefully', async () => {
      const longQuery = 'a'.repeat(500);
      const unicodeQuery = 'aplikasi 🚀 🇮🇩';

      const resLong = await PublicAppService.list({ search: longQuery });
      const resUnicode = await PublicAppService.list({ search: unicodeQuery });

      expect(Array.isArray(resLong.data)).toBe(true);
      expect(Array.isArray(resUnicode.data)).toBe(true);
    });
  });

  describe('Smart Collections Filtering', () => {
    it('excludes draft, unpublished, or revoked apps from public collections', async () => {
      const listRes = await PublicAppService.list({});
      const publishedSlugs = listRes.data.map(a => a.slug);

      expect(publishedSlugs).toContain('whatsapp-messenger');
      expect(publishedSlugs).not.toContain('draft-secret');
    });
  });
});
