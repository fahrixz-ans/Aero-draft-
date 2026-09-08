import { AppData, AppCollection } from '../../src/types';

const BASE_URL = process.env.AUTH_URL || 'https://aeroapk.com';

export function generateSoftwareApplicationSchema(app: AppData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': app.name,
    'operatingSystem': app.androidVersion || 'Android 5.0+',
    'applicationCategory': app.category || 'UtilitiesApplication',
    'softwareVersion': app.version,
    'fileSize': app.size || 'N/A',
    'dateModified': app.updatedAt || new Date().toISOString().split('T')[0],
    'author': {
      '@type': 'Organization',
      'name': app.developer
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'AeroAPK',
      'url': BASE_URL
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': app.rating || 4.5,
      'ratingCount': Math.max(10, Math.floor((app.downloads || 1000) / 100)),
      'bestRating': '5',
      'worstRating': '1'
    },
    'description': app.description,
    'image': app.icon,
    'screenshot': app.screenshots || [],
    'downloadUrl': `${BASE_URL}/apps/${app.slug || app.id}`
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`
    }))
  };
}

export function generateCollectionSchema(collection: AppCollection) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': collection.title,
    'description': collection.description,
    'url': `${BASE_URL}/collections/${collection.slug || collection.id}`,
    'isPartOf': {
      '@type': 'WebSite',
      'name': 'AeroAPK',
      'url': BASE_URL
    }
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'AeroAPK',
    'url': BASE_URL,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}
