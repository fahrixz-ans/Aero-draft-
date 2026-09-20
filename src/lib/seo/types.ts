/**
 * SEO Types & Page Matrix Definitions for Mod Station
 */

export type SeoRobotsDirective = 
  | 'index, follow'
  | 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  | 'noindex, follow'
  | 'noindex, nofollow';

export type SeoOgType = 'website' | 'article' | 'profile' | 'product';

export type SeoTwitterCard = 'summary' | 'summary_large_image' | 'app';

export interface SeoMetaData {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: SeoRobotsDirective;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogType: SeoOgType;
  ogSiteName: string;
  ogLocale: string;
  twitterCard: SeoTwitterCard;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterHandle?: string;
  jsonLd?: Record<string, any> | null;
  breadcrumb?: Record<string, any> | null;
}

export interface SeoPageParams {
  currentView: string;
  selectedApp?: {
    id: string;
    name: string;
    slug?: string;
    version?: string;
    developer?: string;
    category?: string;
    size?: string;
    icon?: string;
    screenshots?: string[];
    description?: string;
    rating?: number;
    downloads?: number | string;
    status?: string;
    securityStatus?: string;
    androidVersion?: string;
    updatedAt?: string;
  } | null;
  categoryFilter?: string | null;
  categorySlug?: string | null;
  developerSlug?: string | null;
  developerName?: string | null;
  blogSlug?: string | null;
  blogCategory?: string | null;
  blogTag?: string | null;
  searchQuery?: string | null;
  versionName?: string | null;
  articleSlug?: string | null;
  eventSlug?: string | null;
  helpSlug?: string | null;
}

export interface SeoMatrixRoute {
  pageType: string;
  routePattern: string;
  indexable: boolean;
  followable: boolean;
  sitemapEligible: boolean;
  requiresDynamicData: boolean;
  schemaType: string;
}

export const SEO_PAGE_MATRIX: Record<string, SeoMatrixRoute> = {
  HOME: { pageType: 'HOME', routePattern: '/', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'WebSite' },
  TODAY: { pageType: 'TODAY', routePattern: '/today', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: true, schemaType: 'CollectionPage' },
  APPS: { pageType: 'APPS', routePattern: '/apps', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'CollectionPage' },
  GAMES: { pageType: 'GAMES', routePattern: '/games', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'CollectionPage' },
  MODS: { pageType: 'MODS', routePattern: '/mods', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'CollectionPage' },
  POPULAR: { pageType: 'POPULAR', routePattern: '/popular', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'CollectionPage' },
  CHARTS: { pageType: 'CHARTS', routePattern: '/charts', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'CollectionPage' },
  CATEGORIES: { pageType: 'CATEGORIES', routePattern: '/categories', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'CollectionPage' },
  CATEGORY_DETAIL: { pageType: 'CATEGORY_DETAIL', routePattern: '/category/[slug]', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: true, schemaType: 'CollectionPage' },
  APP_DETAIL: { pageType: 'APP_DETAIL', routePattern: '/apps/[slug]', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: true, schemaType: 'SoftwareApplication' },
  APP_VERSIONS: { pageType: 'APP_VERSIONS', routePattern: '/apps/[slug]/versions', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: true, schemaType: 'SoftwareApplication' },
  APP_VERSION_DETAIL: { pageType: 'APP_VERSION_DETAIL', routePattern: '/apps/[slug]/version/[version]', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: true, schemaType: 'SoftwareApplication' },
  APP_DOWNLOAD: { pageType: 'APP_DOWNLOAD', routePattern: '/apps/[slug]/download', indexable: false, followable: false, sitemapEligible: false, requiresDynamicData: true, schemaType: 'WebPage' },
  DEVELOPERS: { pageType: 'DEVELOPERS', routePattern: '/developers', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'CollectionPage' },
  DEVELOPER_DETAIL: { pageType: 'DEVELOPER_DETAIL', routePattern: '/developer/[slug]', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: true, schemaType: 'Organization' },
  BLOG: { pageType: 'BLOG', routePattern: '/blog', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'Blog' },
  BLOG_DETAIL: { pageType: 'BLOG_DETAIL', routePattern: '/blog/[slug]', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: true, schemaType: 'BlogPosting' },
  DONATION: { pageType: 'DONATION', routePattern: '/donasi', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'WebPage' },
  PREMIUM: { pageType: 'PREMIUM', routePattern: '/premium', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'WebPage' },
  ABOUT: { pageType: 'ABOUT', routePattern: '/about', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'WebPage' },
  HELP: { pageType: 'HELP', routePattern: '/help', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'WebPage' },
  FAQ: { pageType: 'FAQ', routePattern: '/faq', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'FAQPage' },
  CONTACT: { pageType: 'CONTACT', routePattern: '/contact', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'ContactPage' },
  LEGAL_TERMS: { pageType: 'LEGAL_TERMS', routePattern: '/terms', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'WebPage' },
  LEGAL_PRIVACY: { pageType: 'LEGAL_PRIVACY', routePattern: '/privacy', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'WebPage' },
  LEGAL_DMCA: { pageType: 'LEGAL_DMCA', routePattern: '/dmca', indexable: true, followable: true, sitemapEligible: true, requiresDynamicData: false, schemaType: 'WebPage' },
  AUTH_LOGIN: { pageType: 'AUTH_LOGIN', routePattern: '/login', indexable: false, followable: false, sitemapEligible: false, requiresDynamicData: false, schemaType: 'WebPage' },
  AUTH_REGISTER: { pageType: 'AUTH_REGISTER', routePattern: '/register', indexable: false, followable: false, sitemapEligible: false, requiresDynamicData: false, schemaType: 'WebPage' },
  SEARCH: { pageType: 'SEARCH', routePattern: '/search', indexable: false, followable: true, sitemapEligible: false, requiresDynamicData: true, schemaType: 'SearchResultsPage' },
  USER_PROFILE: { pageType: 'USER_PROFILE', routePattern: '/profile', indexable: false, followable: false, sitemapEligible: false, requiresDynamicData: false, schemaType: 'WebPage' },
  OWNER_CONSOLE: { pageType: 'OWNER_CONSOLE', routePattern: '/owner-console', indexable: false, followable: false, sitemapEligible: false, requiresDynamicData: false, schemaType: 'WebPage' }
};
