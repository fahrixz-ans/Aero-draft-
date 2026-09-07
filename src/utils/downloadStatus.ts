import { AppData, DownloadHistoryRecord } from '../types';

export type AppDownloadStatus = 'not_downloaded' | 'downloaded' | 'update_available';

export interface AppDownloadInfo {
  status: AppDownloadStatus;
  downloadedRecord?: DownloadHistoryRecord;
  downloadedVersion?: string;
  latestVersion: string;
  hasUpdate: boolean;
  isDownloaded: boolean;
  downloadedAt?: string;
}

/**
 * Compare two semver-like or dotted version strings (e.g., "2.24.12" vs "2.24.10").
 * Returns:
 *   1 if v1 > v2 (v1 is newer than v2)
 *  -1 if v1 < v2 (v1 is older than v2)
 *   0 if v1 === v2 (equal)
 */
export function compareVersions(v1?: string, v2?: string): number {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;

  const clean = (v: string) => v.trim().replace(/^[vV]/, '');
  const s1 = clean(v1);
  const s2 = clean(v2);

  if (s1 === s2) return 0;

  const extractParts = (str: string) => {
    const main = str.split(/[-_+]/)[0];
    return main.split('.').map(p => {
      const num = parseInt(p, 10);
      return isNaN(num) ? 0 : num;
    });
  };

  const parts1 = extractParts(s1);
  const parts2 = extractParts(s2);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const p1 = parts1[i] !== undefined ? parts1[i] : 0;
    const p2 = parts2[i] !== undefined ? parts2[i] : 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return s1.localeCompare(s2, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Evaluates the download state of an application against the user's download history.
 * Determines if the app was downloaded before and if a newer version is available.
 */
export function getAppDownloadStatus(
  app: AppData,
  history: DownloadHistoryRecord[] = []
): AppDownloadInfo {
  const latestVersion = app?.version || '1.0.0';

  if (!history || !Array.isArray(history) || history.length === 0) {
    return {
      status: 'not_downloaded',
      latestVersion,
      hasUpdate: false,
      isDownloaded: false
    };
  }

  // Match records by appId, appSlug, packageName, or exact name
  const matches = history.filter(record => {
    if (!record) return false;
    if (record.appId && (record.appId === app.id || record.appId === app.slug)) return true;
    if (record.appSlug && (record.appSlug === app.slug || record.appSlug === app.id)) return true;
    if (app.packageName && (record as any).packageName === app.packageName) return true;
    if (record.appName && app.name && String(record.appName).toLowerCase().trim() === String(app.name).toLowerCase().trim()) return true;
    return false;
  });

  if (matches.length === 0) {
    return {
      status: 'not_downloaded',
      latestVersion,
      hasUpdate: false,
      isDownloaded: false
    };
  }

  // Sort by downloadedAt descending to get the most recent download
  matches.sort((a, b) => {
    const timeA = new Date(a.downloadedAt || 0).getTime();
    const timeB = new Date(b.downloadedAt || 0).getTime();
    return timeB - timeA;
  });

  const latestRecord = matches[0];
  const downloadedVersion = latestRecord.version || '1.0.0';

  // Compare versions
  const comparison = compareVersions(latestVersion, downloadedVersion);
  let hasUpdate = comparison > 0;

  // Fallback: if semver is 0 but version strings are not identical and app was updated after download
  if (!hasUpdate && latestVersion !== downloadedVersion) {
    if (app.updatedAt && latestRecord.downloadedAt) {
      const appUpdateDate = new Date(app.updatedAt).getTime();
      const recordDate = new Date(latestRecord.downloadedAt).getTime();
      if (appUpdateDate > recordDate) {
        hasUpdate = true;
      }
    }
  }

  const status: AppDownloadStatus = hasUpdate ? 'update_available' : 'downloaded';

  return {
    status,
    downloadedRecord: latestRecord,
    downloadedVersion,
    latestVersion,
    hasUpdate,
    isDownloaded: true,
    downloadedAt: latestRecord.downloadedAt
  };
}
