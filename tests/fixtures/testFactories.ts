// ---------------------------------------------------------------------------
// AERO QA TEST FACTORIES (STAGE 9.12)
// Deterministic factories for testing entities (User, Developer, App, Version, Upload, Security)
// Isolated from production source of truth
// ---------------------------------------------------------------------------

import { AppEntity, VersionEntity, UploadEntity } from '../../server/repositories';

export interface SecurityScanEntity {
  scanId: string;
  versionId: string;
  sha256: string;
  status: string;
  virusTotalResult: {
    stats: { harmless: number; malicious: number; suspicious: number; undetected: number };
    scannedAt: string;
  };
  findings: any[];
  scannedAt: string;
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'DEVELOPER' | 'ADMIN' | 'SUPER_ADMIN';
  emailVerified: boolean;
}

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: `usr_${Math.random().toString(36).substring(2, 9)}`,
    email: 'testuser@example.com',
    name: 'Test User',
    role: 'USER',
    emailVerified: true,
    ...overrides
  };
}

export function createTestDeveloper(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({
    id: `dev_${Math.random().toString(36).substring(2, 9)}`,
    email: 'developer@example.com',
    name: 'Test Developer',
    role: 'DEVELOPER',
    emailVerified: true,
    ...overrides
  });
}

export function createTestAdmin(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({
    id: `admin_${Math.random().toString(36).substring(2, 9)}`,
    email: 'admin@aeroapk.com',
    name: 'Test Admin',
    role: 'ADMIN',
    emailVerified: true,
    ...overrides
  });
}

export function createTestGuest(): Partial<TestUser> {
  return {
    id: '',
    email: '',
    name: 'Guest User',
    role: 'USER',
    emailVerified: false
  };
}

export function createTestApp(overrides: Partial<AppEntity> = {}): AppEntity {
  const id = overrides.id || `app_test_${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    name: 'Test Application',
    slug: 'test-application',
    packageName: 'com.aero.testapp',
    developerName: 'Aero Test Labs',
    createdBy: 'dev_test_123',
    shortDescription: 'Clean test app for QA automation',
    description: 'Detailed description of the test application used in Stage 9.12 QA verification.',
    category: 'Produktivitas',
    categoryId: 'cat_prod',
    iconUrl: 'https://example.com/icon.png',
    bannerUrl: 'https://example.com/banner.png',
    status: 'PUBLISHED',
    distributionType: 'APK',
    downloads: 1200,
    rating: 4.8,
    reviewsCount: 350,
    size: '25 MB',
    versionName: '1.0.0',
    versionCode: 100,
    sha256: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
    latestVersionId: 'ver_test_100',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

export function createTestVersion(overrides: Partial<VersionEntity> = {}): VersionEntity {
  return {
    id: overrides.id || `ver_test_${Math.random().toString(36).substring(2, 9)}`,
    appId: overrides.appId || 'app_test_123',
    versionName: '1.0.0',
    versionCode: 100,
    changelog: 'Initial QA test release',
    sha256: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
    status: 'PUBLISHED',
    securityStatus: 'VERIFIED',
    analysisStatus: 'COMPLETED',
    minSdk: 24,
    targetSdk: 34,
    fileSize: 26214400,
    permissions: ['INTERNET'],
    architectures: ['arm64-v8a'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  } as VersionEntity;
}

export function createTestUpload(overrides: Partial<UploadEntity> = {}): UploadEntity {
  return {
    uploadId: overrides.uploadId || `upl_${Math.random().toString(36).substring(2, 9)}`,
    createdBy: overrides.createdBy || 'dev_test_123',
    appId: overrides.appId || 'app_test_123',
    fileName: 'test-application-1.0.0.apk',
    expectedSize: 26214400,
    contentType: 'application/vnd.android.package-archive',
    status: 'COMPLETED',
    objectKey: 'uploads/temp/test-application-1.0.0.apk',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export function createTestSecurityScan(overrides: Partial<SecurityScanEntity> = {}): SecurityScanEntity {
  return {
    scanId: overrides.scanId || `scan_${Math.random().toString(36).substring(2, 9)}`,
    versionId: overrides.versionId || 'ver_test_100',
    sha256: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
    status: 'VERIFIED',
    virusTotalResult: {
      stats: { harmless: 72, malicious: 0, suspicious: 0, undetected: 2 },
      scannedAt: new Date().toISOString()
    },
    findings: [],
    scannedAt: new Date().toISOString(),
    ...overrides
  };
}
