import React, { useEffect, useState } from 'react';
import { AppData, BlogItem } from '../types';
import { INITIAL_BLOG_DATA, fetchAllBlogs } from '../services/blogService';
import { slugToDeveloperName } from '../utils/developerUtils';
import { slugToCategoryName } from '../utils/categoryUtils';

interface DynamicSEOProps {
  currentView: string;
  selectedApp?: AppData | null;
  categoryFilter?: string;
  categorySlug?: string | null;
  developerSlug?: string | null;
  blogSlug?: string | null;
  blogCategory?: string;
  searchQuery?: string;
}

export default function DynamicSEO({
  currentView,
  selectedApp,
  categoryFilter,
  categorySlug,
  developerSlug,
  blogSlug,
  blogCategory,
  searchQuery
}: DynamicSEOProps) {
  const [blogs, setBlogs] = useState<BlogItem[]>(INITIAL_BLOG_DATA);

  // Fetch blogs in background to ensure rich metadata for dynamic blog posts
  useEffect(() => {
    fetchAllBlogs().then(items => {
      if (items && items.length > 0) {
        setBlogs(items);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    const defaultLogo = `${origin}/assets/mod-station-logo.svg`;

    // -------------------------------------------------------------------------
    // 1. Compute Route-Specific SEO Attributes
    // -------------------------------------------------------------------------
    let title = 'Mod Station — Download Aplikasi & Game Android';
    let description = 'Mod Station adalah platform download APK Android gratis, resmi, cepat, dan terpercaya di Indonesia. Unduh ribuan aplikasi dan game populer terverifikasi aman.';
    let canonicalUrl = `${origin}/`;
    let ogImage = defaultLogo;
    let ogType = 'website';
    let robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    let jsonLdData: any = null;

    // --- APP DETAIL VIEW ---
    if (currentView === 'detail' && selectedApp) {
      title = `${selectedApp.name} APK — Download & Info | Mod Station`;
      description = `Unduh APK ${selectedApp.name} versi ${selectedApp.version} karya ${selectedApp.developer}. Ukuran ${selectedApp.size}, kategori ${selectedApp.category}. Bebas malware dan terverifikasi aman di Mod Station.`;
      canonicalUrl = `${origin}/#/apps/${selectedApp.slug || selectedApp.id}`;
      ogImage = selectedApp.icon || defaultLogo;
      
      const isEligible = selectedApp.status === 'published' && selectedApp.securityStatus !== 'QUARANTINED';
      robots = isEligible ? 'index, follow' : 'noindex, follow';

      // Schema: SoftwareApplication / MobileApplication
      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': selectedApp.name,
        'operatingSystem': selectedApp.androidVersion || 'Android',
        'applicationCategory': `${selectedApp.category || 'Utilities'}Application`,
        'softwareVersion': selectedApp.version,
        'fileSize': selectedApp.size,
        'dateModified': selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toISOString().split('T')[0] : '2026-09-01',
        'author': {
          '@type': 'Organization',
          'name': selectedApp.developer
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Mod Station',
          'url': origin
        },
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'IDR',
          'availability': 'https://schema.org/InStock'
        },
        ...(selectedApp.rating ? {
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': selectedApp.rating,
            'ratingCount': Math.max(10, Math.floor((typeof selectedApp.downloads === 'number' ? selectedApp.downloads : 500) / 50)),
            'bestRating': '5',
            'worstRating': '1'
          }
        } : {}),
        'description': selectedApp.description,
        'image': selectedApp.icon,
        'screenshot': selectedApp.screenshots || [],
        'downloadUrl': canonicalUrl
      };
    }

    // --- APPS MAIN DIRECTORY ---
    else if (currentView === 'apps') {
      title = 'Aplikasi Android APK Terbaik & Terbaru — Mod Station';
      description = 'Temukan dan unduh aplikasi APK Android terbaik, resmi, dan terverifikasi aman dari berbagai kategori di Mod Station.';
      canonicalUrl = `${origin}/#/apps`;
      robots = 'index, follow';
    }

    // --- GAMES MAIN DIRECTORY ---
    else if (currentView === 'games') {
      title = 'Game Android APK Terbaik & Terpopuler — Mod Station';
      description = 'Unduh koleksi game Android APK seru, bebas lag, dan terverifikasi aman untuk smartphone Android di Mod Station.';
      canonicalUrl = `${origin}/#/games`;
      robots = 'index, follow';
    }

    // --- CATEGORY DETAIL VIEW ---
    else if (currentView === 'category' || (currentView === 'categories' && categoryFilter)) {
      const activeCat = categoryFilter || 'Semua Kategori';
      const catSlug = encodeURIComponent(activeCat.toLowerCase().replace(/\s+/g, '-'));
      title = `Aplikasi ${activeCat} Android — Mod Station`;
      description = `Temukan dan unduh aplikasi APK kategori ${activeCat} Android terbaik, resmi, dan terverifikasi di Mod Station.`;
      canonicalUrl = `${origin}/#/category/${catSlug}`;
      robots = 'index, follow';

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': `Aplikasi Kategori ${activeCat}`,
        'description': description,
        'url': canonicalUrl,
        'isPartOf': {
          '@type': 'WebSite',
          'name': 'Mod Station',
          'url': origin
        }
      };
    }

    // --- CATEGORIES OVERVIEW ---
    else if (currentView === 'categories' || currentView === 'all-categories') {
      title = 'Kategori Aplikasi & Game Android — Mod Station';
      description = 'Daftar lengkap kategori aplikasi dan game Android APK resmi dan terverifikasi aman di Mod Station.';
      canonicalUrl = `${origin}/#/categories`;
      robots = 'index, follow';
    }

    // --- CATEGORY DETAIL VIEW ---
    else if (currentView === 'category-detail') {
      const catName = categorySlug ? (slugToCategoryName(categorySlug) || categorySlug) : 'Kategori';
      title = `Kategori ${catName} — Download Aplikasi & Game Android | Mod Station`;
      description = `Koleksi aplikasi dan game Android kategori ${catName} terverifikasi aman, resmi, dan gratis di Mod Station.`;
      canonicalUrl = `${origin}/#/detail${categorySlug || ''}`;
      robots = 'index, follow';

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': `Kategori ${catName} — Mod Station`,
        'description': description,
        'url': canonicalUrl
      };
    }

    // --- DEVELOPER DETAIL VIEW ---
    else if (currentView === 'developer-detail' || (currentView === 'developer' && developerSlug)) {
      const devName = developerSlug ? slugToDeveloperName(developerSlug, []) : 'Developer Android';
      title = `${devName} — Unduh Aplikasi & Game Android | Mod Station`;
      description = `Daftar aplikasi dan game Android resmi yang dikembangkan oleh ${devName} di Mod Station.`;
      canonicalUrl = `${origin}/#/developer/${developerSlug || ''}`;
      robots = 'index, follow';

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        'name': devName,
        'url': canonicalUrl
      };
    }

    // --- DEVELOPERS DIRECTORY ---
    else if (currentView === 'developer' || currentView === 'all-developers') {
      title = 'Daftar Pengembang Aplikasi Android Terverifikasi — Mod Station';
      description = 'Jelajahi profil pengembang aplikasi dan game Android resmi yang terdaftar di Mod Station.';
      canonicalUrl = `${origin}/#/developers`;
      robots = 'index, follow';
    }

    // --- BLOG DETAIL VIEW ---
    else if (currentView === 'blog-detail') {
      const currentBlog = blogs.find(b => b.slug === blogSlug) || blogs[0];
      if (currentBlog) {
        title = `${currentBlog.title} — Mod Station Blog`;
        description = currentBlog.excerpt || currentBlog.title;
        canonicalUrl = `${origin}/#/blog/${currentBlog.slug}`;
        ogImage = currentBlog.coverImage || defaultLogo;
        ogType = 'article';
        robots = 'index, follow';

        const authorName = typeof currentBlog.author === 'string' 
          ? currentBlog.author 
          : (currentBlog.author?.name || 'Admin Mod Station');

        jsonLdData = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          'headline': currentBlog.title,
          'description': currentBlog.excerpt,
          'image': currentBlog.coverImage || defaultLogo,
          'datePublished': currentBlog.publishedAt || '2026-05-10',
          'dateModified': currentBlog.publishedAt || '2026-05-10',
          'author': {
            '@type': 'Person',
            'name': authorName
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'Mod Station',
            'url': origin,
            'logo': {
              '@type': 'ImageObject',
              'url': defaultLogo
            }
          },
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': canonicalUrl
          }
        };
      }
    }

    // --- BLOG CATEGORY VIEW ---
    else if (currentView === 'blog-category') {
      const catName = blogCategory || 'Semua';
      title = `Blog Kategori ${catName} — Mod Station`;
      description = `Kumpulan artikel blog Mod Station dalam kategori ${catName}. Tips, trik, dan informasi Android terkini.`;
      canonicalUrl = `${origin}/#/blog/category/${encodeURIComponent((blogCategory || '').toLowerCase())}`;
      robots = 'index, follow';
    }

    // --- BLOG MAIN VIEW ---
    else if (currentView === 'blog') {
      title = 'Blog Mod Station — Tips, Berita & Tutorial Android';
      description = 'Artikel dan berita seputar perkembangan aplikasi, update modifikasi, tutorial, dan tips trik Android terbaru di Mod Station.';
      canonicalUrl = `${origin}/#/blog`;
      robots = 'index, follow';

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': 'Mod Station Blog',
        'description': description,
        'url': canonicalUrl
      };
    }

    // --- SEARCH RESULTS & EXPANDED SEARCH ---
    else if (['search', 'search-results', 'search-expand', 'search-expand-fully', 'blog-search'].includes(currentView)) {
      title = searchQuery ? `Hasil Pencarian untuk "${searchQuery}" — Mod Station` : 'Cari Aplikasi & Game Android — Mod Station';
      description = searchQuery ? `Hasil pencarian aplikasi Android untuk kata kunci "${searchQuery}" di Mod Station.` : 'Cari dan temukan ribuan aplikasi serta game Android terverifikasi aman di Mod Station.';
      canonicalUrl = `${origin}/#/search`;
      // CRITICAL: Search results should never pollute search index
      robots = 'noindex, follow';
    }

    // --- STATIC CONTENT & LEGAL PAGES ---
    else if (currentView === 'privacy') {
      title = 'Kebijakan Privasi (Privacy Policy) — Mod Station';
      description = 'Kebijakan privasi Mod Station mengenai perlindungan data pengguna, cookies, dan kepatuhan standar keamanan data.';
      canonicalUrl = `${origin}/#/privacy`;
      robots = 'index, follow';
    } else if (currentView === 'terms') {
      title = 'Syarat & Ketentuan Layanan — Mod Station';
      description = 'Syarat dan ketentuan hukum penggunaan platform unduhan berkas APK Android Mod Station.';
      canonicalUrl = `${origin}/#/terms`;
      robots = 'index, follow';
    } else if (currentView === 'about') {
      title = 'Tentang Mod Station — Platform Android Terpercaya';
      description = 'Kenali Mod Station, platform kurasi aplikasi dan game Android terverifikasi aman, cepat, dan independen di Indonesia.';
      canonicalUrl = `${origin}/#/about`;
      robots = 'index, follow';
    } else if (currentView === 'contact') {
      title = 'Hubungi Kami & Dukungan Pengguna — Mod Station';
      description = 'Hubungi tim operasional dan dukungan Mod Station untuk bantuan teknis, kemitraan pengembang, dan pertanyaan umum.';
      canonicalUrl = `${origin}/#/contact`;
      robots = 'index, follow';
    } else if (currentView === 'dmca') {
      title = 'Kebijakan DMCA & Pelaporan Hak Cipta — Mod Station';
      description = 'Prosedur pengajuan klaim hak cipta dan kepatuhan Digital Millennium Copyright Act (DMCA) di Mod Station.';
      canonicalUrl = `${origin}/#/dmca`;
      robots = 'index, follow';
    }

    // --- PRIVATE / ADMIN / INTERNAL / USER ACCOUNT VIEWS ---
    else if (['admin', 'owner', 'developer-dashboard', 'profile', 'downloads', 'bookmarks', 'settings', 'login', 'register'].includes(currentView)) {
      title = 'Mod Station — Portal Akses Pengguna';
      robots = 'noindex, nofollow';
      canonicalUrl = `${origin}/#/${currentView}`;
    }

    // --- HOMEPAGE DEFAULT SCHEMA ---
    else if (currentView === 'home') {
      jsonLdData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${origin}/#website`,
            'url': `${origin}/`,
            'name': 'Mod Station',
            'description': 'Platform APK Downloader Android Resmi, Aman & Cepat',
            'potentialAction': {
              '@type': 'SearchAction',
              'target': `${origin}/#/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          },
          {
            '@type': 'Organization',
            '@id': `${origin}/#organization`,
            'name': 'Mod Station',
            'url': `${origin}/`,
            'logo': {
              '@type': 'ImageObject',
              'url': defaultLogo
            }
          }
        ]
      };
    }

    // -------------------------------------------------------------------------
    // 2. Apply Dynamic Changes to Document Head
    // -------------------------------------------------------------------------
    document.title = title;

    const setMetaTag = (nameOrProp: string, value: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) {
          el.setAttribute('property', nameOrProp);
        } else {
          el.setAttribute('name', nameOrProp);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMetaTag('description', description);
    setMetaTag('robots', robots);
    setMetaTag('googlebot', robots);

    // Open Graph
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', 'Mod Station', true);

    // Twitter
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:card', ogType === 'article' ? 'summary_large_image' : 'summary');

    // Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Google Search Console verification support
    const gscVerification = (import.meta as any).env?.VITE_GSC_VERIFICATION;
    if (gscVerification && typeof gscVerification === 'string' && gscVerification.trim() !== '') {
      setMetaTag('google-site-verification', gscVerification.trim());
    }

    // Dynamic JSON-LD Structured Data
    const existingDynamicScript = document.getElementById('dynamic-jsonld-schema');
    if (existingDynamicScript) {
      existingDynamicScript.remove();
    }

    if (jsonLdData) {
      const script = document.createElement('script');
      script.id = 'dynamic-jsonld-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLdData);
      document.head.appendChild(script);
    }

    return () => {
      const cleanupScript = document.getElementById('dynamic-jsonld-schema');
      if (cleanupScript) {
        cleanupScript.remove();
      }
    };
  }, [currentView, selectedApp, categoryFilter, developerSlug, blogSlug, blogCategory, searchQuery, blogs]);

  return null;
}
