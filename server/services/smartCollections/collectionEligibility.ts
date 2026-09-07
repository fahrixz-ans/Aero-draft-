import { AppEntity, VersionEntity } from '../../repositories';

export class ServerCollectionEligibility {
  static isAppEligible(app: AppEntity | null | undefined, version?: VersionEntity | null): boolean {
    if (!app) return false;

    // 1. App status must be strictly PUBLISHED
    if (app.status !== 'PUBLISHED') {
      return false;
    }

    // 2. Quarantine check (Stage 9.6)
    if ((app as any).quarantined === true) {
      return false;
    }

    // 3. Security status check
    const secStatus = ((app as any).securityStatus || 'VERIFIED').toString().toUpperCase();
    if (secStatus === 'REJECTED' || secStatus === 'QUARANTINED' || secStatus === 'REVOKED') {
      return false;
    }

    // 4. Download authorization (Stage 9.7 & 9.8)
    if ((app as any).downloadAllowed === false || (app as any).securityRevoked === true) {
      return false;
    }

    // 5. Version verification (if version is passed)
    if (version) {
      if (version.status !== 'PUBLISHED') return false;
      const secStatus = (version.securityStatus as string)?.toUpperCase();
      if (secStatus === 'REJECTED' || secStatus === 'REVOKED' || secStatus === 'QUARANTINED' || secStatus === 'FAILED') {
        return false;
      }
    }

    // 6. Basic validity
    if (!app.id || !app.name || !app.iconUrl) {
      return false;
    }

    return true;
  }
}
