// ---------------------------------------------------------------------------
// AERO QA UNIT TESTS: VERSION MANAGEMENT & CERTIFICATES (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';

export function compareSemver(v1: string, v2: string): number {
  const p1 = v1.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = v2.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);

  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function validateVersionUpgrade(
  currentVersionCode: number,
  newVersionCode: number,
  currentCertSha256: string,
  newCertSha256: string
): { valid: boolean; error?: string } {
  if (newVersionCode <= currentVersionCode) {
    return {
      valid: false,
      error: `VersionCode baru (${newVersionCode}) harus lebih besar dari VersionCode aktif (${currentVersionCode}).`
    };
  }

  if (currentCertSha256 && newCertSha256 && currentCertSha256.toUpperCase() !== newCertSha256.toUpperCase()) {
    return {
      valid: false,
      error: `Mismatched APK signing certificate. Sertifikat pengembang (${newCertSha256}) berbeda dengan versi aktif (${currentCertSha256}).`
    };
  }

  return { valid: true };
}

describe('Version Management & Signing Certificate Validation', () => {
  describe('Semantic Version Comparison', () => {
    it('compares semver strings accurately', () => {
      expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
      expect(compareSemver('2.1.0', '1.9.9')).toBe(1);
      expect(compareSemver('2.4.12', '2.4.12')).toBe(0);
      expect(compareSemver('2.10.0', '2.2.0')).toBe(1); // Crucial check: 10 > 2
    });
  });

  describe('Version Upgrade & Certificate Consistency Guard', () => {
    it('allows valid version upgrades with matching certificates', () => {
      const cert = 'A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
      const result = validateVersionUpgrade(100, 101, cert, cert);
      expect(result.valid).toBe(true);
    });

    it('rejects version downgrade or identical versionCode', () => {
      const cert = 'A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
      expect(validateVersionUpgrade(100, 100, cert, cert).valid).toBe(false);
      expect(validateVersionUpgrade(105, 100, cert, cert).valid).toBe(false);
    });

    it('rejects APK update if signing certificate signature changes (Security Breach Protection)', () => {
      const certOld = 'AAAAA3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
      const certNew = 'BBBBB3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
      const result = validateVersionUpgrade(100, 101, certOld, certNew);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Mismatched APK signing certificate');
    });
  });
});
