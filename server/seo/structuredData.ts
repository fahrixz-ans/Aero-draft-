import { AppData, AppCollection } from '../../src/types';

const BASE_URL = process.env.AUTH_URL || 'https://aeroapk.com';

export function generateSoftwareApplicationSchema(app: AppData, baseUrl: string = BASE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': app.name,
    'operatingSystem': app.androidVersion || 'Android 5.0+',
    'applicationCategory': `${app.category || 'Utilities'}Application`,
    'softwareVersion': app.version,
    'fileSize': app.size || 'N/A',
    'dateModified': app.updatedAt || new Date().toISOString().split('T')[0],
    'author': {
      '@type': 'Organization',
      'name': app.developer
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Mod Station',
      'url': baseUrl
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'IDR',
      'availability': 'https://schema.org/InStock'
    },
    ...(app.rating ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': app.rating,
        'ratingCount': Math.max(10, Math.floor((app.downloads || 1000) / 100)),
        'bestRating': '5',
        'worstRating': '1'
      }
    } : {}),
    'description': app.description,
    'image': app.icon,
    'screenshot': app.screenshots || [],
    'downloadUrl': `${baseUrl}/apps/${app.slug || app.id}`
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[], baseUrl: string = BASE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
    }))
  };
}

export function generateCollectionSchema(collection: AppCollection, baseUrl: string = BASE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': collection.title,
    'description': collection.description,
    'url': `${baseUrl}/collections/${collection.slug || collection.id}`,
    'isPartOf': {
      '@type': 'WebSite',
      'name': 'Mod Station',
      'url': baseUrl
    }
  };
}

export function generateBlogPostingSchema(blog: any, baseUrl: string = BASE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': blog.title,
    'description': blog.excerpt || blog.description,
    'image': blog.coverImage || `${baseUrl}/assets/mod-station-logo.svg`,
    'datePublished': blog.publishedAt || new Date().toISOString().split('T')[0],
    'dateModified': blog.updatedAt || blog.publishedAt || new Date().toISOString().split('T')[0],
    'author': {
      '@type': 'Person',
      'name': typeof blog.author === 'string' ? blog.author : (blog.author?.name || 'Admin Mod Station')
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Mod Station',
      'url': baseUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${baseUrl}/assets/mod-station-logo.svg`
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${blog.slug || blog.id}`
    }
  };
}

export function generateWebSiteSchema(baseUrl: string = BASE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Mod Station',
    'url': baseUrl,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}
