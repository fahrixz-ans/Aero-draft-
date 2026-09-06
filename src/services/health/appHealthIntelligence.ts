import { AppData, AppReport } from '../../types';
import { getLocalMetricsCache } from '../analytics/analyticsService';

export interface AppHealthDetail {
  appId: string;
  appName: string;
  status: 'healthy' | 'warning' | 'problem';
  healthScore: number; // 0 - 100
  downloadFailureRate: number; // percentage
  openReportCount: number;
  unusualActivityFlag: boolean;
  issues: string[];
  suggestedAction: string;
}

/**
 * Evaluates the health status and anomalies of an application based on real telemetry
 */
export function evaluateAppHealth(
  app: AppData,
  reports: AppReport[] = []
): AppHealthDetail {
  const localMetrics = getLocalMetricsCache()[app.id];
  const issues: string[] = [];

  // 1. Calculate download failure rate
  const downloadStarts = (localMetrics?.downloadStarts || 0) + (app.analytics?.downloadsStarted || 0);
  const downloadErrors = (localMetrics?.downloadErrors || 0) + (app.analytics?.downloadErrors || 0);
  const failureRate = downloadStarts > 0 ? (downloadErrors / downloadStarts) * 100 : 0;

  // 2. Count open reports for this app
  const appReports = reports.filter(r => r.appId === app.id && (r.status === 'open' || r.status === 'investigating'));
  const reportCount = appReports.length;

  // 3. Anomaly detection: check if reports or failures spike abnormally
  const brokenLinkReports = appReports.filter(r => r.type === 'broken_official_link' || r.type === 'unavailable_app').length;
  const downloadReports = appReports.filter(r => r.type === 'download_problem' || r.type === 'invalid_file').length;

  // Check for unusual activity (burst flag or abnormal error spike)
  let unusualActivityFlag = false;
  if (downloadErrors > 15 && failureRate > 40) {
    unusualActivityFlag = true;
    issues.push('Lonjakan kegagalan unduhan terdeteksi (>40%)');
  }

  if (reportCount >= 3) {
    issues.push(`${reportCount} laporan kendala pengguna belum terselesaikan`);
  }

  if (brokenLinkReports >= 1) {
    issues.push('Tautan unduhan/situs resmi dilaporkan tidak dapat diakses');
  }

  if (downloadReports >= 2) {
    issues.push('Beberapa pengguna melaporkan berkas APK bermasalah');
  }

  // Health Score Calculation: Start from 100 and deduct points based on verifiable problems
  let healthScore = 100;
  healthScore -= Math.min(40, failureRate * 1.5);
  healthScore -= Math.min(30, reportCount * 10);
  if (brokenLinkReports > 0) healthScore -= 25;
  if (app.healthStatus === 'problem') healthScore -= 30;

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  // Determine status (Requirement 36)
  let status: 'healthy' | 'warning' | 'problem' = 'healthy';
  let suggestedAction = 'Semua metrik berada dalam batas normal.';

  if (healthScore < 60 || reportCount >= 3 || failureRate > 25 || brokenLinkReports >= 2 || app.healthStatus === 'problem') {
    status = 'problem';
    suggestedAction = 'Segera periksa berkas APK atau perbarui tautan resmi. Pertimbangkan rilis versi patch.';
  } else if (healthScore < 80 || reportCount >= 1 || failureRate > 8 || app.healthStatus === 'warning') {
    status = 'warning';
    suggestedAction = 'Pantau ulasan & laporan terbaru pengguna untuk mencegah kendala meluas.';
  }

  return {
    appId: app.id,
    appName: app.name,
    status,
    healthScore,
    downloadFailureRate: Math.round(failureRate * 10) / 10,
    openReportCount: reportCount,
    unusualActivityFlag,
    issues,
    suggestedAction
  };
}

/**
 * Returns list of apps needing admin attention (Warning or Problem)
 */
export function getAppsRequiringAttention(
  apps: AppData[],
  reports: AppReport[] = []
): AppHealthDetail[] {
  const evaluations = apps.map(app => evaluateAppHealth(app, reports));
  return evaluations.filter(e => e.status !== 'healthy' || e.unusualActivityFlag);
}
