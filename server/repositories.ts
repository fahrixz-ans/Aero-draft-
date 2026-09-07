// ---------------------------------------------------------------------------
// AERO REPOSITORY LAYER (STAGE 8.8 & 8.9)
// Encapsulates database operations for Firestore and in-memory persistent stores
// ---------------------------------------------------------------------------

export interface AppEntity {
  id: string;
  name: string;
  slug: string;
  packageName: string;
  developerName: string;
  shortDescription: string;
  description: string;
  category: string;
  categoryId: string;
  iconUrl: string;
  bannerUrl: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED' | 'REJECTED';
  distributionType: 'APK' | 'OFFICIAL_WEBSITE';
  officialWebsiteUrl?: string;
  downloads: number;
  rating: number;
  reviewsCount: number;
  size: string;
  versionName: string;
  versionCode: number;
  sha256: string;
  latestVersionId?: string;
  createdBy?: string;
  updatedBy?: string;
  publishedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VersionEntity {
  id: string;
  appId: string;
  versionName: string;
  versionCode: number;
  packageName?: string;
  sha256: string;
  status: 'DRAFT' | 'UPLOADING' | 'QUEUED' | 'PROCESSING' | 'VERIFIED' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'FAILED' | 'QUARANTINED' | 'ARCHIVED' | 'REVOKED';
  securityStatus: 'PENDING' | 'SCANNING' | 'VERIFIED' | 'WARNING' | 'FAILED' | 'QUARANTINED' | 'passed' | 'warning' | 'rejected';
  analysisStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  storageKey?: string;
  r2ObjectKey?: string;
  changelog: string;
  minSdk: number;
  targetSdk: number;
  fileSize: number;
  permissions: string[];
  architectures: string[];
  signingCertificate?: {
    sha256: string;
    sha1?: string;
    issuer?: string;
    subject?: string;
  };
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  downloadAllowed?: boolean;
  securityRevoked?: boolean;
  archivedAt?: string;
  revokedAt?: string;
  archiveReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryEntity {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ARCHIVED';
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionEntity {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE';
  bannerUrl?: string;
  appIds: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadEntity {
  uploadId: string;
  fileName: string;
  objectKey: string;
  contentType: string;
  expectedSize: number;
  actualSize?: number;
  status: 'CREATED' | 'UPLOADING' | 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'QUARANTINED';
  appId?: string;
  versionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface JobEntity {
  jobId: string;
  type: 'APK_PROCESSING' | 'SECURITY_SCAN' | 'SEARCH_INDEX' | 'RECONCILIATION';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTERED';
  uploadId?: string;
  appId?: string;
  versionId?: string;
  attempt: number;
  maxAttempts: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  nextRetryAt?: string;
}

// ---------------------------------------------------------------------------
// In-Memory Database Stores (Initialized with Seed Records)
// ---------------------------------------------------------------------------

export const categoriesDb: CategoryEntity[] = [
  { id: 'cat_1', name: 'Alat & Utilitas', slug: 'alat-utilitas', status: 'ACTIVE', description: 'Utilitas harian dan perkakas sistem Android.', sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_2', name: 'Sosial & Komunikasi', slug: 'sosial-komunikasi', status: 'ACTIVE', description: 'Aplikasi perpesanan dan jejaring sosial terpopuler.', sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_3', name: 'Produktivitas', slug: 'produktivitas', status: 'ACTIVE', description: 'Dokumen, catatan kerja, dan manajemen waktu.', sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_4', name: 'Game & Hiburan', slug: 'game-hiburan', status: 'ACTIVE', description: 'Hiburan interaktif, streaming, dan permainan mobile.', sortOrder: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_5', name: 'Fotografi & Video', slug: 'fotografi-video', status: 'ACTIVE', description: 'Penyuntingan foto profesional dan kreasi video AI.', sortOrder: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const appsDb: AppEntity[] = [
  {
    id: 'app_capcut',
    name: 'CapCut - Video Editor',
    slug: 'capcut-video-editor',
    packageName: 'com.lemon.lv',
    developerName: 'Bytedance Pte. Ltd.',
    shortDescription: 'Aplikasi penyunting video all-in-one profesional dengan fitur AI canggih.',
    description: 'CapCut adalah editor video resmi serbaguna dan pembuat video gratis dengan semua yang Anda butuhkan untuk membuat konten berkualitas tinggi.',
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
    publishedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'app_whatsapp',
    name: 'WhatsApp Messenger',
    slug: 'whatsapp-messenger',
    packageName: 'com.whatsapp',
    developerName: 'WhatsApp LLC',
    shortDescription: 'Pesan instan yang simpel, aman, dan dapat diandalkan tanpa batas.',
    description: 'WhatsApp Messenger adalah aplikasi pesan gratis yang tersedia untuk Android dan ponsel cerdas lainnya dengan enkripsi ujung ke ujung.',
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
    publishedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'app_spotify',
    name: 'Spotify: Music & Podcasts',
    slug: 'spotify-music-podcasts',
    packageName: 'com.spotify.music',
    developerName: 'Spotify AB',
    shortDescription: 'Streaming musik, album, dan podcast favorit Anda kapan saja.',
    description: 'Dengarkan musik, podcast, dan album jutaan musisi gratis di ponsel dan tablet Anda dengan Spotify.',
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
    publishedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

export const versionsDb: VersionEntity[] = [
  {
    id: 'ver_capcut_1',
    appId: 'app_capcut',
    versionName: '11.4.0',
    versionCode: 11400,
    packageName: 'com.lemon.lv',
    sha256: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
    status: 'PUBLISHED',
    securityStatus: 'VERIFIED',
    analysisStatus: 'COMPLETED',
    storageKey: 'apks/E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855.apk',
    r2ObjectKey: 'apps/app_capcut/versions/ver_capcut_1/capcut-11.4.0.apk',
    changelog: 'Pembaruan stabilitas dan peningkatan performa editor AI.',
    minSdk: 26,
    targetSdk: 34,
    fileSize: 130023400,
    permissions: ['INTERNET', 'READ_EXTERNAL_STORAGE', 'RECORD_AUDIO'],
    architectures: ['arm64-v8a', 'armeabi-v7a'],
    signingCertificate: {
      sha256: '9A:B1:C2:D3:E4:F5:06:17:28:39:4A:5B:6C:7D:8E:9F:A0:B1:C2:D3:E4:F5:06:17:28:39:4A:5B:6C:7D:8E:9F',
      issuer: 'C=SG, O=Bytedance, CN=CapCut Release',
      subject: 'C=SG, O=Bytedance, CN=CapCut Release'
    },
    moderationStatus: 'APPROVED',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'ver_wa_1',
    appId: 'app_whatsapp',
    versionName: '2.24.12',
    versionCode: 241200,
    packageName: 'com.whatsapp',
    sha256: 'A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
    status: 'PUBLISHED',
    securityStatus: 'VERIFIED',
    analysisStatus: 'COMPLETED',
    storageKey: 'apks/A1B2C3D4E5F678901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF.apk',
    r2ObjectKey: 'apps/app_whatsapp/versions/ver_wa_1/whatsapp-2.24.12.apk',
    changelog: 'Dukungan enkripsi pesan grup baru dan perbaikan bug sistem.',
    minSdk: 24,
    targetSdk: 34,
    fileSize: 50331648,
    permissions: ['INTERNET', 'READ_CONTACTS', 'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION'],
    architectures: ['arm64-v8a', 'armeabi-v7a'],
    signingCertificate: {
      sha256: '3F:9C:A2:8D:7B:E1:90:54:E3:FA:31:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:12',
      issuer: 'C=US, O=WhatsApp LLC, CN=WhatsApp Release',
      subject: 'C=US, O=WhatsApp LLC, CN=WhatsApp Release'
    },
    moderationStatus: 'APPROVED',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: 'ver_spotify_1',
    appId: 'app_spotify',
    versionName: '8.9.30',
    versionCode: 89300,
    packageName: 'com.spotify.music',
    sha256: 'B2C3D4E5F6A178901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF',
    status: 'PUBLISHED',
    securityStatus: 'VERIFIED',
    analysisStatus: 'COMPLETED',
    storageKey: 'apks/B2C3D4E5F6A178901234567890ABCDEF1234567890ABCDEF1234567890ABCDEF.apk',
    r2ObjectKey: 'apps/app_spotify/versions/ver_spotify_1/spotify-8.9.30.apk',
    changelog: 'Antarmuka pemutar musik mini yang diperbarui.',
    minSdk: 26,
    targetSdk: 34,
    fileSize: 90177536,
    permissions: ['INTERNET', 'WAKE_LOCK', 'FOREGROUND_SERVICE'],
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    signingCertificate: {
      sha256: '44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:11:22:33:44:55',
      issuer: 'C=SE, O=Spotify AB, CN=Spotify Release',
      subject: 'C=SE, O=Spotify AB, CN=Spotify Release'
    },
    moderationStatus: 'APPROVED',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 86400000).toISOString()
  }
];

export const collectionsDb: CollectionEntity[] = [
  {
    id: 'col_1',
    title: 'Aplikasi Terpopuler Minggu Ini',
    slug: 'aplikasi-terpopuler-minggu-ini',
    description: 'Pilihan aplikasi paling banyak diunduh oleh komunitas Aero dengan performa stabil.',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
    appIds: ['app_capcut', 'app_whatsapp', 'app_spotify'],
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const moderationDb: any[] = [
  {
    id: 'mod_1',
    appId: 'app_capcut',
    resourceType: 'application',
    status: 'approved',
    priority: 'medium',
    reason: 'Verifikasi rilis editor versi stabil',
    description: 'Aplikasi telah lolos pemeriksaan keamanan SHA-256 dan izin sistem.',
    createdAt: new Date().toISOString()
  }
];

export const securityScansDb: any[] = [
  {
    versionId: 'ver_capcut_1',
    status: 'VERIFIED',
    severity: 'INFO',
    vulnerabilitiesCount: 0,
    scannedAt: new Date().toISOString(),
    scanner: 'AeroShield Security Engine v5.0',
    findings: []
  },
  {
    versionId: 'ver_wa_1',
    status: 'VERIFIED',
    severity: 'INFO',
    vulnerabilitiesCount: 0,
    scannedAt: new Date().toISOString(),
    scanner: 'AeroShield Security Engine v5.0',
    findings: []
  }
];

export const auditLogsDb: any[] = [];
export const uploadsDb: UploadEntity[] = [];
export const jobsDb: JobEntity[] = [];
export const deadLetterJobsDb: any[] = [];

export const usersDb = [
  { id: 'usr_0', email: 'fantrastore.id@gmail.com', name: 'Super Admin', role: 'SUPER_ADMIN', status: 'ACTIVE', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() },
  { id: 'usr_1', email: 'fahriandriansaputra123@gmail.com', name: 'Super Admin', role: 'SUPER_ADMIN', status: 'ACTIVE', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() },
  { id: 'usr_2', email: 'moderator@aeroapk.com', name: 'Moderator Utama', role: 'MODERATOR', status: 'ACTIVE', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() }
];

export const systemSettingsDb = {
  general: { siteName: 'AeroAPK', maintenanceMode: false, maxDailyDownloadsPerIp: 50 },
  security: { scanRequired: true, maxApkSizeMB: 200, enforceStrictSignatureCheck: true },
  analytics: { trackingEnabled: true, anonymizeIp: true }
};

// ---------------------------------------------------------------------------
// Repository Classes
// ---------------------------------------------------------------------------

export class AppRepository {
  static async findPublished(filters: { search?: string; category?: string; sort?: string; order?: string; page?: number; pageSize?: number }) {
    let list = appsDb.filter(a => a.status === 'PUBLISHED');

    if (filters.category) {
      const cat = filters.category.toLowerCase();
      list = list.filter(a => a.category.toLowerCase() === cat || a.categoryId === cat);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.packageName.toLowerCase().includes(q) ||
        a.developerName.toLowerCase().includes(q)
      );
    }

    const sortField = filters.sort || 'popular';
    const sortOrder = filters.order === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (sortField === 'popular') return (b.downloads - a.downloads) * (sortOrder === 1 ? -1 : 1);
      if (sortField === 'rating') return (b.rating - a.rating) * (sortOrder === 1 ? -1 : 1);
      if (sortField === 'updated' || sortField === 'recently_updated') {
        return (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) * (sortOrder === 1 ? -1 : 1);
      }
      if (sortField === 'new_releases' || sortField === 'created') {
        return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * (sortOrder === 1 ? -1 : 1);
      }
      return 0;
    });

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const total = list.length;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);

    return { data: paginated, total, page, pageSize };
  }

  static async findBySlug(slug: string): Promise<AppEntity | null> {
    return appsDb.find(a => a.slug === slug && a.status === 'PUBLISHED') || null;
  }

  static async findById(id: string): Promise<AppEntity | null> {
    return appsDb.find(a => a.id === id || a.slug === id) || null;
  }

  static async findAllAdmin(filters: { search?: string; status?: string; category?: string; distributionType?: string; page?: number; pageSize?: number }) {
    let list = [...appsDb];

    if (filters.status) {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters.category) {
      list = list.filter(a => a.categoryId === filters.category || a.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters.distributionType) {
      list = list.filter(a => a.distributionType === filters.distributionType);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.packageName.toLowerCase().includes(q)
      );
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const total = list.length;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);

    return { data: paginated, total, page, pageSize };
  }

  static async create(appData: Partial<AppEntity>): Promise<AppEntity> {
    const newApp: AppEntity = {
      id: `app_${Date.now()}`,
      name: appData.name || '',
      slug: appData.slug || '',
      packageName: appData.packageName || '',
      developerName: appData.developerName || 'Aero Developer',
      shortDescription: appData.shortDescription || '',
      description: appData.description || '',
      category: appData.category || 'Alat & Utilitas',
      categoryId: appData.categoryId || 'cat_1',
      iconUrl: appData.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      bannerUrl: appData.bannerUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800',
      status: 'DRAFT',
      distributionType: appData.distributionType || 'APK',
      officialWebsiteUrl: appData.officialWebsiteUrl,
      downloads: 0,
      rating: 5.0,
      reviewsCount: 0,
      size: appData.size || '45 MB',
      versionName: appData.versionName || '1.0.0',
      versionCode: appData.versionCode || 100,
      sha256: appData.sha256 || '',
      latestVersionId: appData.latestVersionId || '',
      createdBy: appData.createdBy,
      updatedBy: appData.updatedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    appsDb.push(newApp);
    return newApp;
  }

  static async update(id: string, updates: Partial<AppEntity>): Promise<AppEntity | null> {
    const app = appsDb.find(a => a.id === id);
    if (!app) return null;
    Object.assign(app, updates, { updatedAt: new Date().toISOString() });
    return app;
  }

  static async publish(id: string): Promise<AppEntity | null> {
    const app = appsDb.find(a => a.id === id);
    if (!app) return null;
    app.status = 'PUBLISHED';
    app.publishedAt = new Date().toISOString();
    app.updatedAt = new Date().toISOString();
    return app;
  }

  static async archive(id: string): Promise<AppEntity | null> {
    const app = appsDb.find(a => a.id === id);
    if (!app) return null;
    app.status = 'ARCHIVED';
    app.archivedAt = new Date().toISOString();
    app.updatedAt = new Date().toISOString();
    return app;
  }

  static async restore(id: string): Promise<AppEntity | null> {
    const app = appsDb.find(a => a.id === id);
    if (!app) return null;
    app.status = 'DRAFT';
    app.updatedAt = new Date().toISOString();
    return app;
  }

  static async incrementDownloads(id: string): Promise<void> {
    const app = appsDb.find(a => a.id === id || a.slug === id);
    if (app) {
      app.downloads = (app.downloads || 0) + 1;
    }
  }
}

export class VersionRepository {
  static async findPublishedByAppId(appId: string): Promise<VersionEntity[]> {
    return versionsDb
      .filter(v => v.appId === appId && v.status === 'PUBLISHED')
      .sort((a, b) => b.versionCode - a.versionCode);
  }

  static async findById(id: string): Promise<VersionEntity | null> {
    return versionsDb.find(v => v.id === id) || null;
  }

  static async findAllByAppId(appId: string): Promise<VersionEntity[]> {
    return versionsDb
      .filter(v => v.appId === appId)
      .sort((a, b) => b.versionCode - a.versionCode);
  }

  static async create(data: Partial<VersionEntity>): Promise<VersionEntity> {
    const newVer: VersionEntity = {
      id: `ver_${Date.now()}`,
      appId: data.appId || '',
      versionName: data.versionName || '1.0.0',
      versionCode: data.versionCode || 1,
      packageName: data.packageName || '',
      sha256: data.sha256 || '',
      status: 'DRAFT',
      securityStatus: 'PENDING',
      analysisStatus: 'COMPLETED',
      storageKey: data.storageKey || '',
      r2ObjectKey: data.r2ObjectKey || '',
      changelog: data.changelog || 'Rilis versi baru.',
      minSdk: data.minSdk || 24,
      targetSdk: data.targetSdk || 34,
      fileSize: data.fileSize || 0,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      architectures: Array.isArray(data.architectures) ? data.architectures : ['arm64-v8a', 'armeabi-v7a'],
      signingCertificate: data.signingCertificate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    versionsDb.push(newVer);
    return newVer;
  }

  static async update(id: string, updates: Partial<VersionEntity>): Promise<VersionEntity | null> {
    const ver = versionsDb.find(v => v.id === id);
    if (!ver) return null;
    Object.assign(ver, updates, { updatedAt: new Date().toISOString() });
    return ver;
  }

  static async publish(id: string): Promise<VersionEntity | null> {
    const ver = versionsDb.find(v => v.id === id);
    if (!ver) return null;
    ver.status = 'PUBLISHED';
    ver.updatedAt = new Date().toISOString();
    return ver;
  }

  static async archive(id: string): Promise<VersionEntity | null> {
    const ver = versionsDb.find(v => v.id === id);
    if (!ver) return null;
    ver.status = 'ARCHIVED';
    ver.archivedAt = new Date().toISOString();
    ver.updatedAt = new Date().toISOString();
    return ver;
  }

  static async revoke(id: string, reason?: string): Promise<VersionEntity | null> {
    const ver = versionsDb.find(v => v.id === id);
    if (!ver) return null;
    ver.status = 'REVOKED';
    ver.downloadAllowed = false;
    ver.securityRevoked = true;
    ver.revokedAt = new Date().toISOString();
    ver.archiveReason = reason || 'Security or policy violation revocation';
    ver.updatedAt = new Date().toISOString();
    return ver;
  }
}

export class CategoryRepository {
  static async findActive(): Promise<CategoryEntity[]> {
    return categoriesDb
      .filter(c => c.status === 'ACTIVE')
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  static async findBySlug(slug: string): Promise<CategoryEntity | null> {
    return categoriesDb.find(c => c.slug === slug) || null;
  }

  static async findById(id: string): Promise<CategoryEntity | null> {
    return categoriesDb.find(c => c.id === id) || null;
  }

  static async findAll(): Promise<CategoryEntity[]> {
    return [...categoriesDb].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  static async create(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const newCat: CategoryEntity = {
      id: `cat_${Date.now()}`,
      name: data.name || '',
      slug: data.slug || '',
      status: 'ACTIVE',
      description: data.description || '',
      sortOrder: data.sortOrder || categoriesDb.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    categoriesDb.push(newCat);
    return newCat;
  }

  static async update(id: string, updates: Partial<CategoryEntity>): Promise<CategoryEntity | null> {
    const cat = categoriesDb.find(c => c.id === id);
    if (!cat) return null;
    Object.assign(cat, updates, { updatedAt: new Date().toISOString() });
    return cat;
  }

  static async archive(id: string): Promise<CategoryEntity | null> {
    const cat = categoriesDb.find(c => c.id === id);
    if (!cat) return null;
    cat.status = 'ARCHIVED';
    cat.updatedAt = new Date().toISOString();
    return cat;
  }

  static async restore(id: string): Promise<CategoryEntity | null> {
    const cat = categoriesDb.find(c => c.id === id);
    if (!cat) return null;
    cat.status = 'ACTIVE';
    cat.updatedAt = new Date().toISOString();
    return cat;
  }
}

export class CollectionRepository {
  static async findPublished(): Promise<CollectionEntity[]> {
    return collectionsDb
      .filter(c => c.status === 'PUBLISHED' && c.visibility === 'PUBLIC')
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  static async findBySlug(slug: string): Promise<CollectionEntity | null> {
    return collectionsDb.find(c => c.slug === slug && c.status === 'PUBLISHED') || null;
  }

  static async findById(id: string): Promise<CollectionEntity | null> {
    return collectionsDb.find(c => c.id === id) || null;
  }

  static async findAll(): Promise<CollectionEntity[]> {
    return [...collectionsDb];
  }

  static async create(data: Partial<CollectionEntity>): Promise<CollectionEntity> {
    const newCol: CollectionEntity = {
      id: `col_${Date.now()}`,
      title: data.title || '',
      slug: data.slug || '',
      description: data.description || '',
      status: 'DRAFT',
      visibility: data.visibility || 'PUBLIC',
      bannerUrl: data.bannerUrl,
      appIds: Array.isArray(data.appIds) ? data.appIds : [],
      sortOrder: data.sortOrder || collectionsDb.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    collectionsDb.push(newCol);
    return newCol;
  }

  static async update(id: string, updates: Partial<CollectionEntity>): Promise<CollectionEntity | null> {
    const col = collectionsDb.find(c => c.id === id);
    if (!col) return null;
    Object.assign(col, updates, { updatedAt: new Date().toISOString() });
    return col;
  }

  static async publish(id: string): Promise<CollectionEntity | null> {
    const col = collectionsDb.find(c => c.id === id);
    if (!col) return null;
    col.status = 'PUBLISHED';
    col.updatedAt = new Date().toISOString();
    return col;
  }

  static async archive(id: string): Promise<CollectionEntity | null> {
    const col = collectionsDb.find(c => c.id === id);
    if (!col) return null;
    col.status = 'ARCHIVED';
    col.updatedAt = new Date().toISOString();
    return col;
  }

  static async addApp(id: string, appId: string): Promise<CollectionEntity | null> {
    const col = collectionsDb.find(c => c.id === id);
    if (!col) return null;
    if (!col.appIds.includes(appId)) {
      col.appIds.push(appId);
      col.updatedAt = new Date().toISOString();
    }
    return col;
  }

  static async removeApp(id: string, appId: string): Promise<CollectionEntity | null> {
    const col = collectionsDb.find(c => c.id === id);
    if (!col) return null;
    col.appIds = col.appIds.filter(a => a !== appId);
    col.updatedAt = new Date().toISOString();
    return col;
  }

  static async reorderApps(id: string, orderedAppIds: string[]): Promise<CollectionEntity | null> {
    const col = collectionsDb.find(c => c.id === id);
    if (!col) return null;
    col.appIds = orderedAppIds;
    col.updatedAt = new Date().toISOString();
    return col;
  }
}
