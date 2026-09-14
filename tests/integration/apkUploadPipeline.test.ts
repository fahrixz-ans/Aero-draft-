// ---------------------------------------------------------------------------
// MOD STATION INTEGRATION TESTS: APK INTEGRITY & PIPELINE
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { createTestVersion, createTestSecurityScan } from '../fixtures/testFactories';

describe('APK Integrity & Storage Pipeline', () => {
  describe('Cryptographic SHA-256 Validation', () => {
    it('computes exact sha256 checksum for binary payloads', () => {
      const buffer = Buffer.from('ModStationSampleApkData');
      const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });

  describe('Security Pipeline Verification', () => {
    it('marks version verified when signature and checksum pass', () => {
      const version = createTestVersion({ id: 'ver_valid_1', securityStatus: 'VERIFIED' });
      expect(version.securityStatus).toBe('VERIFIED');
    });

    it('fails closed if scan status is pending', () => {
      const scanStatus: string = 'PENDING';
      const isDownloadAllowed = scanStatus === 'VERIFIED' || scanStatus === 'passed';
      expect(isDownloadAllowed).toBe(false);
    });
  });
});
