/**
 * Schema.org JSON-LD Structured Data Generators for Mod Station
 */

import { SEO_CONFIG, getBaseUrl } from './config';

export function buildWebSiteSchema(): Record<string, any> {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    'name': SEO_CONFIG.siteName,
    'alternateName': ['Mod Station Downloader', 'Mod Station APK'],
    'url': `${baseUrl}/`,
    'description': SEO_CONFIG.defaultDescription,
    'inLanguage': 'id-ID',
    'publisher': {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      'name': SEO_CONFIG.siteName,
      'url': baseUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': SEO_CONFIG.defaultLogo
      }
    },
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${baseUrl}/#/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildSoftwareApplicationSchema(app: {
  name: string;
  slug?: string;
  id: string;
  version?: string;
  developer?: string;
  category?: string;
  size?: string;
  icon?: string;
  screenshots?: string[];
  description?: string;
  rating?: number;
  downloads?: number | string;
  androidVersion?: string;
  updatedAt?: string;
}): Record<string, any> {
  const baseUrl = getBaseUrl();
  const appUrl = `${baseUrl}/#/apps/${app.slug || app.id}`;
  
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': app.name,
    'operatingSystem': app.androidVersion || 'Android',
    'applicationCategory': `${app.category || 'Utilities'}Application`,
    'softwareVersion': app.version || '1.0.0',
    'fileSize': app.size || '',
    'description': app.description || `Download ${app.name} APK Android resmi di Mod Station.`,
    'image': app.icon || SEO_CONFIG.defaultOgImage,
    'publisher': {
      '@type': 'Organization',
      'name': SEO_CONFIG.siteName,
      'url': baseUrl
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'IDR',
      'availability': 'https://schema.org/InStock'
    },
    'downloadUrl': appUrl
  };

  if (app.developer) {
    schema['author'] = {
      '@type': 'Organization',
      'name': app.developer
    };
  }

  if (app.screenshots && app.screenshots.length > 0) {
    schema['screenshot'] = app.screenshots;
  }

  if (app.updatedAt) {
    try {
      schema['dateModified'] = new Date(app.updatedAt).toISOString().split('T')[0];
    } catch (e) {
      // Fallback ignore if invalid date format
    }
  }

  // AggregateRating included ONLY if real numerical rating is present
  if (typeof app.rating === 'number' && app.rating > 0 && app.rating <= 5) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      'ratingValue': app.rating,
      'bestRating': '5',
      'worstRating': '1',
      'ratingCount': typeof app.downloads === 'number' && app.downloads > 0 ? Math.max(1, Math.floor(app.downloads / 10)) : 10
    };
  }

  return schema;
}

export function buildBlogPostingSchema(post: {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string;
  authorName?: string;
}): Record<string, any> {
  const baseUrl = getBaseUrl();
  const articleUrl = `${baseUrl}/#/blog/${post.slug}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.excerpt || post.title,
    'image': post.coverImage || SEO_CONFIG.defaultOgImage,
    'datePublished': post.publishedAt || new Date().toISOString().split('T')[0],
    'dateModified': post.publishedAt || new Date().toISOString().split('T')[0],
    'author': {
      '@type': 'Person',
      'name': post.authorName || 'Redaksi Mod Station'
    },
    'publisher': {
      '@type': 'Organization',
      'name': SEO_CONFIG.siteName,
      'url': baseUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': SEO_CONFIG.defaultLogo
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl
    }
  };
}

export function buildCollectionPageSchema(title: string, description: string, path: string): Record<string, any> {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': title,
    'description': description,
    'url': `${baseUrl}${path.startsWith('/') ? path : '/' + path}`,
    'isPartOf': {
      '@type': 'WebSite',
      'name': SEO_CONFIG.siteName,
      'url': baseUrl
    }
  };
}

export function buildOrganizationSchema(name: string, description?: string, path?: string): Record<string, any> {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': name,
    'description': description || `Profil Pengembang ${name} di Mod Station`,
    'url': path ? `${baseUrl}${path.startsWith('/') ? path : '/' + path}` : baseUrl,
    'publisher': {
      '@type': 'Organization',
      'name': SEO_CONFIG.siteName,
      'url': baseUrl
    }
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]): Record<string, any> {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url.startsWith('http') ? item.url : `${baseUrl}${item.url.startsWith('/') ? item.url : '/' + item.url}`
    }))
  };
}

export function buildFaqPageSchema(faqs: { question: string; answer: string }[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };
}
