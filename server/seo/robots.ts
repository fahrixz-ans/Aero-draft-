const BASE_URL = process.env.AUTH_URL || 'https://aeroapk.com';

export function generateRobotsTxt(baseUrl: string = BASE_URL): string {
  return `# Robots.txt for Mod Station
User-agent: *
Allow: /
Allow: /apps/
Allow: /games/
Allow: /category/
Allow: /categories/
Allow: /developer/
Allow: /blog/
Allow: /assets/

# Block administrator, developer console, owner, authentication & internal APIs
Disallow: /admin
Disallow: /admin/
Disallow: /owner
Disallow: /owner/
Disallow: /developer-dashboard
Disallow: /developer-dashboard/
Disallow: /api/
Disallow: /api/admin/
Disallow: /api/internal/
Disallow: /auth/
Disallow: /account/
Disallow: /temporary/
Disallow: /uploads/

# Block dynamic search result indexation to prevent thin-content spam
Disallow: /search
Disallow: /search/
Disallow: /search?*

# Sitemap Location
Sitemap: ${baseUrl}/sitemap.xml
`;
}
