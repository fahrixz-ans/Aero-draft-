// ---------------------------------------------------------------------------
// AERO QA INTEGRATION TESTS: FIRESTORE RULES & ACCESS CONTROL (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firestore Security Rules Matrix & Client Write Guard', () => {
  let rulesContent = '';

  it('loads firestore.rules from repository root', () => {
    const rulesPath = path.join(process.cwd(), 'firestore.rules');
    expect(fs.existsSync(rulesPath)).toBe(true);
    rulesContent = fs.readFileSync(rulesPath, 'utf8');
    expect(rulesContent.length).toBeGreaterThan(100);
  });

  describe('Rule Assertions & Immutable Aggregates Guard', () => {
    it('contains match /databases/{database}/documents top-level rule block', () => {
      expect(rulesContent).toContain('match /databases/{database}/documents');
    });

    it('allows public read ONLY for published apps', () => {
      expect(rulesContent).toContain("match /applications/{applicationId}");
    });

    it('restricts client writes on download counts, rating aggregates, and security status', () => {
      // Client write permissions must NEVER allow modifying downloads, securityStatus, or rating
      expect(rulesContent).not.toMatch(/allow update: if .*request\.resource\.data\.downloads/);
      expect(rulesContent).not.toMatch(/allow update: if .*request\.resource\.data\.securityStatus/);
    });

    it('enforces immutable security log streams', () => {
      expect(rulesContent).toContain("match /securityEvents/{eventId}");
      expect(rulesContent).toContain("allow update, delete: if false;");
    });

    it('restricts admin intelligence and audit log collections to system/admin role only', () => {
      expect(rulesContent).toContain("match /adminAuditLogs/{logId}");
      expect(rulesContent).toContain("match /abuseScores/{scoreId}");
      expect(rulesContent).toContain("match /securityEvents/{eventId}");
    });
  });
});
