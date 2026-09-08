import { SeoIssue, SeoHealthScore } from '../../src/types';
import { normalizeAppData } from './metadata';

export function validateAppSeo(rawApp: any): SeoIssue[] {
  const app = normalizeAppData(rawApp);
  const issues: SeoIssue[] = [];
  const now = new Date().toISOString();

  if (!app.name || app.name.trim().length === 0) {
    issues.push({
      id: `issue_title_${app.id}`,
      severity: 'CRITICAL',
      type: 'MISSING_TITLE',
      message: 'App name is missing or empty',
      entityType: 'APP',
      entityId: app.id,
      detectedAt: now,
      status: 'OPEN'
    });
  }

  if (!app.description || app.description.trim().length < 30) {
    issues.push({
      id: `issue_desc_${app.id}`,
      severity: 'HIGH',
      type: 'THIN_DESCRIPTION',
      message: 'App description is missing or too short (<30 chars)',
      entityType: 'APP',
      entityId: app.id,
      detectedAt: now,
      status: 'OPEN'
    });
  }

  if (!app.icon) {
    issues.push({
      id: `issue_og_img_${app.id}`,
      severity: 'MEDIUM',
      type: 'MISSING_OG_IMAGE',
      message: 'App icon / Open Graph image is missing',
      entityType: 'APP',
      entityId: app.id,
      detectedAt: now,
      status: 'OPEN'
    });
  }

  if (app.status === 'published' && app.securityStatus === 'QUARANTINED') {
    issues.push({
      id: `issue_quarantine_index_${app.id}`,
      severity: 'CRITICAL',
      type: 'QUARANTINED_APP_INDEXABLE',
      message: 'Quarantined app is marked as published and could leak into search index',
      entityType: 'APP',
      entityId: app.id,
      detectedAt: now,
      status: 'OPEN'
    });
  }

  return issues;
}

export function calculateSeoHealthScore(allIssues: SeoIssue[], totalAppsCount: number): SeoHealthScore {
  const criticalCount = allIssues.filter(i => i.severity === 'CRITICAL' && i.status === 'OPEN').length;
  const highCount = allIssues.filter(i => i.severity === 'HIGH' && i.status === 'OPEN').length;
  const mediumCount = allIssues.filter(i => i.severity === 'MEDIUM' && i.status === 'OPEN').length;

  let deduction = (criticalCount * 25) + (highCount * 10) + (mediumCount * 3);
  let overall = Math.max(0, 100 - deduction);

  let ratingLabel: 'Critical' | 'Needs Improvement' | 'Good' | 'Excellent' = 'Excellent';
  if (overall < 50) ratingLabel = 'Critical';
  else if (overall < 70) ratingLabel = 'Needs Improvement';
  else if (overall < 85) ratingLabel = 'Good';

  return {
    overall,
    technical: Math.max(0, 100 - (criticalCount * 30)),
    indexability: Math.max(0, 100 - (criticalCount * 20 + highCount * 10)),
    discovery: Math.max(0, 100 - (highCount * 15 + mediumCount * 5)),
    ratingLabel,
    scannedAt: new Date().toISOString()
  };
}
