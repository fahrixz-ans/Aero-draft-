const BASE_URL = process.env.AUTH_URL || 'https://aeroapk.com';

export function generateRobotsTxt(): string {
  return `# Robots.txt for AeroAPK
User-agent: *
Allow: /
Allow: /apps/
Allow: /categories/
Allow: /collections/

# Private, Internal, Admin & Temporary Paths Disallowed
Disallow: /admin
Disallow: /admin/
Disallow: /api/admin/
Disallow: /api/internal/
Disallow: /uploads/
Disallow: /temporary/
Disallow: /search?*

# Sitemap Location
Sitemap: ${BASE_URL}/sitemap.xml
`;
}
