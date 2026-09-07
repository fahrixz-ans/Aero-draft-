import { AppData } from '../../../types';
import { SmartCollectionAppItem } from '../types/smartCollections';

/**
 * Validates whether an app or candidate item meets eligibility rules (Stage 9.6, 9.7, 9.8, 9.9 Section 11).
 *
 * Rules:
 * - App status MUST be published (e.g. 'published', 'PUBLISHED' or undefined in baseline public catalog).
 * - App must NOT be DRAFT, PENDING_REVIEW, REJECTED, QUARANTINED, UNPUBLISHED, or ARCHIVED.
 * - Version / APK download must not be blocked (downloadAllowed !== false, securityRevoked !== true, quarantined !== true).
 * - Security status must not be 'rejected' or 'revoked'.
 */
export function isAppEligibleForCollection(app: AppData | null | undefined): boolean {
  if (!app) return false;

  // 1. Publication status validation
  const rawStatus = (app.status || 'published').toString().toLowerCase();
  const disallowedStatuses = [
    'draft',
    'pending_review',
    'pending',
    'rejected',
    'quarantined',
    'unpublished',
    'archived',
    'revoked'
  ];

  if (disallowedStatuses.includes(rawStatus)) {
    return false;
  }

  // 2. Quarantine check (Stage 9.6)
  if ((app as any).quarantined === true) {
    return false;
  }

  // 3. Security status validation (Stage 9.6)
  const rawSecStatus = ((app as any).securityStatus || 'passed').toString().toLowerCase();
  if (rawSecStatus === 'rejected' || rawSecStatus === 'quarantined' || rawSecStatus === 'revoked') {
    return false;
  }

  // 4. Download authorization & Revocation check (Stage 9.7 & 9.8)
  if ((app as any).downloadAllowed === false) {
    return false;
  }
  if ((app as any).securityRevoked === true) {
    return false;
  }

  // 5. Basic mandatory fields
  if (!app.id || !app.name || !app.icon) {
    return false;
  }

  return true;
}

/**
 * Validates whether an app meets eligibility rules with an explanation object.
 */
export function isAppEligible(app: AppData | null | undefined): { eligible: boolean; reason?: string } {
  if (!app) return { eligible: false, reason: 'Data aplikasi tidak ditemukan' };

  const rawStatus = (app.status || 'published').toString().toLowerCase();
  const disallowedStatuses = [
    'draft', 'pending_review', 'pending', 'rejected', 'quarantined', 'unpublished', 'archived', 'revoked'
  ];
  if (disallowedStatuses.includes(rawStatus)) {
    return { eligible: false, reason: `Status aplikasi tidak memenuhi syarat (${rawStatus})` };
  }
  if ((app as any).quarantined === true) {
    return { eligible: false, reason: 'Aplikasi sedang dalam karantina keamanan' };
  }
  const rawSecStatus = ((app as any).securityStatus || 'passed').toString().toLowerCase();
  if (rawSecStatus === 'rejected' || rawSecStatus === 'quarantined' || rawSecStatus === 'revoked') {
    return { eligible: false, reason: `Status keamanan tidak lolos (${rawSecStatus})` };
  }
  if ((app as any).downloadAllowed === false) {
    return { eligible: false, reason: 'Izin unduhan aplikasi dinonaktifkan' };
  }
  if ((app as any).securityRevoked === true) {
    return { eligible: false, reason: 'Sertifikat keamanan aplikasi telah dicabut' };
  }
  if (!app.id || !app.name || !app.icon) {
    return { eligible: false, reason: 'Metadata dasar aplikasi tidak lengkap' };
  }

  return { eligible: true };
}

/**
 * Validates a SmartCollectionAppItem contract.
 */
export function isItemEligibleForCollection(item: SmartCollectionAppItem | null | undefined): boolean {
  if (!item) return false;
  if (!item.appId || !item.name || !item.iconUrl) return false;
  if (item.isPublished === false) return false;

  const sec = (item.securityStatus || 'passed').toLowerCase();
  if (sec === 'rejected' || sec === 'quarantined' || sec === 'revoked') {
    return false;
  }

  return true;
}
