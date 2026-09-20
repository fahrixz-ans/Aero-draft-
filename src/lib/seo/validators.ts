/**
 * SEO Validation & Security Sanitization Module for Mod Station
 */

import { SeoMetaData } from './types';

export interface SeoValidationIssue {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Sanitizes input to prevent HTML script injection or metadata poisoning in SEO fields
 */
export function sanitizeSeoText(input: string = ''): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
}

/**
 * Validates a calculated SeoMetaData object and returns diagnostic issues.
 */
export function validateSeoMetaData(meta: SeoMetaData, route: string): SeoValidationIssue[] {
  const issues: SeoValidationIssue[] = [];

  // Title Checks
  if (!meta.title || meta.title.trim() === '') {
    issues.push({
      id: `title-missing-${route}`,
      severity: 'CRITICAL',
      type: 'MISSING_TITLE',
      message: `Halaman ${route} tidak memiliki judul (title) SEO.`,
    });
  } else if (meta.title.length < 15) {
    issues.push({
      id: `title-short-${route}`,
      severity: 'LOW',
      type: 'TITLE_TOO_SHORT',
      message: `Judul halaman ${route} terlalu pendek (${meta.title.length} karakter). Ideal: 30-60 karakter.`,
    });
  } else if (meta.title.length > 70) {
    issues.push({
      id: `title-long-${route}`,
      severity: 'LOW',
      type: 'TITLE_TOO_LONG',
      message: `Judul halaman ${route} berpotensi terpotong di Google (${meta.title.length} karakter).`,
    });
  }

  // Description Checks
  if (meta.robots.includes('index')) {
    if (!meta.description || meta.description.trim() === '') {
      issues.push({
        id: `desc-missing-${route}`,
        severity: 'HIGH',
        type: 'MISSING_DESCRIPTION',
        message: `Halaman indexable ${route} tidak memiliki deskripsi meta.`,
      });
    } else if (meta.description.length < 50) {
      issues.push({
        id: `desc-short-${route}`,
        severity: 'MEDIUM',
        type: 'DESCRIPTION_TOO_SHORT',
        message: `Deskripsi meta halaman ${route} terlalu pendek (${meta.description.length} karakter).`,
      });
    }
  }

  // Canonical Checks
  if (!meta.canonicalUrl || !meta.canonicalUrl.startsWith('http')) {
    issues.push({
      id: `canonical-invalid-${route}`,
      severity: 'HIGH',
      type: 'INVALID_CANONICAL',
      message: `URL Canonical untuk ${route} tidak valid: "${meta.canonicalUrl}".`,
    });
  }

  // Open Graph Checks
  if (meta.robots.includes('index') && !meta.ogImage) {
    issues.push({
      id: `og-image-missing-${route}`,
      severity: 'MEDIUM',
      type: 'MISSING_OG_IMAGE',
      message: `Halaman indexable ${route} tidak memiliki Open Graph image.`,
    });
  }

  return issues;
}
