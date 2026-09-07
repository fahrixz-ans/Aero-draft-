// ---------------------------------------------------------------------------
// AERO DTO DEFINITIONS & PROJECTION CONTRACTS (STAGE 8.8 & 8.9)
// ---------------------------------------------------------------------------

export interface PublicAppDTO {
  id: string;
  name: string;
  slug: string;
  packageName?: string;
  developerName: string;
  shortDescription: string;
  description: string;
  category: string;
  categoryId: string;
  iconUrl: string;
  bannerUrl: string;
  status: 'PUBLISHED';
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
  updatedAt: string;
  createdAt: string;
}

export interface AdminAppDTO extends Omit<PublicAppDTO, 'status'> {
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED' | 'REJECTED';
  packageName: string;
  createdBy?: string;
  updatedBy?: string;
  publishedAt?: string;
  archivedAt?: string;
  internalNotes?: string;
}

export interface PublicVersionDTO {
  id: string;
  appId: string;
  versionName: string;
  versionCode: number;
  changelog: string;
  minSdk: number;
  targetSdk: number;
  fileSize: number;
  sha256: string;
  permissions: string[];
  architectures: string[];
  releaseDate: string;
  createdAt: string;
}

export interface AdminVersionDTO extends PublicVersionDTO {
  packageName?: string;
  r2ObjectKey?: string;
  storageKey?: string;
  status: 'DRAFT' | 'UPLOADING' | 'QUEUED' | 'PROCESSING' | 'VERIFIED' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'FAILED' | 'QUARANTINED' | 'ARCHIVED';
  securityStatus: 'PENDING' | 'SCANNING' | 'VERIFIED' | 'WARNING' | 'FAILED' | 'QUARANTINED' | 'passed' | 'warning' | 'rejected';
  analysisStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  signingCertificate?: {
    sha256: string;
    sha1?: string;
    issuer?: string;
    subject?: string;
  };
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  appCount: number;
}

export interface AdminCategoryDTO extends PublicCategoryDTO {
  status: 'ACTIVE' | 'ARCHIVED';
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicCollectionDTO {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  apps?: PublicAppDTO[];
  appCount: number;
}

export interface AdminCollectionDTO {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE';
  appIds: string[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Projection Mappers
// ---------------------------------------------------------------------------

export function toPublicAppDTO(app: any): PublicAppDTO {
  return {
    id: app.id,
    name: app.name,
    slug: app.slug,
    packageName: app.packageName,
    developerName: app.developerName || app.developer || 'Pengembang Resmi',
    shortDescription: app.shortDescription || app.description?.slice(0, 150) || '',
    description: app.description || '',
    category: app.category || 'Alat & Utilitas',
    categoryId: app.categoryId || 'cat_1',
    iconUrl: app.iconUrl || app.icon?.url || app.icon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    bannerUrl: app.bannerUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800',
    status: 'PUBLISHED',
    distributionType: app.distributionType === 'OFFICIAL_WEBSITE' ? 'OFFICIAL_WEBSITE' : 'APK',
    ...(app.officialWebsiteUrl ? { officialWebsiteUrl: app.officialWebsiteUrl } : {}),
    ...(app.officialUrl ? { officialWebsiteUrl: app.officialUrl } : {}),
    downloads: app.downloads || 0,
    rating: app.rating || 4.5,
    reviewsCount: app.reviewsCount || 0,
    size: app.size || (app.fileSize ? `${Math.round(app.fileSize / (1024 * 1024))} MB` : '45 MB'),
    versionName: app.versionName || app.version || '1.0.0',
    versionCode: app.versionCode || 100,
    sha256: app.sha256 || '',
    latestVersionId: app.latestVersionId,
    updatedAt: app.updatedAt || new Date().toISOString(),
    createdAt: app.createdAt || new Date().toISOString()
  };
}

export function toAdminAppDTO(app: any): AdminAppDTO {
  return {
    ...toPublicAppDTO(app),
    status: app.status || 'DRAFT',
    packageName: app.packageName || '',
    createdBy: app.createdBy,
    updatedBy: app.updatedBy,
    publishedAt: app.publishedAt,
    archivedAt: app.archivedAt,
    internalNotes: app.internalNotes
  };
}

export function toPublicVersionDTO(ver: any): PublicVersionDTO {
  return {
    id: ver.id,
    appId: ver.appId,
    versionName: ver.versionName || '1.0.0',
    versionCode: ver.versionCode || 1,
    changelog: ver.changelog || ver.releaseNotes || 'Pembaruan stabilitas dan peningkatan performa.',
    minSdk: ver.minSdk || 24,
    targetSdk: ver.targetSdk || 34,
    fileSize: ver.fileSize || 0,
    sha256: ver.sha256 || '',
    permissions: Array.isArray(ver.permissions) ? ver.permissions : [],
    architectures: Array.isArray(ver.architectures) ? ver.architectures : ['arm64-v8a', 'armeabi-v7a'],
    releaseDate: ver.createdAt || new Date().toISOString(),
    createdAt: ver.createdAt || new Date().toISOString()
  };
}

export function toAdminVersionDTO(ver: any): AdminVersionDTO {
  return {
    ...toPublicVersionDTO(ver),
    packageName: ver.packageName,
    r2ObjectKey: ver.r2ObjectKey,
    storageKey: ver.storageKey,
    status: ver.status || 'DRAFT',
    securityStatus: ver.securityStatus || 'PENDING',
    analysisStatus: ver.analysisStatus || 'COMPLETED',
    signingCertificate: ver.signingCertificate || ver.certificate,
    moderationStatus: ver.moderationStatus
  };
}

export function toPublicCategoryDTO(cat: any, appCount = 0): PublicCategoryDTO {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || '',
    appCount
  };
}

export function toAdminCategoryDTO(cat: any, appCount = 0): AdminCategoryDTO {
  return {
    ...toPublicCategoryDTO(cat, appCount),
    status: cat.status || 'ACTIVE',
    sortOrder: cat.sortOrder || cat.sort_order || 0,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt
  };
}

export function toPublicCollectionDTO(col: any, appCount = 0): PublicCollectionDTO {
  return {
    id: col.id,
    title: col.title,
    slug: col.slug,
    description: col.description || '',
    bannerUrl: col.bannerUrl,
    appCount: appCount || (Array.isArray(col.appIds) ? col.appIds.length : 0)
  };
}
