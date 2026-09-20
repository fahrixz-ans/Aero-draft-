/**
 * Master SEO Resolver for Mod Station
 * Resolves comprehensive, dynamic, production-safe SEO metadata for every route and view.
 */

import { SEO_CONFIG } from './config';
import { SeoMetaData, SeoPageParams, SeoRobotsDirective, SeoOgType } from './types';
import { buildCanonicalUrl, truncateDescription, escapeSeoString } from './canonical';
import { sanitizeSeoText } from './validators';
import {
  buildWebSiteSchema,
  buildSoftwareApplicationSchema,
  buildBlogPostingSchema,
  buildCollectionPageSchema,
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildFaqPageSchema
} from './structuredData';

export function resolveSeoMetadata(params: SeoPageParams): SeoMetaData {
  const {
    currentView,
    selectedApp,
    categoryFilter,
    categorySlug,
    developerSlug,
    developerName,
    blogSlug,
    blogCategory,
    blogTag,
    searchQuery,
    versionName,
    articleSlug,
    eventSlug,
    helpSlug
  } = params;

  const defaultLogo = SEO_CONFIG.defaultLogo;

  // Baseline defaults with explicit primitive types
  let title: string = SEO_CONFIG.defaultTitle;
  let description: string = SEO_CONFIG.defaultDescription;
  let canonicalPath: string = '/';
  let robots: SeoRobotsDirective = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  let ogType: SeoOgType = 'website';
  let ogImage: string = SEO_CONFIG.defaultOgImage;
  let jsonLd: Record<string, any> | null = null;
  let breadcrumb: Record<string, any> | null = null;

  // Normalization of view string
  const view = (currentView || 'home').toLowerCase().trim();

  // ---------------------------------------------------------------------------
  // 1. CORE / DISCOVERY VIEWS
  // ---------------------------------------------------------------------------
  if (view === 'home' || view === '' || view === 'index') {
    title = 'Mod Station — Pusat Download APK Android Resmi, Aman & Cepat';
    description = 'Mod Station adalah platform download APK Android gratis, resmi, cepat, dan terpercaya di Indonesia. Unduh ribuan aplikasi dan game populer terverifikasi aman.';
    canonicalPath = '/';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildWebSiteSchema();
  }
  else if (view === 'today' || view === 'today-dashboard') {
    title = 'Hari Ini | Mod Station';
    description = 'Temukan kurasi harian aplikasi pilihan, game Android trending, artikel terbaru, dan update modifikasi terverifikasi aman di Mod Station.';
    canonicalPath = '/today';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Hari Ini di Mod Station', description, '/today');
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Beranda', url: '/' },
      { name: 'Hari Ini', url: '/today' }
    ]);
  }
  else if (view === 'apps' || view === 'all-apps') {
    title = 'Aplikasi Android | Mod Station';
    description = 'Jelajahi dan unduh koleksi aplikasi APK Android resmi, utilitas produktivitas, sosial, dan alat terbaik terverifikasi bebas malware.';
    canonicalPath = '/apps';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Aplikasi Android', description, '/apps');
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Beranda', url: '/' },
      { name: 'Aplikasi', url: '/apps' }
    ]);
  }
  else if (view === 'games' || view === 'all-games') {
    title = 'Game Android | Mod Station';
    description = 'Unduh game APK Android terbaik, action, arcade, RPG, petualangan, dan simulasi terverifikasi aman tanpa iklan berbahaya di Mod Station.';
    canonicalPath = '/games';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Game Android', description, '/games');
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Beranda', url: '/' },
      { name: 'Game', url: '/games' }
    ]);
  }
  else if (view === 'mods' || view === 'mod-apps') {
    title = 'Mod Android | Mod Station';
    description = 'Temukan rilis modifikasi aplikasi dan game Android terverifikasi aman dengan fitur unlocked, bebas iklan, dan peningkat performa di Mod Station.';
    canonicalPath = '/mods';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Mod Android', description, '/mods');
  }
  else if (view === 'popular' || view === 'trending') {
    title = 'Aplikasi Populer | Mod Station';
    description = 'Daftar aplikasi dan game Android terpopuler yang paling banyak diunduh dan digunakan pengguna di Indonesia.';
    canonicalPath = '/popular';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Aplikasi Populer', description, '/popular');
  }
  else if (view === 'charts' || view === 'rankings') {
    title = 'Chart Aplikasi & Game | Mod Station';
    description = 'Peringkat resmi aplikasi dan game Android terbaik berdasarkan jumlah unduhan, ulasan pengguna, dan skor tren di Mod Station.';
    canonicalPath = '/charts';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Chart Aplikasi', description, '/charts');
  }

  // ---------------------------------------------------------------------------
  // 2. CATEGORY VIEWS
  // ---------------------------------------------------------------------------
  else if (view === 'categories' || view === 'all-categories') {
    title = 'Kategori Aplikasi & Game | Mod Station';
    description = 'Jelajahi seluruh kategori aplikasi dan game Android di Mod Station: Produktivitas, Alat, Komunikasi, Hiburan, Keuangan, dan Game.';
    canonicalPath = '/categories';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Kategori Aplikasi & Game', description, '/categories');
  }
  else if (view === 'category' || view === 'category-detail') {
    const rawCat = categoryFilter || categorySlug || 'Android';
    const catName = rawCat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const slug = rawCat.toLowerCase().replace(/\s+/g, '-');
    
    title = `Aplikasi ${catName} Android | Mod Station`;
    description = `Unduh aplikasi dan game APK kategori ${catName} terbaik untuk Android. Resmi, terverifikasi aman dari malware, dan cepat di Mod Station.`;
    canonicalPath = `/category/${slug}`;
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema(`Aplikasi ${catName} Android`, description, `/category/${slug}`);
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Beranda', url: '/' },
      { name: 'Kategori', url: '/categories' },
      { name: catName, url: `/category/${slug}` }
    ]);
  }

  // ---------------------------------------------------------------------------
  // 3. APPLICATION VIEWS (DYNAMIC FIRESTORE DATA)
  // ---------------------------------------------------------------------------
  else if (view === 'detail' || view === 'app-detail') {
    if (selectedApp) {
      const appName = selectedApp.name;
      const dev = selectedApp.developer || 'Developer Android';
      const cat = selectedApp.category || 'Utilities';
      const ver = selectedApp.version || '1.0.0';
      const appSlug = selectedApp.slug || selectedApp.id;
      
      title = `Download ${appName} untuk Android | Mod Station`;
      description = `Download APK ${appName} v${ver} karya ${dev} gratis untuk Android. Kategori ${cat}. Terverifikasi aman, bebas virus dan malware di Mod Station.`;
      canonicalPath = `/apps/${appSlug}`;
      ogImage = selectedApp.icon || defaultLogo;
      
      const isPublic = selectedApp.status === 'published' || selectedApp.status === 'PUBLISHED' || !selectedApp.status;
      const isSafe = selectedApp.securityStatus !== 'QUARANTINED' && selectedApp.securityStatus !== 'REJECTED';
      
      robots = (isPublic && isSafe) ? (SEO_CONFIG.defaultRobots as SeoRobotsDirective) : (SEO_CONFIG.noIndexRobots as SeoRobotsDirective);
      jsonLd = buildSoftwareApplicationSchema(selectedApp as any);
      breadcrumb = buildBreadcrumbSchema([
        { name: 'Beranda', url: '/' },
        { name: 'Aplikasi', url: '/apps' },
        { name: appName, url: `/apps/${appSlug}` }
      ]);
    } else {
      title = 'Detail Aplikasi | Mod Station';
      description = 'Informasi rincian aplikasi Android terverifikasi aman di Mod Station.';
      canonicalPath = '/apps';
      robots = SEO_CONFIG.noIndexRobots as SeoRobotsDirective;
    }
  }
  else if (view === 'app-versions' || view === 'versions') {
    const appName = selectedApp?.name || 'Aplikasi';
    const appSlug = selectedApp?.slug || selectedApp?.id || '';
    title = `Versi ${appName} | Mod Station`;
    description = `Riwayat versi dan pembaruan berkas APK ${appName} untuk Android di Mod Station.`;
    canonicalPath = appSlug ? `/apps/${appSlug}/versions` : '/apps';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'app-version-detail' || view === 'version-detail') {
    const appName = selectedApp?.name || 'Aplikasi';
    const appSlug = selectedApp?.slug || selectedApp?.id || '';
    const ver = versionName || selectedApp?.version || '1.0.0';
    title = `${appName} ${ver} untuk Android | Mod Station`;
    description = `Unduh APK ${appName} versi ${ver} resmi untuk smartphone Android di Mod Station.`;
    canonicalPath = appSlug ? `/apps/${appSlug}/version/${ver}` : '/apps';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'app-download' || view === 'download-action') {
    const appName = selectedApp?.name || 'Aplikasi';
    const appSlug = selectedApp?.slug || selectedApp?.id || '';
    title = `Unduh ${appName} APK | Mod Station`;
    description = `Proses unduhan berkas APK ${appName} versi resmi terverifikasi aman di Mod Station.`;
    canonicalPath = appSlug ? `/apps/${appSlug}` : '/apps';
    robots = SEO_CONFIG.noIndexRobots as SeoRobotsDirective;
  }
  else if (view === 'installer' || view === 'mod-station-installer') {
    title = 'Download Mod Station Installer (Official) | Mod Station';
    description = 'Unduh berkas resmi Mod Station Installer APK untuk mengelola, memperbarui, dan memasang aplikasi Android terverifikasi aman secara otomatis.';
    canonicalPath = '/apps/mod-station-installer';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildSoftwareApplicationSchema({
      id: 'mod-station-installer',
      name: 'Mod Station Installer',
      slug: 'mod-station-installer',
      version: '2.4.0',
      developer: 'Mod Station Official Team',
      category: 'Tools',
      size: '12.4 MB',
      icon: defaultLogo,
      description: 'Installer resmi platform Mod Station Android.',
      rating: 4.9,
      downloads: 150000
    });
  }

  // ---------------------------------------------------------------------------
  // 4. DEVELOPER VIEWS
  // ---------------------------------------------------------------------------
  else if (view === 'developers' || view === 'all-developers') {
    title = 'Developer Aplikasi Android | Mod Station';
    description = 'Daftar resmi pengembang aplikasi dan game Android terverifikasi yang memublikasikan karyanya di Mod Station.';
    canonicalPath = '/developers';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Pengembang Aplikasi Android', description, '/developers');
  }
  else if (view === 'developer' || view === 'developer-detail') {
    const devSlug = developerSlug || '';
    const devName = developerName || (devSlug ? devSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Developer Android');
    title = `Aplikasi ${devName} untuk Android | Mod Station`;
    description = `Temukan dan unduh seluruh aplikasi serta game Android resmi buatan ${devName} di Mod Station. Terverifikasi aman dan bebas malware.`;
    canonicalPath = `/developer/${devSlug}`;
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildOrganizationSchema(devName, description, `/developer/${devSlug}`);
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Beranda', url: '/' },
      { name: 'Developer', url: '/developers' },
      { name: devName, url: `/developer/${devSlug}` }
    ]);
  }

  // ---------------------------------------------------------------------------
  // 5. BLOG VIEWS
  // ---------------------------------------------------------------------------
  else if (view === 'blog' || view === 'blog-main') {
    title = 'Blog Mod Station | Berita, Panduan & Informasi Android';
    description = 'Berita teknologi terkini, panduan aplikasi, tips keamanan Android, tutorial, dan kabar pembaruan Mod Station.';
    canonicalPath = '/blog';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildCollectionPageSchema('Blog Mod Station', description, '/blog');
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Beranda', url: '/' },
      { name: 'Blog', url: '/blog' }
    ]);
  }
  else if (view === 'blog-detail' || view === 'article') {
    const slug = blogSlug || articleSlug || '';
    const artTitle = blogCategory ? `${blogCategory} — Mod Station` : 'Artikel Blog | Mod Station';
    title = `${artTitle} | Mod Station`;
    description = 'Baca artikel berita dan panduan Android lengkap terverifikasi di Blog Mod Station.';
    canonicalPath = `/blog/${slug}`;
    ogType = 'article';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'blog-category') {
    const cat = blogCategory || 'Umum';
    title = `${cat} | Blog Mod Station`;
    description = `Artikel dan panduan kategori ${cat} di Blog Mod Station.`;
    canonicalPath = `/blog/category/${encodeURIComponent(cat.toLowerCase())}`;
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }

  // ---------------------------------------------------------------------------
  // 6. DONATION, PREMIUM & SERVICE PAGES
  // ---------------------------------------------------------------------------
  else if (view === 'donate' || view === 'donasi') {
    title = 'Donasi Mod Station | Dukung Pengembangan Mod Station';
    description = 'Dukung kelanjutan operasional dan pengembangan platform APK downloader Mod Station di Indonesia melalui transfer bank dan QRIS resmi.';
    canonicalPath = '/donasi';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    breadcrumb = buildBreadcrumbSchema([
      { name: 'Beranda', url: '/' },
      { name: 'Donasi', url: '/donasi' }
    ]);
  }
  else if (view === 'premium' || view === 'subscription') {
    title = 'Mod Station Premium | Fitur Unduhan Super Cepat';
    description = 'Nikmati kecepatan unduhan tanpa batas, bebas iklan, dan akses prioritas berkas APK dengan berlangganan Mod Station Premium.';
    canonicalPath = '/premium';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }

  // ---------------------------------------------------------------------------
  // 7. INFORMATION & LEGAL PAGES
  // ---------------------------------------------------------------------------
  else if (view === 'about' || view === 'about-app') {
    title = 'Tentang Mod Station | Platform Android Terpercaya';
    description = 'Mengenal Mod Station: Misi, visi, standar verifikasi sertifikat SHA-256, dan komitmen keamanan distribusi berkas Android di Indonesia.';
    canonicalPath = '/about';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'help' || view === 'help-center') {
    title = 'Pusat Bantuan Mod Station';
    description = 'Dapatkan bantuan teknis, panduan pemasangan berkas APK, dan solusi masalah penggunaan platform Mod Station.';
    canonicalPath = '/help';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'faq') {
    title = 'FAQ Mod Station — Pertanyaan Sering Diajukan';
    description = 'Jawaban lengkap atas pertanyaan yang sering diajukan mengenai keamanan APK, unduhan, akun, dan fitur Mod Station.';
    canonicalPath = '/faq';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
    jsonLd = buildFaqPageSchema([
      { question: 'Apakah berkas APK di Mod Station aman?', answer: 'Ya, seluruh berkas APK yang dipublikasikan telah melalui pemeriksaan sertifikat SHA-256 dan bebas dari malware.' },
      { question: 'Apakah unduhan aplikasi di Mod Station gratis?', answer: 'Ya, Anda dapat mengunduh seluruh aplikasi dan game publik secara gratis tanpa biaya.' },
      { question: 'Bagaimana cara menginstal APK di smartphone Android?', answer: 'Aktifkan izin Pasang Aplikasi Tidak Dikenal di pengaturan keamanan smartphone Anda, lalu buka berkas APK yang telah diunduh.' }
    ]);
  }
  else if (view === 'contact') {
    title = 'Hubungi Mod Station';
    description = 'Hubungi tim operasional Mod Station untuk dukungan teknis, pelaporan masalah, kemitraan pengembang, dan inquiry bisnis.';
    canonicalPath = '/contact';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'terms') {
    title = 'Syarat dan Ketentuan | Mod Station';
    description = 'Syarat dan ketentuan hukum penggunaan layanan platform unduhan berkas APK Android Mod Station.';
    canonicalPath = '/terms';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'privacy') {
    title = 'Kebijakan Privasi | Mod Station';
    description = 'Kebijakan privasi Mod Station mengenai perlindungan data pribadi pengguna, penggunaan cookies, dan hak privasi.';
    canonicalPath = '/privacy';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'dmca') {
    title = 'DMCA | Mod Station';
    description = 'Prosedur dan pemberitahuan hak cipta Digital Millennium Copyright Act (DMCA) di Mod Station.';
    canonicalPath = '/dmca';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'cookies') {
    title = 'Kebijakan Cookie | Mod Station';
    description = 'Informasi penggunaan cookie dan teknologi pelacakan lokal di Mod Station.';
    canonicalPath = '/cookies';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'security') {
    title = 'Keamanan | Mod Station';
    description = 'Pusat informasi standar keamanan, pemindaian virus, dan verifikasi hash SHA-256 di Mod Station.';
    canonicalPath = '/security';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }
  else if (view === 'disclaimer') {
    title = 'Disclaimer | Mod Station';
    description = 'Pernyataan penolakan tanggung jawab hukum penggunaan konten dan berkas di Mod Station.';
    canonicalPath = '/disclaimer';
    robots = SEO_CONFIG.defaultRobots as SeoRobotsDirective;
  }

  // ---------------------------------------------------------------------------
  // 8. AUTHENTICATION & PRIVACY PAGES (NOINDEX)
  // ---------------------------------------------------------------------------
  else if (['login', 'register', 'forgot-password', 'reset-password', 'verify', 'auth'].includes(view)) {
    title = `${view.charAt(0).toUpperCase() + view.slice(1)} | Mod Station`;
    description = 'Portal autentikasi akun pengguna Mod Station.';
    canonicalPath = `/${view}`;
    robots = SEO_CONFIG.noIndexRobots as SeoRobotsDirective;
  }
  else if (['profile', 'settings', 'notifications', 'history', 'favorites', 'bookmarks', 'downloads', 'account'].includes(view)) {
    title = 'Area Pengguna | Mod Station';
    description = 'Manajemen akun pribadi pengguna Mod Station.';
    canonicalPath = `/${view}`;
    robots = SEO_CONFIG.noIndexRobots as SeoRobotsDirective;
  }

  // ---------------------------------------------------------------------------
  // 9. INTERNAL SEARCH (NOINDEX, FOLLOW)
  // ---------------------------------------------------------------------------
  else if (['search', 'search-results', 'search-expand', 'search-expand-fully', 'blog-search'].includes(view)) {
    const safeQuery = sanitizeSeoText(searchQuery || '');
    title = safeQuery ? `Hasil Pencarian "${safeQuery}" | Mod Station` : 'Cari Aplikasi & Game Android | Mod Station';
    description = safeQuery 
      ? `Hasil pencarian berkas aplikasi Android untuk kata kunci "${safeQuery}" di Mod Station.`
      : 'Cari dan temukan ribuan aplikasi serta game Android terverifikasi aman di Mod Station.';
    canonicalPath = '/search';
    robots = SEO_CONFIG.searchRobots as SeoRobotsDirective;
  }

  // ---------------------------------------------------------------------------
  // 10. CONSOLE & MANAGEMENT WORKSPACES (NOINDEX, NOFOLLOW)
  // ---------------------------------------------------------------------------
  else if (['admin', 'owner', 'owner-console', 'developer-dashboard', 'developer-console'].includes(view)) {
    title = 'Mod Station Management Workspace';
    description = 'Area konsol manajemen internal Mod Station.';
    canonicalPath = '/admin';
    robots = SEO_CONFIG.noIndexRobots as SeoRobotsDirective;
  }

  // Final sanitization of all outputs
  const cleanTitle = escapeSeoString(sanitizeSeoText(title));
  const cleanDesc = truncateDescription(sanitizeSeoText(description), 160);
  const fullCanonical = buildCanonicalUrl(canonicalPath);

  return {
    title: cleanTitle,
    description: cleanDesc,
    canonicalUrl: fullCanonical,
    robots,
    ogTitle: cleanTitle,
    ogDescription: cleanDesc,
    ogUrl: fullCanonical,
    ogImage,
    ogType,
    ogSiteName: SEO_CONFIG.siteName,
    ogLocale: SEO_CONFIG.defaultLocale,
    twitterCard: (ogType === 'article') ? 'summary_large_image' : 'summary',
    twitterTitle: cleanTitle,
    twitterDescription: cleanDesc,
    twitterImage: ogImage,
    twitterHandle: SEO_CONFIG.twitterHandle,
    jsonLd,
    breadcrumb
  };
}
