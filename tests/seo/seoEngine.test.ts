import { describe, it, expect } from 'vitest';
import { getAppPageSeo, getCategoryPageSeo, getCollectionPageSeo, getSearchPageSeo } from '../../server/seo/metadata';
import { generateSoftwareApplicationSchema, generateBreadcrumbSchema } from '../../server/seo/structuredData';
import { generateRobotsTxt } from '../../server/seo/robots';
import { generateSitemapIndexXml, generateCategoriesSitemapXml } from '../../server/seo/sitemap';
import { validateAppSeo, calculateSeoHealthScore } from '../../server/seo/validation';
import { buildSeoReportObject, generateHumanReadableSeoReportText } from '../../server/seo/reports';
import { AppData, AppCollection } from '../../src/types';

describe('Stage 9.15: SEO Engine, Metadata, Sitemaps & Reports', () => {
  const mockApp: AppData = {
    id: 'app_whatsapp',
    name: 'WhatsApp Messenger',
    slug: 'whatsapp-messenger',
    developer: 'Meta Platforms, Inc.',
    category: 'Communication',
    version: '2.26.15',
    size: '45 MB',
    androidVersion: 'Android 5.0+',
    rating: 4.6,
    downloads: 5000000,
    releaseDate: '2026-09-01',
    downloadUrl: '/apps/whatsapp-messenger/download',
    featured: true,
    popular: true,
    status: 'published',
    description: 'WhatsApp Messenger adalah aplikasi pesan instan gratis untuk Android.',
    icon: 'https://example.com/whatsapp-icon.png',
    screenshots: ['https://example.com/ss1.png'],
    updatedAt: '2026-09-01T00:00:00.000Z'
  };

  const mockCollection: AppCollection = {
    id: 'col_productivity',
    title: 'Aplikasi Produktivitas Pilihan',
    slug: 'aplikasi-produktivitas-pilihan',
    description: 'Koleksi aplikasi produktivitas terbaik di Android',
    appIds: ['app_whatsapp'],
    sortOrder: 1,
    isPublished: true,
    type: 'manual',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01'
  };

  it('generates accurate metadata and canonical URLs', () => {
    const appSeo = getAppPageSeo(mockApp);
    expect(appSeo.title).toContain('WhatsApp Messenger');
    expect(appSeo.canonicalUrl).toContain('/apps/whatsapp-messenger');
    expect(appSeo.robots).toBe('index, follow');

    const catSeo = getCategoryPageSeo('Communication');
    expect(catSeo.canonicalUrl).toContain('/categories/communication');

    const searchSeo = getSearchPageSeo('whatsapp');
    expect(searchSeo.robots).toBe('noindex, follow');
  });

  it('generates valid JSON-LD structured data', () => {
    const appSchema = generateSoftwareApplicationSchema(mockApp);
    expect(appSchema['@type']).toBe('SoftwareApplication');
    expect(appSchema.name).toBe('WhatsApp Messenger');
    expect(appSchema.softwareVersion).toBe('2.26.15');

    const breadcrumbs = generateBreadcrumbSchema([
      { name: 'Beranda', url: '/' },
      { name: 'Apps', url: '/apps' },
      { name: 'WhatsApp', url: '/apps/whatsapp-messenger' }
    ]);
    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
    expect(breadcrumbs.itemListElement).toHaveLength(3);
  });

  it('generates robots.txt disallowing private routes', () => {
    const robots = generateRobotsTxt();
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /api/admin/');
    expect(robots).toContain('Sitemap:');
  });

  it('generates sitemap index and partition XML', () => {
    const sitemapIndex = generateSitemapIndexXml();
    expect(sitemapIndex).toContain('<sitemapindex');
    expect(sitemapIndex).toContain('/sitemaps/apps.xml');

    const catSitemap = generateCategoriesSitemapXml(['Tools', 'Communication']);
    expect(catSitemap).toContain('/categories/tools');
    expect(catSitemap).toContain('/categories/communication');
  });

  it('detects SEO validation issues and calculates diagnostic health score', () => {
    const invalidApp: AppData = { ...mockApp, description: 'Short' };
    const issues = validateAppSeo(invalidApp);
    expect(issues.some(i => i.type === 'THIN_DESCRIPTION')).toBe(true);

    const score = calculateSeoHealthScore(issues, 10);
    expect(score.overall).toBeLessThan(100);
    expect(score.scannedAt).toBeDefined();
  });

  it('builds 15-section human-readable SEO report matching mandatory format', () => {
    const reportObj = buildSeoReportObject();
    const textReport = generateHumanReadableSeoReportText(reportObj);

    expect(textReport).toContain('AERO SEO REPORT');
    expect(textReport).toContain('1. EXECUTIVE SUMMARY');
    expect(textReport).toContain('2. INDEXATION');
    expect(textReport).toContain('3. TECHNICAL SEO');
    expect(textReport).toContain('4. DISCOVERY');
    expect(textReport).toContain('5. TOP LANDING PAGES');
    expect(textReport).toContain('6. TOP DISCOVERED APPS');
    expect(textReport).toContain('7. TOP CATEGORIES');
    expect(textReport).toContain('8. SEO ISSUES');
    expect(textReport).toContain('9. WORKER HEALTH');
    expect(textReport).toContain('10. PERFORMANCE');
    expect(textReport).toContain('11. GROWTH OPPORTUNITIES');
    expect(textReport).toContain('12. RECOMMENDED ACTIONS');
    expect(textReport).toContain('13. CHANGES SINCE PREVIOUS REPORT');
    expect(textReport).toContain('14. DATA QUALITY');
    expect(textReport).toContain('15. REPORT STATUS');
    expect(textReport).toContain('END OF REPORT');
  });
});
