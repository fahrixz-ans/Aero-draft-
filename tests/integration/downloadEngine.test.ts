// ---------------------------------------------------------------------------
// AERO QA INTEGRATION TESTS: DOWNLOAD ENGINE & GATES (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { PublicAppService } from '../../server/services';
import { appsDb, versionsDb } from '../../server/repositories';
import { createTestApp, createTestVersion } from '../fixtures/testFactories';
import fs from 'fs';
import path from 'path';

describe('Download Engine & Security Gates Integration', () => {
  beforeEach(() => {
    appsDb.length = 0;
    versionsDb.length = 0;
  });

  it('allows download authorization for clean published app and version', async () => {
    const app = createTestApp({ id: 'app_download_ok', slug: 'app-download-ok', status: 'PUBLISHED' });
    const version = createTestVersion({
      id: 'ver_ok_1',
      appId: app.id,
      status: 'PUBLISHED',
      securityStatus: 'VERIFIED',
      downloadAllowed: true
    });
    (version as any).storageObjectKey = 'apps/app_download_ok/versions/ver_ok_1/app_download_ok.apk';

    // Seed dummy file in uploads/r2_storage
    const r2FilePath = path.join(process.cwd(), 'uploads', 'r2_storage', 'apps', 'app_download_ok', 'versions', 'ver_ok_1', 'app_download_ok.apk');
    fs.mkdirSync(path.dirname(r2FilePath), { recursive: true });
    fs.writeFileSync(r2FilePath, Buffer.from('PK_TEST_BINARY_APK'));

    appsDb.push(app);
    versionsDb.push(version);

    const result = await PublicAppService.getDownloadTarget('app-download-ok');
    expect(result.success).toBe(true);
    expect(result.data?.downloadUrl).toBeDefined();
    expect(result.data?.app.slug).toBe('app-download-ok');
  });

  it('blocks download if app status is UNPUBLISHED or DRAFT', async () => {
    const draftApp = createTestApp({ id: 'app_draft_1', slug: 'app-draft-1', status: 'DRAFT' });
    appsDb.push(draftApp);

    const result = await PublicAppService.getDownloadTarget('app-draft-1');
    expect(result.error).toBe('APP_NOT_FOUND');
  });

  it('blocks download if version status is QUARANTINED or MALICIOUS', async () => {
    const app = createTestApp({ id: 'app_quarantined', slug: 'app-quarantined', status: 'PUBLISHED' });
    const version = createTestVersion({ appId: app.id, status: 'PUBLISHED', securityStatus: 'QUARANTINED' });

    appsDb.push(app);
    versionsDb.push(version);

    const result = await PublicAppService.getDownloadTarget('app-quarantined');
    expect(result.error).toBe('APK_QUARANTINED');
  });

  it('blocks download if version is REVOKED by security administrator', async () => {
    const app = createTestApp({ id: 'app_revoked', slug: 'app-revoked', status: 'PUBLISHED' });
    const version = createTestVersion({ appId: app.id, status: 'PUBLISHED', securityStatus: 'VERIFIED', securityRevoked: true });

    appsDb.push(app);
    versionsDb.push(version);

    const result = await PublicAppService.getDownloadTarget('app-revoked');
    expect(result.error).toBe('VERSION_REVOKED');
  });

  it('blocks download for apps distributed via external official website links', async () => {
    const extApp = createTestApp({ id: 'app_ext_web', slug: 'app-ext-web', status: 'PUBLISHED', distributionType: 'OFFICIAL_WEBSITE' });
    appsDb.push(extApp);

    const result = await PublicAppService.getDownloadTarget('app-ext-web');
    expect(result.error).toBe('DOWNLOAD_NOT_AVAILABLE');
  });
});
