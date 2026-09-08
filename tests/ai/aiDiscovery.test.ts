import { describe, it, expect } from 'vitest';
import { classifyQueryIntent } from '../../server/ai/intentClassifier';
import { normalizeQuery, expandQueryTerms } from '../../server/ai/queryUnderstanding';
import { scoreSemanticRelevance } from '../../server/ai/semanticMatcher';
import { rankAndFilterDiscoveryCandidates } from '../../server/ai/recommendationLayer';
import { buildAiDiscoveryReportObject, generateHumanReadableAiReportText } from '../../server/ai/reports';
import { getAiFeatureFlags, updateAiFeatureFlags } from '../../server/ai/config';
import { AppData } from '../../src/types';

describe('Stage 9.16: Advanced AI Discovery Intelligence Test Suite', () => {
  const mockApps: AppData[] = [
    {
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
    },
    {
      id: 'app_capcut',
      name: 'CapCut - Video Editor',
      slug: 'capcut-video-editor',
      developer: 'Bytedance Pte. Ltd.',
      category: 'Video Players & Editors',
      version: '10.2.1',
      size: '120 MB',
      androidVersion: 'Android 6.0+',
      rating: 4.5,
      downloads: 1000000,
      releaseDate: '2026-09-02',
      downloadUrl: '/apps/capcut-video-editor/download',
      featured: true,
      popular: true,
      status: 'published',
      description: 'CapCut adalah aplikasi edit video gratis yang mudah digunakan untuk membuat video luar biasa.',
      icon: 'https://example.com/capcut-icon.png',
      screenshots: ['https://example.com/ss2.png'],
      updatedAt: '2026-09-02T00:00:00.000Z'
    },
    {
      id: 'app_malicious',
      name: 'Suspicious App',
      slug: 'suspicious-app',
      developer: 'Unknown Dev',
      category: 'Tools',
      version: '1.0.0',
      size: '10 MB',
      androidVersion: 'Android 5.0+',
      rating: 2.1,
      downloads: 10,
      releaseDate: '2026-09-03',
      downloadUrl: '/apps/suspicious-app/download',
      featured: false,
      popular: false,
      status: 'published',
      securityStatus: 'QUARANTINED',
      description: 'This app is quarantined and should never be indexable or visible in AI recommendations.',
      icon: 'https://example.com/malicious-icon.png',
      screenshots: [],
      updatedAt: '2026-09-03T00:00:00.000Z'
    }
  ];

  it('1. classifies user query intents with high confidence levels', () => {
    const intent1 = classifyQueryIntent('apps like capcut');
    expect(intent1.type).toBe('SIMILAR_APP');
    expect(intent1.targetAppSlug).toBe('capcut');
    expect(intent1.confidence).toBeGreaterThanOrEqual(0.85);

    const intent2 = classifyQueryIntent('best video editor');
    expect(intent2.type).toBe('RECOMMENDATION');
    expect(intent2.confidence).toBeGreaterThanOrEqual(0.85);

    const intent3 = classifyQueryIntent('whatsapp latest');
    expect(intent3.type).toBe('VERSION_DISCOVERY');
    expect(intent3.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('2. normalizes and expands query terms safely', () => {
    const query = '  video editor!!!  ';
    const normalized = normalizeQuery(query);
    expect(normalized).toBe('video editor');

    const expansions = expandQueryTerms('video editor');
    expect(expansions).toContain('pembuat video');
    expect(expansions).toContain('video editing');
  });

  it('3. scores semantic app relevance accurately without hallucinatory data', () => {
    const results = scoreSemanticRelevance('capcut', mockApps);
    const capcutResult = results.find(r => r.appId === 'app_capcut');
    const whatsappResult = results.find(r => r.appId === 'app_whatsapp');

    expect(capcutResult?.relevanceScore).toBeGreaterThan(0.5);
    expect(whatsappResult?.relevanceScore).toBeLessThan(0.3);
  });

  it('4. ensures security eligibility (quarantined apps must be absolutely excluded)', () => {
    const result = rankAndFilterDiscoveryCandidates('apps', mockApps);
    const containsMalicious = result.apps.some(a => a.id === 'app_malicious');
    expect(containsMalicious).toBe(false);
  });

  it('5. applies diversity penalties to prevent developer/category saturation', () => {
    const result = rankAndFilterDiscoveryCandidates('video', mockApps);
    expect(result.apps[0].id).toBe('app_capcut');
    expect(result.explanations['app_capcut']).toBeDefined();
  });

  it('6. handles graceful deterministic fallback when AI is disabled via feature flags', () => {
    updateAiFeatureFlags({ AI_DISCOVERY_ENABLED: false });
    const result = rankAndFilterDiscoveryCandidates('whatsapp', mockApps);
    expect(result.fallbackUsed).toBe(true);
    expect(result.confidence.level).toBe('LOW');
    expect(result.apps).toHaveLength(2); // Only eligible non-quarantined apps
    
    // Restore flag
    updateAiFeatureFlags({ AI_DISCOVERY_ENABLED: true });
  });

  it('7. builds the exact 18-section human-readable implementation report', () => {
    const report = buildAiDiscoveryReportObject();
    const txt = generateHumanReadableAiReportText(report);

    expect(txt).toContain('AERO — STAGE 9.16 FINAL IMPLEMENTATION REPORT');
    expect(txt).toContain('1. STATUS');
    expect(txt).toContain('2. REPOSITORY AUDIT');
    expect(txt).toContain('3. AUTHENTICATION AUDIT');
    expect(txt).toContain('4. AI DISCOVERY');
    expect(txt).toContain('5. DISTRIBUTION CONTRACT');
    expect(txt).toContain('6. WORKER');
    expect(txt).toContain('7. SECURITY');
    expect(txt).toContain('8. ANALYTICS');
    expect(txt).toContain('9. PERFORMANCE');
    expect(txt).toContain('10. TESTING');
    expect(txt).toContain('11. AI HEALTH');
    expect(txt).toContain('12. ISSUES');
    expect(txt).toContain('13. DEFERRED WORK');
    expect(txt).toContain('14. FILE CHANGE SUMMARY');
    expect(txt).toContain('15. FEATURE FLAGS');
    expect(txt).toContain('16. FINAL ACCEPTANCE');
    expect(txt).toContain('17. FINAL ARCHITECTURE STATUS');
    expect(txt).toContain('18. FINAL ROADMAP STATUS');
    expect(txt).toContain('END OF AERO STAGE 9.16 FINAL IMPLEMENTATION REPORT');
  });
});
