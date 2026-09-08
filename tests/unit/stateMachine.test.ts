// ---------------------------------------------------------------------------
// AERO QA UNIT TESTS: STATE MACHINES (STAGE 9.12)
// App, Version, Upload, Security State Transitions Validation
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';

export type AppState = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED' | 'REJECTED';
export type VersionState =
  | 'DRAFT'
  | 'UPLOADING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'VERIFIED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'FAILED'
  | 'QUARANTINED'
  | 'ARCHIVED'
  | 'REVOKED';

export type UploadState =
  | 'CREATED'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export type SecurityState = 'PENDING' | 'SCANNING' | 'VERIFIED' | 'WARNING' | 'FAILED' | 'QUARANTINED';

const VALID_APP_TRANSITIONS: Record<AppState, AppState[]> = {
  DRAFT: ['PENDING_REVIEW', 'ARCHIVED'],
  PENDING_REVIEW: ['PUBLISHED', 'REJECTED', 'DRAFT'],
  PUBLISHED: ['UNPUBLISHED', 'ARCHIVED'],
  UNPUBLISHED: ['PUBLISHED', 'ARCHIVED'],
  REJECTED: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT']
};

const VALID_VERSION_TRANSITIONS: Record<VersionState, VersionState[]> = {
  DRAFT: ['UPLOADING', 'ARCHIVED'],
  UPLOADING: ['QUEUED', 'FAILED'],
  QUEUED: ['PROCESSING', 'FAILED'],
  PROCESSING: ['VERIFIED', 'QUARANTINED', 'FAILED'],
  VERIFIED: ['PENDING_REVIEW', 'APPROVED', 'QUARANTINED'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['PUBLISHED', 'REVOKED'],
  PUBLISHED: ['ARCHIVED', 'REVOKED', 'QUARANTINED'],
  REJECTED: ['DRAFT', 'ARCHIVED'],
  FAILED: ['DRAFT', 'ARCHIVED'],
  QUARANTINED: ['REVOKED', 'REJECTED', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
  REVOKED: [] // Terminal state
};

export function canTransitionApp(from: AppState, to: AppState): boolean {
  if (from === to) return true; // Idempotent repeated transition allowed
  return (VALID_APP_TRANSITIONS[from] || []).includes(to);
}

export function canTransitionVersion(from: VersionState, to: VersionState): boolean {
  if (from === to) return true; // Idempotent repeated transition allowed
  return (VALID_VERSION_TRANSITIONS[from] || []).includes(to);
}

describe('State Machines Validation', () => {
  describe('App State Machine', () => {
    it('allows valid app lifecycle transitions', () => {
      expect(canTransitionApp('DRAFT', 'PENDING_REVIEW')).toBe(true);
      expect(canTransitionApp('PENDING_REVIEW', 'PUBLISHED')).toBe(true);
      expect(canTransitionApp('PUBLISHED', 'UNPUBLISHED')).toBe(true);
      expect(canTransitionApp('UNPUBLISHED', 'PUBLISHED')).toBe(true);
      expect(canTransitionApp('PUBLISHED', 'ARCHIVED')).toBe(true);
    });

    it('rejects invalid or shortcut app transitions', () => {
      expect(canTransitionApp('DRAFT', 'PUBLISHED')).toBe(false); // Must pass review
      expect(canTransitionApp('ARCHIVED', 'PUBLISHED')).toBe(false);
      expect(canTransitionApp('REJECTED', 'PUBLISHED')).toBe(false);
    });

    it('handles idempotent repeated state transitions gracefully', () => {
      expect(canTransitionApp('PUBLISHED', 'PUBLISHED')).toBe(true);
      expect(canTransitionApp('DRAFT', 'DRAFT')).toBe(true);
    });
  });

  describe('Version State Machine', () => {
    it('allows complete processing flow from DRAFT to PUBLISHED', () => {
      expect(canTransitionVersion('DRAFT', 'UPLOADING')).toBe(true);
      expect(canTransitionVersion('UPLOADING', 'QUEUED')).toBe(true);
      expect(canTransitionVersion('QUEUED', 'PROCESSING')).toBe(true);
      expect(canTransitionVersion('PROCESSING', 'VERIFIED')).toBe(true);
      expect(canTransitionVersion('VERIFIED', 'APPROVED')).toBe(true);
      expect(canTransitionVersion('APPROVED', 'PUBLISHED')).toBe(true);
    });

    it('allows security quarantine or revocation transitions', () => {
      expect(canTransitionVersion('PROCESSING', 'QUARANTINED')).toBe(true);
      expect(canTransitionVersion('PUBLISHED', 'REVOKED')).toBe(true);
      expect(canTransitionVersion('PUBLISHED', 'QUARANTINED')).toBe(true);
    });

    it('enforces terminal REVOKED state', () => {
      expect(canTransitionVersion('REVOKED', 'PUBLISHED')).toBe(false);
      expect(canTransitionVersion('REVOKED', 'APPROVED')).toBe(false);
      expect(canTransitionVersion('REVOKED', 'DRAFT')).toBe(false);
    });
  });
});
