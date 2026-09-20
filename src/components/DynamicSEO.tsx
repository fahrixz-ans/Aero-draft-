import React, { useEffect, useState } from 'react';
import { AppData, BlogItem } from '../types';
import { fetchAllBlogs } from '../services/blogService';
import { resolveSeoMetadata } from '../lib/seo';
import { SEO_CONFIG } from '../lib/seo/config';

interface DynamicSEOProps {
  currentView: string;
  selectedApp?: AppData | null;
  categoryFilter?: string | null;
  categorySlug?: string | null;
  developerSlug?: string | null;
  blogSlug?: string | null;
  blogCategory?: string | null;
  searchQuery?: string | null;
  versionName?: string | null;
  articleSlug?: string | null;
}

export default function DynamicSEO({
  currentView,
  selectedApp,
  categoryFilter,
  categorySlug,
  developerSlug,
  blogSlug,
  blogCategory,
  searchQuery,
  versionName,
  articleSlug
}: DynamicSEOProps) {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);

  // Fetch published blog articles in background to populate dynamic blog posting SEO
  useEffect(() => {
    fetchAllBlogs()
      .then(items => {
        if (items && items.length > 0) {
          setBlogs(items);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Resolve comprehensive SEO metadata from central engine
    const seo = resolveSeoMetadata({
      currentView,
      selectedApp: selectedApp ? {
        id: selectedApp.id,
        name: selectedApp.name,
        slug: selectedApp.slug,
        version: selectedApp.version,
        developer: selectedApp.developer,
        category: selectedApp.category,
        size: selectedApp.size,
        icon: selectedApp.icon,
        screenshots: selectedApp.screenshots,
        description: selectedApp.description,
        rating: selectedApp.rating,
        downloads: selectedApp.downloads,
        status: selectedApp.status,
        securityStatus: selectedApp.securityStatus,
        androidVersion: selectedApp.androidVersion,
        updatedAt: selectedApp.updatedAt
      } : null,
      categoryFilter,
      categorySlug,
      developerSlug,
      blogSlug,
      blogCategory,
      searchQuery,
      versionName,
      articleSlug
    });

    // -------------------------------------------------------------------------
    // 1. Update Document Title
    // -------------------------------------------------------------------------
    document.title = seo.title;

    // Helper to safely set head meta tags
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

    // -------------------------------------------------------------------------
    // 2. Primary Meta Tags & Robots Directives
    // -------------------------------------------------------------------------
    setMetaTag('description', seo.description);
    setMetaTag('robots', seo.robots);
    setMetaTag('googlebot', seo.robots);
    setMetaTag('language', SEO_CONFIG.language);
    setMetaTag('geo.region', SEO_CONFIG.region);

    // -------------------------------------------------------------------------
    // 3. Open Graph Social Card Tags
    // -------------------------------------------------------------------------
    setMetaTag('og:title', seo.ogTitle, true);
    setMetaTag('og:description', seo.ogDescription, true);
    setMetaTag('og:url', seo.ogUrl, true);
    setMetaTag('og:image', seo.ogImage, true);
    setMetaTag('og:type', seo.ogType, true);
    setMetaTag('og:site_name', seo.ogSiteName, true);
    setMetaTag('og:locale', seo.ogLocale, true);

    // -------------------------------------------------------------------------
    // 4. Twitter / X Card Tags
    // -------------------------------------------------------------------------
    setMetaTag('twitter:card', seo.twitterCard);
    setMetaTag('twitter:title', seo.twitterTitle);
    setMetaTag('twitter:description', seo.twitterDescription);
    setMetaTag('twitter:image', seo.twitterImage);
    if (seo.twitterHandle) {
      setMetaTag('twitter:site', seo.twitterHandle);
      setMetaTag('twitter:creator', seo.twitterHandle);
    }

    // -------------------------------------------------------------------------
    // 5. Canonical Link Synchronization
    // -------------------------------------------------------------------------
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', seo.canonicalUrl);

    // -------------------------------------------------------------------------
    // 6. Dynamic JSON-LD Structured Data Synchronization
    // -------------------------------------------------------------------------
    const existingSchemaScript = document.getElementById('modstation-jsonld-schema');
    if (existingSchemaScript) {
      existingSchemaScript.remove();
    }

    const existingBreadcrumbScript = document.getElementById('modstation-jsonld-breadcrumb');
    if (existingBreadcrumbScript) {
      existingBreadcrumbScript.remove();
    }

    if (seo.jsonLd) {
      const script = document.createElement('script');
      script.id = 'modstation-jsonld-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(seo.jsonLd);
      document.head.appendChild(script);
    }

    if (seo.breadcrumb) {
      const bScript = document.createElement('script');
      bScript.id = 'modstation-jsonld-breadcrumb';
      bScript.type = 'application/ld+json';
      bScript.textContent = JSON.stringify(seo.breadcrumb);
      document.head.appendChild(bScript);
    }

    return () => {
      const s1 = document.getElementById('modstation-jsonld-schema');
      if (s1) s1.remove();
      const s2 = document.getElementById('modstation-jsonld-breadcrumb');
      if (s2) s2.remove();
    };
  }, [
    currentView,
    selectedApp,
    categoryFilter,
    categorySlug,
    developerSlug,
    blogSlug,
    blogCategory,
    searchQuery,
    versionName,
    articleSlug,
    blogs
  ]);

  return null;
}
