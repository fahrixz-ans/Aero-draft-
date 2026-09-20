const BASE_URL = process.env.VITE_SITE_URL || process.env.AUTH_URL || 'https://fantra.modstation.vercel.app';

export function generateRobotsTxt(baseUrl: string = BASE_URL): string {
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `# Robots.txt for Mod Station (Production)
User-agent: *
Allow: /
Allow: /apps/
Allow: /games/
Allow: /mods/
Allow: /popular
Allow: /charts
Allow: /category/
Allow: /categories/
Allow: /developer/
Allow: /developers/
Allow: /blog/
Allow: /today
Allow: /donasi
Allow: /about
Allow: /help
Allow: /faq
Allow: /contact
Allow: /terms
Allow: /privacy
Allow: /dmca
Allow: /cookies
Allow: /security
Allow: /disclaimer
Allow: /assets/

# Block administrator, developer console, owner, authentication & internal APIs
Disallow: /admin
Disallow: /admin/
Disallow: /owner
Disallow: /owner/
Disallow: /owner-console
Disallow: /owner-console/
Disallow: /developer-dashboard
Disallow: /developer-dashboard/
Disallow: /developer-console
Disallow: /developer-console/
Disallow: /api/
Disallow: /api/admin/
Disallow: /api/internal/
Disallow: /auth/
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /account/
Disallow: /profile/
Disallow: /settings/
Disallow: /notifications/
Disallow: /history/
Disallow: /favorites/
Disallow: /bookmarks/
Disallow: /temporary/
Disallow: /uploads/

# Block internal search result indexation to prevent thin-content spam
Disallow: /search
Disallow: /search/
Disallow: /search?*

# Sitemap Location
Sitemap: ${cleanBaseUrl}/sitemap.xml
`;
}
