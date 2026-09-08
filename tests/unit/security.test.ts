// ---------------------------------------------------------------------------
// AERO QA UNIT TESTS: SECURITY & AUTHORIZATION (STAGE 9.12)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createTestUser, createTestDeveloper, createTestAdmin, createTestApp } from '../fixtures/testFactories';

// Domain Security Functions
export function evaluateResourceOwnership(user: { id: string; role: string }, appDeveloperId: string): boolean {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'DEVELOPER' && user.id === appDeveloperId) return true;
  return false;
}

export function detectAutomatedBotScanner(userAgent: string): boolean {
  const dangerousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /masscan/i,
    /wpscan/i,
    /nmap/i,
    /python-requests/i,
    /gobuster/i,
    /dirbuster/i,
    /zgrab/i,
    /curl\/7\.81\.0-malicious/i
  ];
  return dangerousPatterns.some(pattern => pattern.test(userAgent));
}

export function calculateAbuseLevel(score: number): 'NORMAL' | 'WATCH' | 'RESTRICTED' | 'BLOCKED' {
  if (score >= 50) return 'BLOCKED';
  if (score >= 35) return 'RESTRICTED';
  if (score >= 20) return 'WATCH';
  return 'NORMAL';
}

describe('Security & Authorization Logic', () => {
  describe('Resource Ownership & IDOR Protection', () => {
    it('allows a developer to manage their own app', () => {
      const dev = createTestDeveloper({ id: 'dev_owner_99' });
      const app = createTestApp({ createdBy: 'dev_owner_99' });
      expect(evaluateResourceOwnership(dev, app.createdBy || '')).toBe(true);
    });

    it('denies a developer trying to access another developer app (IDOR Prevention)', () => {
      const devA = createTestDeveloper({ id: 'dev_owner_11' });
      const appB = createTestApp({ createdBy: 'dev_owner_22' });
      expect(evaluateResourceOwnership(devA, appB.createdBy || '')).toBe(false);
    });

    it('allows an admin to manage any app', () => {
      const admin = createTestAdmin({ id: 'admin_1' });
      const app = createTestApp({ createdBy: 'dev_owner_22' });
      expect(evaluateResourceOwnership(admin, app.createdBy || '')).toBe(true);
    });

    it('denies standard user access to developer operations', () => {
      const standardUser = createTestUser({ id: 'usr_normal' });
      const app = createTestApp({ createdBy: 'usr_normal' });
      expect(evaluateResourceOwnership(standardUser, app.createdBy || '')).toBe(false);
    });
  });

  describe('Bot & Security Scanner Detection', () => {
    it('flags dangerous automated vulnerability scanners', () => {
      expect(detectAutomatedBotScanner('sqlmap/1.5#stable')).toBe(true);
      expect(detectAutomatedBotScanner('Mozilla/5.0 Nikto/2.1.6')).toBe(true);
      expect(detectAutomatedBotScanner('masscan/1.0')).toBe(true);
      expect(detectAutomatedBotScanner('python-requests/2.28.0')).toBe(true);
    });

    it('allows legitimate web browser User-Agents', () => {
      expect(detectAutomatedBotScanner('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe(false);
      expect(detectAutomatedBotScanner('Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')).toBe(false);
    });
  });

  describe('Abuse Score Thresholds', () => {
    it('categorizes threat score ranges correctly', () => {
      expect(calculateAbuseLevel(0)).toBe('NORMAL');
      expect(calculateAbuseLevel(15)).toBe('NORMAL');
      expect(calculateAbuseLevel(25)).toBe('WATCH');
      expect(calculateAbuseLevel(40)).toBe('RESTRICTED');
      expect(calculateAbuseLevel(60)).toBe('BLOCKED');
    });
  });
});
