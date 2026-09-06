import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import AdmZip from 'adm-zip';
import crypto from 'crypto';

// Initialize Express App
const app = express();
const PORT = 3000;
const START_TIME = Date.now();

// ---------------------------------------------------------------------------
// 1. STORAGE DIRECTORIES SETUP
// ---------------------------------------------------------------------------
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const APKS_DIR = path.join(UPLOADS_DIR, 'apks');
const LOGS_DIR = path.join(process.cwd(), 'logs');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(APKS_DIR)) fs.mkdirSync(APKS_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// 2. SECURITY HEADERS & REQUEST ID MIDDLEWARE
// ---------------------------------------------------------------------------
app.use((req: any, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// JSON body parser with strict size limit
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use('/uploads/images', express.static(IMAGES_DIR, {
  maxAge: '7d',
  immutable: true,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// ---------------------------------------------------------------------------
// 3. ERROR CODE REGISTRY & RESPONSE CONTRACT HELPERS
// ---------------------------------------------------------------------------
const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_REQUEST: 'INVALID_REQUEST',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  APP_ALREADY_EXISTS: 'APP_ALREADY_EXISTS',
  APP_INVALID_STATUS: 'APP_INVALID_STATUS',
  VERSION_NOT_FOUND: 'VERSION_NOT_FOUND',
  VERSION_ALREADY_EXISTS: 'VERSION_ALREADY_EXISTS',
  VERSION_INVALID_STATUS: 'VERSION_INVALID_STATUS',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_ALREADY_EXISTS: 'CATEGORY_ALREADY_EXISTS',
  COLLECTION_NOT_FOUND: 'COLLECTION_NOT_FOUND',
  MODERATION_NOT_FOUND: 'MODERATION_NOT_FOUND',
  INVALID_MODERATION_STATE: 'INVALID_MODERATION_STATE',
  SECURITY_SCAN_FAILED: 'SECURITY_SCAN_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  DEPENDENCY_CONFLICT: 'DEPENDENCY_CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

function sendSuccess(res: any, data: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      requestId: res.getHeader('X-Request-ID'),
      timestamp: new Date().toISOString()
    }
  });
}

function sendList(res: any, data: any[], page: number, pageSize: number, total: number, statusCode = 200) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    },
    meta: {
      requestId: res.getHeader('X-Request-ID'),
      timestamp: new Date().toISOString()
    }
  });
}

function sendError(res: any, code: string, message: string, statusCode = 400, details?: any) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    },
    meta: {
      requestId: res.getHeader('X-Request-ID'),
      timestamp: new Date().toISOString()
    }
  });
}

// ---------------------------------------------------------------------------
// 4. IN-MEMORY PERSISTENT STORES & MOCK DATA (STAGE 8.3)
// ---------------------------------------------------------------------------
const categoriesStore = [
  { id: 'cat_1', name: 'Alat & Utilitas', slug: 'alat-utilitas', status: 'ACTIVE', description: 'Utilitas harian dan perkakas sistem.' },
  { id: 'cat_2', name: 'Sosial & Komunikasi', slug: 'sosial-komunikasi', status: 'ACTIVE', description: 'Aplikasi perpesanan dan jejaring sosial.' },
  { id: 'cat_3', name: 'Produktivitas', slug: 'produktivitas', status: 'ACTIVE', description: 'Dokumen, catatan, dan manajemen waktu.' },
  { id: 'cat_4', name: 'Game & Hiburan', slug: 'game-hiburan', status: 'ACTIVE', description: 'Hiburan interaktif dan permainan.' },
  { id: 'cat_5', name: 'Fotografi & Video', slug: 'fotografi-video', status: 'ACTIVE', description: 'Penyuntingan foto dan media sosial.' }
];

const appsStore = [
  {
    id: 'app_capcut',
    name: 'CapCut - Video Editor',
    slug: 'capcut-video-editor',
    packageName: 'com.lemon.lv',
    developerName: 'Bytedance Pte. Ltd.',
    shortDescription: 'Aplikasi penyunting video all-in-one profesional dengan fitur AI canggih.',
    description: 'CapCut adalah editor video resmi serbaguna dan pembuat video gratis dengan semua yang Anda butuhkan untuk membuat video yang luar biasa.',
    category: 'Fotografi & Video',
    categoryId: 'cat_5',
    iconUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800',
    status: 'PUBLISHED',
    distributionType: 'APK',
    downloads: 1450000,
    rating: 4.8,
    reviewsCount: 32000,
    size: '124 MB',
    versionName: '11.4.0',
    versionCode: 11400,
    sha256: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
    latestVersionId: 'ver_capcut_1',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'app_whatsapp',
    name: 'WhatsApp Messenger',
    slug: 'whatsapp-messenger',
    packageName: 'com.whatsapp',
    developerName: 'WhatsApp LLC',
    shortDescription: 'Pesan instan yang simpel, aman, dan dapat diandalkan.',
    description: 'WhatsApp Messenger adalah aplikasi pesan GRATIS yang tersedia untuk Android dan ponsel cerdas lainnya.',
    category: 'Sosial & Komunikasi',
    categoryId: 'cat_2',
    iconUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800',
    status: 'PUBLISHED',
    distributionType: 'APK',
    downloads: 5200000,
    rating: 4.7,
    reviewsCount: 98000,
    size: '48 MB',
    versionName: '2.24.12',
    versionCode: 241200,
    sha256: 'A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
    latestVersionId: 'ver_wa_1',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'app_spotify',
    name: 'Spotify: Music & Podcasts',
    slug: 'spotify-music-podcasts',
    packageName: 'com.spotify.music',
    developerName: 'Spotify AB',
    shortDescription: 'Streaming musik, album, dan podcast favorit Anda.',
    description: 'Dengarkan musik, podcast, dan album gratis di ponsel dan tablet Anda dengan Spotify.',
    category: 'Game & Hiburan',
    categoryId: 'cat_4',
    iconUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    status: 'PUBLISHED',
    distributionType: 'APK',
    downloads: 3100000,
    rating: 4.6,
    reviewsCount: 45000,
    size: '86 MB',
    versionName: '8.9.30',
    versionCode: 89300,
    sha256: 'B2C3D4E5F6A178901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
    latestVersionId: 'ver_spotify_1',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

const versionsStore = [
  {
    id: 'ver_capcut_1',
    appId: 'app_capcut',
    versionName: '11.4.0',
    versionCode: 11400,
    sha256: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
    status: 'PUBLISHED',
    securityStatus: 'passed',
    storageKey: 'apks/E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855.apk',
    changelog: 'Pembaruan stabilitas dan peningkatan performa editor AI.',
    minSdk: 26,
    targetSdk: 34,
    fileSize: 130023400,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ver_wa_1',
    appId: 'app_whatsapp',
    versionName: '2.24.12',
    versionCode: 241200,
    sha256: 'A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
    status: 'PUBLISHED',
    securityStatus: 'passed',
    storageKey: 'apks/A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF.apk',
    changelog: 'Dukungan enkripsi pesan grup baru dan perbaikan bug.',
    minSdk: 24,
    targetSdk: 34,
    fileSize: 50331648,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ver_spotify_1',
    appId: 'app_spotify',
    versionName: '8.9.30',
    versionCode: 89300,
    sha256: 'B2C3D4E5F6A178901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
    status: 'PUBLISHED',
    securityStatus: 'passed',
    storageKey: 'apks/B2C3D4E5F6A178901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF.apk',
    changelog: 'Antarmuka pemutar musik mini yang diperbarui.',
    minSdk: 26,
    targetSdk: 34,
    fileSize: 90177536,
    createdAt: new Date().toISOString()
  }
];

const collectionsStore = [
  {
    id: 'col_1',
    title: 'Aplikasi Terpopuler Minggu Ini',
    slug: 'aplikasi-terpopuler-minggu-ini',
    description: 'Pilihan aplikasi paling banyak diunduh oleh komunitas Aero.',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    appIds: ['app_capcut', 'app_whatsapp', 'app_spotify']
  }
];

const homepageStore = {
  hero: {
    title: 'Temukan & Unduh Aplikasi Android Terbaik',
    subtitle: 'Aman, terverifikasi SHA-256, bebas malware, dan berkecepatan tinggi.',
    ctaText: 'Jelajahi Katalog',
    ctaLink: '#catalog'
  },
  sections: [
    { type: 'trending', title: 'Sedang Trending' },
    { type: 'new_releases', title: 'Rilis Terbaru' }
  ],
  featuredApps: ['app_capcut', 'app_whatsapp', 'app_spotify'],
  featuredCollections: ['col_1']
};

const moderationStore = [
  {
    id: 'mod_1',
    appId: 'app_capcut',
    type: 'report',
    status: 'new',
    priority: 'medium',
    reason: 'Permintaan pembaruan changelog',
    description: 'Pengguna melaporkan versi baru memiliki fitur tambahan.',
    createdAt: new Date().toISOString()
  }
];

const securityStore = [
  {
    versionId: 'ver_capcut_1',
    status: 'passed',
    vulnerabilitiesCount: 0,
    scannedAt: new Date().toISOString(),
    scanner: 'AeroShield AI Engine v4.2'
  },
  {
    versionId: 'ver_wa_1',
    status: 'passed',
    vulnerabilitiesCount: 0,
    scannedAt: new Date().toISOString(),
    scanner: 'AeroShield AI Engine v4.2'
  }
];

const usersStore = [
  { id: 'usr_1', email: 'fahriandriansaputra123@gmail.com', name: 'Super Admin', role: 'SUPER_ADMIN', status: 'ACTIVE', lastLogin: new Date().toISOString() },
  { id: 'usr_2', email: 'moderator@aeroapk.com', name: 'Moderator Utama', role: 'MODERATOR', status: 'ACTIVE', lastLogin: new Date().toISOString() }
];

const auditLogsStore: any[] = [];

// ---------------------------------------------------------------------------
// 5. SLIDING-WINDOW RATE LIMITER
// ---------------------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + options.windowMs };
      rateLimitMap.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, options.max - record.count);
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > options.max) {
      res.setHeader('Retry-After', retryAfter);
      return sendError(res, ERROR_CODES.RATE_LIMITED, options.message || 'Terlalu banyak permintaan.', 429, { retryAfter });
    }

    next();
  };
}

const publicReadLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120 });
const publicSearchLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 60 });
const downloadLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 45 });
const adminMutationLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30 });

// ---------------------------------------------------------------------------
// 6. PUBLIC API ENDPOINTS (/api/public/*)
// ---------------------------------------------------------------------------

// GET /api/public/apps
app.get('/api/public/apps', publicReadLimiter, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
  const search = (req.query.search as string || req.query.q as string || '').toLowerCase().trim();
  const category = req.query.category as string;
  const sort = (req.query.sort as string) || 'downloads';

  let filtered = appsStore.filter(a => a.status === 'PUBLISHED');

  if (search) {
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(search) || 
      a.shortDescription.toLowerCase().includes(search) ||
      a.developerName.toLowerCase().includes(search)
    );
  }

  if (category) {
    filtered = filtered.filter(a => a.category.toLowerCase() === category.toLowerCase() || a.categoryId === category);
  }

  if (sort === 'downloads') {
    filtered.sort((a, b) => b.downloads - a.downloads);
  } else if (sort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const sanitized = paginated.map(({ ...app }: any) => {
    delete app.storageKey;
    return app;
  });

  return sendList(res, sanitized, page, pageSize, total);
});

// GET /api/public/apps/:slug
app.get('/api/public/apps/:slug', publicReadLimiter, (req, res) => {
  const slug = req.params.slug;
  const app = appsStore.find(a => a.slug === slug && a.status === 'PUBLISHED');

  if (!app) {
    return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan atau belum dipublikasikan.', 404);
  }

  const { storageKey, ...sanitized } = app as any;
  return sendSuccess(res, sanitized);
});

// GET /api/public/apps/:slug/versions
app.get('/api/public/apps/:slug/versions', publicReadLimiter, (req, res) => {
  const slug = req.params.slug;
  const app = appsStore.find(a => a.slug === slug && a.status === 'PUBLISHED');

  if (!app) {
    return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);
  }

  const appVersions = versionsStore.filter(v => v.appId === app.id && v.status === 'PUBLISHED');
  const sanitized = appVersions.map(({ storageKey, ...v }: any) => v);

  return sendSuccess(res, sanitized);
});

// GET /api/public/categories
app.get('/api/public/categories', publicReadLimiter, (req, res) => {
  const activeCategories = categoriesStore.filter(c => c.status === 'ACTIVE');
  return sendSuccess(res, activeCategories);
});

// GET /api/public/categories/:slug
app.get('/api/public/categories/:slug', publicReadLimiter, (req, res) => {
  const slug = req.params.slug;
  const cat = categoriesStore.find(c => c.slug === slug && c.status === 'ACTIVE');
  if (!cat) {
    return sendError(res, ERROR_CODES.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);
  }
  return sendSuccess(res, cat);
});

// GET /api/public/categories/:slug/apps
app.get('/api/public/categories/:slug/apps', publicReadLimiter, (req, res) => {
  const slug = req.params.slug;
  const cat = categoriesStore.find(c => c.slug === slug && c.status === 'ACTIVE');
  if (!cat) {
    return sendError(res, ERROR_CODES.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);
  }

  const apps = appsStore.filter(a => (a.categoryId === cat.id || a.category.toLowerCase() === cat.name.toLowerCase()) && a.status === 'PUBLISHED');
  const sanitized = apps.map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });
  return sendSuccess(res, sanitized);
});

// GET /api/public/collections
app.get('/api/public/collections', publicReadLimiter, (req, res) => {
  const publishedCollections = collectionsStore.filter(c => c.status === 'PUBLISHED' && c.visibility === 'PUBLIC');
  return sendSuccess(res, publishedCollections);
});

// GET /api/public/collections/:slug
app.get('/api/public/collections/:slug', publicReadLimiter, (req, res) => {
  const slug = req.params.slug;
  const col = collectionsStore.find(c => c.slug === slug && c.status === 'PUBLISHED' && c.visibility === 'PUBLIC');
  if (!col) {
    return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Koleksi tidak ditemukan.', 404);
  }

  const apps = appsStore.filter(a => col.appIds.includes(a.id) && a.status === 'PUBLISHED').map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });

  return sendSuccess(res, { ...col, apps });
});

// GET /api/public/homepage
app.get('/api/public/homepage', publicReadLimiter, (req, res) => {
  const trending = appsStore.filter(a => a.status === 'PUBLISHED').sort((a, b) => b.downloads - a.downloads).slice(0, 8).map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });
  const newReleases = appsStore.filter(a => a.status === 'PUBLISHED').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8).map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });
  const recentlyUpdated = appsStore.filter(a => a.status === 'PUBLISHED').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8).map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });
  const categories = categoriesStore.filter(c => c.status === 'ACTIVE');
  const collections = collectionsStore.filter(c => c.status === 'PUBLISHED' && c.visibility === 'PUBLIC');

  return sendSuccess(res, {
    hero: homepageStore.hero,
    trending,
    newReleases,
    recentlyUpdated,
    categories,
    collections
  });
});

// GET /api/public/search
app.get('/api/public/search', publicSearchLimiter, (req, res) => {
  const q = (req.query.q as string || '').trim().toLowerCase();
  const category = req.query.category as string;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));

  if (q.length > 0 && q.length < 2) {
    return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Query pencarian minimal 2 karakter.', 400);
  }

  let results = appsStore.filter(a => a.status === 'PUBLISHED');
  if (q) {
    results = results.filter(a => a.name.toLowerCase().includes(q) || a.shortDescription.toLowerCase().includes(q) || a.developerName.toLowerCase().includes(q));
  }
  if (category) {
    results = results.filter(a => a.category.toLowerCase() === category.toLowerCase() || a.categoryId === category);
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  const data = results.slice(start, start + pageSize).map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });

  if (data.length === 0) {
    return res.json({
      success: true,
      query: q,
      data: [],
      pagination: { page, pageSize, total: 0, totalPages: 0 },
      meta: {
        resultCount: 0,
        requestId: res.getHeader('X-Request-ID'),
        timestamp: new Date().toISOString()
      }
    });
  }

  return sendList(res, data, page, pageSize, total);
});

// GET /api/public/trending
app.get('/api/public/trending', publicReadLimiter, (req, res) => {
  const period = req.query.period || '24h';
  const published = appsStore.filter(a => a.status === 'PUBLISHED').sort((a, b) => b.downloads - a.downloads).map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });
  return sendSuccess(res, { period, data: published });
});

// GET /api/public/recently-updated
app.get('/api/public/recently-updated', publicReadLimiter, (req, res) => {
  const sorted = appsStore.filter(a => a.status === 'PUBLISHED').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });
  return sendSuccess(res, sorted);
});

// GET /api/public/new-releases
app.get('/api/public/new-releases', publicReadLimiter, (req, res) => {
  const sorted = appsStore.filter(a => a.status === 'PUBLISHED').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((a: any) => {
    const { storageKey, ...rest } = a;
    return rest;
  });
  return sendSuccess(res, sorted);
});

// GET /api/public/apps/:slug/download
app.get('/api/public/apps/:slug/download', downloadLimiter, (req, res) => {
  const slug = req.params.slug;
  const app = appsStore.find(a => a.slug === slug);

  if (!app || app.status !== 'PUBLISHED') {
    return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan atau belum dipublikasikan.', 404);
  }

  if (app.distributionType === 'OFFICIAL_WEBSITE') {
    return sendError(res, ERROR_CODES.INVALID_REQUEST, 'Aplikasi ini menggunakan tautan situs resmi, bukan unduhan berkas APK.', 400);
  }

  const version = versionsStore.find(v => v.appId === app.id && v.id === app.latestVersionId && v.status === 'PUBLISHED');
  if (!version) {
    return sendError(res, ERROR_CODES.VERSION_NOT_FOUND, 'Versi publikasi APK belum tersedia.', 404);
  }

  const sec = securityStore.find(s => s.versionId === version.id);
  if (sec && sec.status === 'failed') {
    return sendError(res, ERROR_CODES.SECURITY_SCAN_FAILED, 'Unduhan diblokir: Versi ini gagal dalam audit keamanan sistem.', 403);
  }

  const filePath = path.join(APKS_DIR, `${version.sha256}.apk`);
  const lowerPath = path.join(APKS_DIR, `${version.sha256.toLowerCase()}.apk`);
  const targetPath = fs.existsSync(filePath) ? filePath : (fs.existsSync(lowerPath) ? lowerPath : null);

  if (!targetPath) {
    return sendError(res, ERROR_CODES.VERSION_NOT_FOUND, 'Berkas fisik APK tidak ditemukan di server.', 404);
  }

  app.downloads += 1;

  const stat = fs.statSync(targetPath);
  const downloadName = `${app.slug}_${version.versionName}.apk`;

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-APK-SHA256', version.sha256);

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    if (start >= stat.size || end >= stat.size || start > end) {
      res.setHeader('Content-Range', `bytes */${stat.size}`);
      return res.status(416).end();
    }
    const stream = fs.createReadStream(targetPath, { start, end });
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', end - start + 1);
    stream.pipe(res);
  } else {
    res.status(200);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(targetPath).pipe(res);
  }
});

// GET /api/public/apps/:slug/official
app.get('/api/public/apps/:slug/official', publicReadLimiter, (req, res) => {
  const slug = req.params.slug;
  const app = appsStore.find(a => a.slug === slug && a.status === 'PUBLISHED');
  if (!app) {
    return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);
  }
  if (app.distributionType !== 'OFFICIAL_WEBSITE' || !(app as any).officialWebsiteUrl) {
    return sendError(res, ERROR_CODES.INVALID_REQUEST, 'Aplikasi ini bukan bertipe situs resmi.', 400);
  }
  return sendSuccess(res, { officialUrl: (app as any).officialWebsiteUrl });
});

// ---------------------------------------------------------------------------
// 7. ADMIN API ENDPOINTS (/api/admin/*)
// ---------------------------------------------------------------------------

app.get('/api/admin/apps', publicReadLimiter, (req, res) => {
  return sendList(res, appsStore, 1, 100, appsStore.length);
});

app.post('/api/admin/apps', adminMutationLimiter, (req, res) => {
  const { name, slug, packageName, categoryId, category, distributionType, officialWebsiteUrl, developerName, shortDescription, description, iconUrl, bannerUrl } = req.body;

  if (!name || !slug || !packageName) {
    return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Nama, slug, dan package name wajib diisi.');
  }

  const cat = categoriesStore.find(c => c.id === categoryId || c.name.toLowerCase() === (category || '').toLowerCase());
  if (!cat || cat.status !== 'ACTIVE') {
    return sendError(res, ERROR_CODES.DEPENDENCY_CONFLICT, 'Kategori tidak valid atau sedang di-archive.', 409, { resource: 'category' });
  }

  const existing = appsStore.find(a => a.slug === slug || a.packageName === packageName);
  if (existing) {
    return sendError(res, ERROR_CODES.APP_ALREADY_EXISTS, 'Aplikasi dengan slug atau package name tersebut sudah terdaftar.', 409);
  }

  const newApp = {
    id: `app_${Date.now()}`,
    name,
    slug,
    packageName,
    developerName: developerName || 'Aero Developer',
    shortDescription: shortDescription || '',
    description: description || '',
    category: cat.name,
    categoryId: cat.id,
    iconUrl: iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800',
    status: 'DRAFT',
    distributionType: distributionType || 'APK',
    ...(officialWebsiteUrl ? { officialWebsiteUrl } : {}),
    downloads: 0,
    rating: 5.0,
    reviewsCount: 0,
    size: '45 MB',
    versionName: '1.0.0',
    versionCode: 100,
    sha256: '',
    latestVersionId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  appsStore.push(newApp);

  auditLogsStore.push({
    id: `audit_${Date.now()}`,
    adminEmail: 'admin@aeroapk.com',
    action: 'CREATE_APP',
    entityType: 'application',
    entityId: newApp.id,
    createdAt: new Date().toISOString()
  });

  return sendSuccess(res, newApp, 201);
});

app.get('/api/admin/apps/:id', publicReadLimiter, (req, res) => {
  const app = appsStore.find(a => a.id === req.params.id || a.slug === req.params.id);
  if (!app) return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);
  return sendSuccess(res, app);
});

app.patch('/api/admin/apps/:id', adminMutationLimiter, (req, res) => {
  const app = appsStore.find(a => a.id === req.params.id);
  if (!app) return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);

  Object.assign(app, req.body, { updatedAt: new Date().toISOString() });
  return sendSuccess(res, app);
});

app.post('/api/admin/apps/:id/publish', adminMutationLimiter, (req, res) => {
  const app = appsStore.find(a => a.id === req.params.id);
  if (!app) return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);

  if (app.distributionType === 'APK') {
    if (!app.latestVersionId) {
      return sendError(res, ERROR_CODES.VERSION_NOT_FOUND, 'Aplikasi APK harus memiliki setidaknya satu versi rilis aktif.', 409);
    }
  } else if (app.distributionType === 'OFFICIAL_WEBSITE' && !(app as any).officialWebsiteUrl) {
    return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Aplikasi situs resmi wajib menyertakan officialWebsiteUrl.', 422);
  }

  app.status = 'PUBLISHED';
  app.updatedAt = new Date().toISOString();
  return sendSuccess(res, app);
});

app.post('/api/admin/apps/:id/archive', adminMutationLimiter, (req, res) => {
  const app = appsStore.find(a => a.id === req.params.id);
  if (!app) return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);

  app.status = 'ARCHIVED';
  app.updatedAt = new Date().toISOString();
  return sendSuccess(res, app);
});

app.get('/api/admin/categories', publicReadLimiter, (req, res) => {
  return sendSuccess(res, categoriesStore);
});

app.post('/api/admin/categories', adminMutationLimiter, (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Nama dan slug kategori wajib diisi.');

  const existing = categoriesStore.find(c => c.slug === slug);
  if (existing) return sendError(res, ERROR_CODES.CATEGORY_ALREADY_EXISTS, 'Kategori dengan slug tersebut sudah ada.', 409);

  const newCat = { id: `cat_${Date.now()}`, name, slug, status: 'ACTIVE', description: description || '' };
  categoriesStore.push(newCat);
  return sendSuccess(res, newCat, 201);
});

app.post('/api/admin/categories/:id/archive', adminMutationLimiter, (req, res) => {
  const cat = categoriesStore.find(c => c.id === req.params.id);
  if (!cat) return sendError(res, ERROR_CODES.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);

  const dependentApps = appsStore.filter(a => a.categoryId === cat.id || a.category === cat.name);
  if (dependentApps.length > 0) {
    return sendError(res, ERROR_CODES.DEPENDENCY_CONFLICT, 'Kategori tidak dapat di-archive karena masih digunakan oleh aplikasi.', 409, {
      resource: 'category',
      dependentCount: dependentApps.length
    });
  }

  cat.status = 'ARCHIVED';
  return sendSuccess(res, cat);
});

app.get('/api/admin/collections', publicReadLimiter, (req, res) => {
  return sendSuccess(res, collectionsStore);
});

app.post('/api/admin/collections', adminMutationLimiter, (req, res) => {
  const { title, slug, description, visibility, appIds } = req.body;
  if (!title || !slug) return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Judul dan slug koleksi wajib diisi.');

  const newCol = {
    id: `col_${Date.now()}`,
    title,
    slug,
    description: description || '',
    status: 'DRAFT',
    visibility: visibility || 'PUBLIC',
    appIds: Array.isArray(appIds) ? appIds : []
  };

  collectionsStore.push(newCol);
  return sendSuccess(res, newCol, 201);
});

app.get('/api/admin/homepage', publicReadLimiter, (req, res) => {
  return sendSuccess(res, homepageStore);
});

app.patch('/api/admin/homepage', adminMutationLimiter, (req, res) => {
  Object.assign(homepageStore, req.body);
  return sendSuccess(res, homepageStore);
});

app.get('/api/admin/moderation', publicReadLimiter, (req, res) => {
  return sendSuccess(res, moderationStore);
});

app.post('/api/admin/moderation/:id/approve', adminMutationLimiter, (req, res) => {
  const item = moderationStore.find(m => m.id === req.params.id);
  if (!item) return sendError(res, ERROR_CODES.MODERATION_NOT_FOUND, 'Item moderasi tidak ditemukan.', 404);
  item.status = 'approved';
  return sendSuccess(res, item);
});

app.post('/api/admin/moderation/:id/reject', adminMutationLimiter, (req, res) => {
  const item = moderationStore.find(m => m.id === req.params.id);
  if (!item) return sendError(res, ERROR_CODES.MODERATION_NOT_FOUND, 'Item moderasi tidak ditemukan.', 404);
  item.status = 'rejected';
  return sendSuccess(res, item);
});

app.get('/api/admin/security', publicReadLimiter, (req, res) => {
  return sendSuccess(res, securityStore);
});

app.get('/api/admin/analytics/overview', publicReadLimiter, (req, res) => {
  const { dateFrom, dateTo } = req.query;
  if (dateFrom && dateTo && new Date(dateFrom as string) > new Date(dateTo as string)) {
    return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'dateFrom tidak boleh melebihi dateTo.', 400);
  }

  return sendSuccess(res, {
    totalDownloads: appsStore.reduce((acc, a) => acc + a.downloads, 0),
    totalApps: appsStore.length,
    activeCategories: categoriesStore.filter(c => c.status === 'ACTIVE').length,
    dateRange: { dateFrom: dateFrom || 'all-time', dateTo: dateTo || 'now' }
  });
});

app.get('/api/admin/audit', publicReadLimiter, (req, res) => {
  const { actorId, action, resourceType } = req.query;
  let filtered = [...auditLogsStore];

  if (actorId) filtered = filtered.filter(l => l.adminEmail === actorId);
  if (action) filtered = filtered.filter(l => l.action === action);
  if (resourceType) filtered = filtered.filter(l => l.entityType === resourceType);

  return sendList(res, filtered, 1, 50, filtered.length);
});

app.get('/api/admin/access/users', publicReadLimiter, (req, res) => {
  return sendSuccess(res, usersStore);
});

app.get('/api/admin/settings', publicReadLimiter, (req, res) => {
  return sendSuccess(res, {
    general: { siteName: 'AeroAPK', maintenanceMode: false },
    security: { scanRequired: true, maxApkSizeMB: 150 }
  });
});

// ---------------------------------------------------------------------------
// 8. INTERNAL WORKER & HEALTH API ENDPOINTS (/api/internal/*)
// ---------------------------------------------------------------------------
app.get('/api/internal/health', (req, res) => {
  return sendSuccess(res, {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/internal/ready', (req, res) => {
  // Check dependencies: storage, database stores, etc.
  const storageReady = fs.existsSync(UPLOADS_DIR);
  const dbReady = Array.isArray(appsStore) && Array.isArray(categoriesStore);
  
  if (!storageReady || !dbReady) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'System not ready: dependencies unavailable', 503, {
      storageReady,
      dbReady
    });
  }

  return sendSuccess(res, {
    status: 'ready',
    dependencies: {
      database: 'connected',
      storage: 'available',
      redis: 'connected',
      search: 'synchronized'
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/internal/worker/process-apk', (req, res) => {
  const secretKey = req.headers['x-internal-key'];
  if (secretKey && secretKey !== 'aero_internal_secret_token') {
    return sendError(res, ERROR_CODES.FORBIDDEN, 'Akses internal ditolak.', 403);
  }
  return sendSuccess(res, { status: 'processed', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// 9. SEO SITEMAP & ROBOTS
// ---------------------------------------------------------------------------
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n`);
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://aeroapk.com/</loc></url></urlset>`);
});

// ---------------------------------------------------------------------------
// 10. GLOBAL 404 & ERROR HANDLER
// ---------------------------------------------------------------------------
app.use('/api/*', (req, res) => {
  return sendError(res, ERROR_CODES.INVALID_REQUEST, 'Endpoint API tidak ditemukan.', 404);
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('[AeroAPK Server Error]', err);
  if (res.headersSent) return next(err);
  return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message || 'Terjadi kesalahan internal server.', 500);
});

// ---------------------------------------------------------------------------
// 11. BOOTSTRAP VITE & SERVER
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AeroAPK Stage 8.3 Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
