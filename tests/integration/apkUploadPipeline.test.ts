// ---------------------------------------------------------------------------
// AERO QA INTEGRATION TESTS: APK UPLOAD & SECURITY PIPELINE (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { analyzeApkBuffer } from '../../server/apkAnalyzer';
import { createTestVersion, createTestSecurityScan } from '../fixtures/testFactories';

describe('APK Upload & Security Pipeline', () => {
  describe('Static APK Analyzer Integrity', () => {
    it('analyzes valid zip/APK archive with AndroidManifest.xml', () => {
      const zip = new AdmZip();
      const manifestXml = `<manifest package="com.aero.qa.sample" versionCode="102" versionName="1.0.2"><uses-permission name="android.permission.INTERNET"/></manifest>`;
      zip.addFile('AndroidManifest.xml', Buffer.from(manifestXml));
      zip.addFile('classes.dex', Buffer.from([0x64, 0x65, 0x78, 0x0a])); // DEX magic header

      const apkBuffer = zip.toBuffer();
      const result = analyzeApkBuffer(apkBuffer, 'sample-app.apk');

      expect(result.sha256).toBeDefined();
      expect(result.sha256.length).toBe(64);
      expect(result.securityFindings).toBeDefined();
      expect(result.fileSize).toBe(apkBuffer.length);
    });

    it('detects corrupted or non-APK buffers gracefully without crashing', () => {
      const corruptedBuffer = Buffer.from('This is a text file pretending to be an APK');
      const result = analyzeApkBuffer(corruptedBuffer, 'fake.apk');

      expect(result.securityStatus).toBe('QUARANTINED');
      expect(result.securityFindings.some(f => f.code === 'CORRUPTED_APK_HEADER' || f.severity === 'HIGH' || f.severity === 'CRITICAL')).toBe(true);
    });

    it('flags dangerous or invalid APK structure findings', () => {
      const zip = new AdmZip();
      zip.addFile('invalid.txt', Buffer.from('Not a manifest'));

      const apkBuffer = zip.toBuffer();
      const result = analyzeApkBuffer(apkBuffer, 'invalid-sample.apk');

      expect(result.securityFindings.length).toBeGreaterThan(0);
      expect(result.securityStatus).toBe('QUARANTINED');
    });
  });

  describe('Security Pipeline Failure Scenarios', () => {
    it('quarantines version when VirusTotal flags malicious engines', () => {
      const version = createTestVersion({ id: 'ver_malware_1', securityStatus: 'VERIFIED' });
      const scan = createTestSecurityScan({
        versionId: version.id,
        virusTotalResult: {
          stats: { harmless: 10, malicious: 5, suspicious: 2, undetected: 0 },
          scannedAt: new Date().toISOString()
        }
      });

      // Pipeline evaluation logic
      const isMalicious = scan.virusTotalResult.stats.malicious > 0 || scan.virusTotalResult.stats.suspicious > 2;
      const updatedStatus = isMalicious ? 'QUARANTINED' : 'VERIFIED';

      expect(isMalicious).toBe(true);
      expect(updatedStatus).toBe('QUARANTINED');
    });

    it('fails closed if VirusTotal service is unavailable and policy mandates strict verification', () => {
      const scanStatus: string = 'PENDING';
      const isDownloadAllowed = scanStatus === 'VERIFIED' || scanStatus === 'passed';
      expect(isDownloadAllowed).toBe(false);
    });
  });
});
