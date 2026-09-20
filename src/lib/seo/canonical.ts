/**
 * Canonical URL Normalization & Helper Utilities for Mod Station
 */

import { SEO_CONFIG, getBaseUrl } from './config';

/**
 * Normalizes a URL path to produce a clean, deterministic canonical URL.
 * - Forces HTTPS & production base domain
 * - Removes query tracking parameters (utm_*, ref, gclid, etc.)
 * - Removes hashes
 * - Lowercases path components where appropriate
 */
export function buildCanonicalUrl(path: string = ''): string {
  const baseUrl = getBaseUrl();
  
  // Strip fragment identifier
  let cleanPath = path.split('#')[0];
  
  // Strip query string if present (unless query parameter is required for unique canonical representation)
  cleanPath = cleanPath.split('?')[0];
  
  // Ensure leading slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  // Clean redundant slashes
  cleanPath = cleanPath.replace(/\/+/g, '/');
  
  // Remove trailing slash for non-root paths
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }
  
  return `${baseUrl}${cleanPath}`;
}

/**
 * Escapes unsafe characters for HTML title & attribute values to prevent XSS / HTML injection.
 */
export function escapeSeoString(str: string = ''): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Truncates text cleanly at word boundary for meta description length constraints.
 */
export function truncateDescription(text: string = '', maxLen: number = 160): string {
  if (!text) return '';
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  
  const truncated = clean.substring(0, maxLen - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 100) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated + '...';
}
