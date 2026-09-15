// ---------------------------------------------------------------------------
// MOD STATION FIRESTORE REPOSITORY LAYER
// ---------------------------------------------------------------------------
// IMPORTANT:
// - Firestore is the only persistent data source in this module.
// - No seed arrays, in-memory databases, hardcoded users, or fake metrics.
// - Server-side access uses Firebase Admin SDK so Auth.js remains the auth
//   system while Firestore remains the database.
// - Timestamps are stored as Firestore server timestamps and normalized to ISO
//   strings only at the repository boundary.
// ---------------------------------------------------------------------------

import { cert, getApps, initializeApp, type App as FirebaseAdminApp } from 'firebase-admin/app';
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentData,
  type Firestore,
  type Query,
  type WhereFilterOp,
} from 'firebase-admin/firestore';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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
  [key: string]: any;
}

export interface VersionEntity {
  id: string;
  appId: string;
  versionName: string;
  versionCode: number;
  packageName?: string;
  sha256: string;
  status: 'DRAFT' | 'UPLOADING' | 'QUEUED' | 'PROCESSING' | 'VERIFIED' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'FAILED' | 'QUARANTINED' | 'ARCHIVED' | 'REVOKED';
  securityStatus: 'PENDING' | 'SCANNING' | 'VERIFIED' | 'WARNING' | 'FAILED' | 'QUARANTINED' | 'passed' | 'warning' | 'rejected' | 'CLEAN' | 'MALICIOUS';
  analysisStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  storageKey?: string;
  storageObjectKey?: string;
  storageProvider?: string;
  downloadUrl?: string;
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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
}

export type JobType =
  | 'APK_PROCESSING' | 'SECURITY_SCAN' | 'SEARCH_INDEX' | 'RECONCILIATION'
  | 'GENERATE_SITEMAP' | 'VALIDATE_SEO' | 'REFRESH_METADATA' | 'CHECK_INTERNAL_LINKS' | 'CHECK_STALE_PAGES' | 'REBUILD_COLLECTION_SEO'
  | 'CLASSIFY_QUERY' | 'EXPAND_QUERY' | 'GENERATE_EMBEDDING' | 'UPDATE_APP_EMBEDDING' | 'REBUILD_SEMANTIC_INDEX'
  | 'GENERATE_RECOMMENDATION' | 'REBUILD_COLLECTION' | 'EVALUATE_DISCOVERY' | 'GENERATE_AI_REPORT' | 'DETECT_DISCOVERY_OPPORTUNITY';

export interface JobEntity {
  jobId: string;
  type: JobType;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTERED';
  uploadId?: string;
  appId?: string;
  versionId?: string;
  entityId?: string;
  attempt: number;
  maxAttempts: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  nextRetryAt?: string;
  [key: string]: any;
}

export interface ModerationEntity {
  id: string;
  appId?: string;
  resourceType?: string;
  status: string;
  priority?: string;
  reason?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface SecurityScanEntity {
  id?: string;
  versionId: string;
  status: string;
  severity?: string;
  vulnerabilitiesCount?: number;
  scannedAt?: string;
  scanner?: string;
  findings?: any[];
  [key: string]: any;
}

export interface UserEntity {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  [key: string]: any;
}

const COLLECTIONS = {
  apps: 'applications',
  versions: 'appVersions',
  categories: 'categories',
  collections: 'collections',
  moderation: 'moderation',
  securityScans: 'securityScans',
  auditLogs: 'adminAuditLogs',
  uploads: 'uploads',
  jobs: 'jobs',
  deadLetterJobs: 'deadLetterJobs',
  users: 'users',
  settings: 'settings',
} as const;

// Dynamically read from local firebase config if needed
let configDbId: string | undefined;
let configProjectId: string | undefined;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (configData.firestoreDatabaseId && configData.firestoreDatabaseId !== '(default)') {
      configDbId = configData.firestoreDatabaseId;
    }
    if (configData.projectId) {
      configProjectId = configData.projectId;
    }
  }
} catch (err) {
  console.warn('[Repositories] Failed to read firebase-applet-config.json:', err);
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value.trim();
}

function getAdminApp(): FirebaseAdminApp {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID || configProjectId || 'mod-station-prod';

  // Firestore emulator intentionally does not require a service-account key.
  // Production always requires explicit server credentials.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId });
  }

  const clientEmail = requiredEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = requiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const resolvedDatabaseId = (configDbId && configDbId !== '(default)') 
  ? configDbId 
  : ((process.env.FIRESTORE_DATABASE_ID && process.env.FIRESTORE_DATABASE_ID !== '(default)') 
      ? process.env.FIRESTORE_DATABASE_ID 
      : '(default)');

console.log(`[Repositories] Initializing Firestore with Project ID: "${process.env.FIREBASE_PROJECT_ID || configProjectId || 'mod-station-prod'}" and Database ID: "${resolvedDatabaseId}"`);

export const firestore: Firestore = getFirestore(
  getAdminApp(),
  resolvedDatabaseId
);

function normalize(value: any): any {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) out[key] = normalize(item);
    return out;
  }
  return value;
}

function withId<T>(id: string, data: DocumentData | undefined): T | null {
  if (!data) return null;
  return { id, ...normalize(data) } as T;
}

function cleanUndefined<T extends Record<string, any>>(value: T): T {
  const out: Record<string, any> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) out[key] = item;
  }
  return out as T;
}

function nowFields() {
  return { createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
}

function updateFields(updates: Record<string, any>) {
  return cleanUndefined({ ...updates, updatedAt: FieldValue.serverTimestamp() });
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

async function getById<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await firestore.collection(collectionName).doc(id).get();
  return withId<T>(snap.id, snap.exists ? snap.data() : undefined);
}

async function listAll<T>(collectionName: string): Promise<T[]> {
  const snap = await firestore.collection(collectionName).get();
  return snap.docs.map(doc => withId<T>(doc.id, doc.data())!).filter(Boolean);
}

async function queryAll<T>(collectionName: string, wheres: Array<[string, WhereFilterOp, any]> = []): Promise<T[]> {
  let query: Query = firestore.collection(collectionName);
  for (const [field, op, value] of wheres) query = query.where(field, op, value);
  const snap = await query.get();
  return snap.docs.map(doc => withId<T>(doc.id, doc.data())!).filter(Boolean);
}

function normalizePage(page?: number, pageSize?: number) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safePageSize = Math.min(1000, Math.max(1, Math.floor(Number(pageSize) || 20)));
  return { page: safePage, pageSize: safePageSize };
}

function sortApps(list: AppEntity[], sort = 'popular', order = 'desc') {
  const direction = order === 'asc' ? 1 : -1;
  const value = (a: AppEntity) => {
    if (sort === 'rating') return a.rating || 0;
    if (sort === 'updated' || sort === 'recently_updated') return Date.parse(a.updatedAt || '') || 0;
    if (sort === 'new_releases' || sort === 'created') return Date.parse(a.createdAt || '') || 0;
    return a.downloads || 0;
  };
  return [...list].sort((a, b) => (value(a) - value(b)) * direction);
}

export class AppRepository {
  static async findPublished(filters: { search?: string; category?: string; sort?: string; order?: string; page?: number; pageSize?: number }) {
    const constraints: Array<[string, WhereFilterOp, any]> = [['status', '==', 'PUBLISHED']];
    if (filters.category) {
      constraints.push(['categoryId', '==', filters.category]);
    }
    // Do not rely on a Firestore full-text search that does not exist. Search is
    // performed over the Firestore result set, never over a local seed database.
    let list = await queryAll<AppEntity>(COLLECTIONS.apps, constraints as any);

    if (filters.category && list.length === 0) {
      list = await queryAll<AppEntity>(COLLECTIONS.apps, [['status', '==', 'PUBLISHED']]);
      const cat = filters.category.toLowerCase();
      list = list.filter(a => String(a.category || '').toLowerCase() === cat || a.categoryId === filters.category);
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(a => [a.name, a.slug, a.packageName, a.developerName].some(v => String(v || '').toLowerCase().includes(q)));
    }

    list = sortApps(list, filters.sort, filters.order);
    const { page, pageSize } = normalizePage(filters.page, filters.pageSize);
    const total = list.length;
    return { data: list.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize };
  }

  static async findBySlug(slug: string): Promise<AppEntity | null> {
    const snap = await firestore.collection(COLLECTIONS.apps).where('slug', '==', slug).limit(10).get();
    const app = snap.docs.map(d => withId<AppEntity>(d.id, d.data())!).find(a => a.status === 'PUBLISHED');
    return app || null;
  }

  static async findById(id: string): Promise<AppEntity | null> {
    const direct = await getById<AppEntity>(COLLECTIONS.apps, id);
    if (direct) return direct;
    const snap = await firestore.collection(COLLECTIONS.apps).where('slug', '==', id).limit(1).get();
    return snap.empty ? null : withId<AppEntity>(snap.docs[0].id, snap.docs[0].data());
  }

  static async findAllAdmin(filters: { search?: string; status?: string; category?: string; distributionType?: string; page?: number; pageSize?: number }) {
    const constraints: any[] = [];
    if (filters.status) constraints.push(['status', '==', filters.status]);
    if (filters.category) constraints.push(['categoryId', '==', filters.category]);
    if (filters.distributionType) constraints.push(['distributionType', '==', filters.distributionType]);
    let list = await queryAll<AppEntity>(COLLECTIONS.apps, constraints as any);
    if (filters.category) {
      const c = filters.category.toLowerCase();
      list = list.filter(a => a.categoryId === filters.category || String(a.category || '').toLowerCase() === c);
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(a => [a.name, a.slug, a.packageName, a.developerName].some(v => String(v || '').toLowerCase().includes(q)));
    }
    list.sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));
    const { page, pageSize } = normalizePage(filters.page, filters.pageSize || 50);
    return { data: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize };
  }

  static async create(appData: Partial<AppEntity>): Promise<AppEntity> {
    if (!appData.name || !appData.slug || !appData.categoryId) throw new Error('name, slug, and categoryId are required');
    const duplicateSlug = await firestore.collection(COLLECTIONS.apps).where('slug', '==', appData.slug).limit(1).get();
    if (!duplicateSlug.empty) throw new Error('APP_ALREADY_EXISTS');
    if (appData.packageName) {
      const duplicatePackage = await firestore.collection(COLLECTIONS.apps).where('packageName', '==', appData.packageName).limit(1).get();
      if (!duplicatePackage.empty) throw new Error('APP_ALREADY_EXISTS');
    }
    const id = newId('app');
    const ref = firestore.collection(COLLECTIONS.apps).doc(id);
    const data = cleanUndefined({
      name: appData.name,
      slug: appData.slug,
      packageName: appData.packageName || '',
      developerName: appData.developerName || '',
      shortDescription: appData.shortDescription || '',
      description: appData.description || '',
      category: appData.category || '',
      categoryId: appData.categoryId,
      iconUrl: appData.iconUrl || '',
      bannerUrl: appData.bannerUrl || '',
      status: appData.status || 'DRAFT',
      distributionType: appData.distributionType || 'APK',
      officialWebsiteUrl: appData.officialWebsiteUrl,
      downloads: Number(appData.downloads || 0),
      rating: Number(appData.rating || 0),
      reviewsCount: Number(appData.reviewsCount || 0),
      size: appData.size || '',
      versionName: appData.versionName || '',
      versionCode: Number(appData.versionCode || 0),
      sha256: appData.sha256 || '',
      latestVersionId: appData.latestVersionId,
      createdBy: appData.createdBy,
      updatedBy: appData.updatedBy,
      ...nowFields(),
    });
    await ref.create(data);
    return (await getById<AppEntity>(COLLECTIONS.apps, id))!;
  }

  static async update(id: string, updates: Partial<AppEntity>): Promise<AppEntity | null> {
    const ref = firestore.collection(COLLECTIONS.apps).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const protectedUpdates = { ...updates } as Record<string, any>;
    delete protectedUpdates.id;
    delete protectedUpdates.createdAt;
    await ref.update(updateFields(protectedUpdates));
    return getById<AppEntity>(COLLECTIONS.apps, id);
  }

  static async publish(id: string): Promise<AppEntity | null> {
    const ref = firestore.collection(COLLECTIONS.apps).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    await ref.update(updateFields({ status: 'PUBLISHED', publishedAt: FieldValue.serverTimestamp(), archivedAt: FieldValue.delete() }));
    return getById<AppEntity>(COLLECTIONS.apps, id);
  }

  static async archive(id: string): Promise<AppEntity | null> {
    const ref = firestore.collection(COLLECTIONS.apps).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    await ref.update(updateFields({ status: 'ARCHIVED', archivedAt: FieldValue.serverTimestamp() }));
    return getById<AppEntity>(COLLECTIONS.apps, id);
  }

  static async restore(id: string): Promise<AppEntity | null> {
    const ref = firestore.collection(COLLECTIONS.apps).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    await ref.update(updateFields({ status: 'DRAFT', archivedAt: FieldValue.delete() }));
    return getById<AppEntity>(COLLECTIONS.apps, id);
  }

  static async incrementDownloads(id: string): Promise<void> {
    await firestore.collection(COLLECTIONS.apps).doc(id).update({ downloads: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
  }

  static async listAll(): Promise<AppEntity[]> {
    return listAll<AppEntity>(COLLECTIONS.apps);
  }
}

export class VersionRepository {
  private static collection(appId: string) {
    return firestore.collection(COLLECTIONS.apps).doc(appId).collection(COLLECTIONS.versions);
  }

  private static async findRefById(id: string) {
    const snap = await firestore.collectionGroup(COLLECTIONS.versions).get();
    const doc = snap.docs.find(item => item.id === id);
    return doc ? doc.ref : null;
  }

  static async findPublishedByAppId(appId: string): Promise<VersionEntity[]> {
    const snap = await this.collection(appId).where('status', '==', 'PUBLISHED').get();
    return snap.docs
      .map(doc => withId<VersionEntity>(doc.id, doc.data())!)
      .sort((a, b) => Number(b.versionCode || 0) - Number(a.versionCode || 0));
  }

  static async findById(id: string): Promise<VersionEntity | null> {
    const ref = await this.findRefById(id);
    if (!ref) return null;
    const snap = await ref.get();
    return withId<VersionEntity>(snap.id, snap.exists ? snap.data() : undefined);
  }

  static async findAllByAppId(appId: string): Promise<VersionEntity[]> {
    const snap = await this.collection(appId).get();
    return snap.docs
      .map(doc => withId<VersionEntity>(doc.id, doc.data())!)
      .sort((a, b) => Number(b.versionCode || 0) - Number(a.versionCode || 0));
  }

  static async create(data: Partial<VersionEntity>): Promise<VersionEntity> {
    if (!data.appId || !data.versionName || !Number.isFinite(Number(data.versionCode))) {
      throw new Error('appId, versionName, and versionCode are required');
    }
    const id = newId('ver');
    await this.collection(data.appId).doc(id).create(cleanUndefined({
      appId: data.appId, versionName: data.versionName, versionCode: Number(data.versionCode),
      packageName: data.packageName, sha256: data.sha256 || '', status: data.status || 'DRAFT',
      securityStatus: data.securityStatus || 'PENDING', analysisStatus: data.analysisStatus || 'PENDING',
      storageKey: data.storageKey, storageObjectKey: data.storageObjectKey, storageProvider: data.storageProvider,
      downloadUrl: data.downloadUrl, changelog: data.changelog || '', minSdk: Number(data.minSdk || 0),
      targetSdk: Number(data.targetSdk || 0), fileSize: Number(data.fileSize || 0),
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      architectures: Array.isArray(data.architectures) ? data.architectures : [],
      signingCertificate: data.signingCertificate, moderationStatus: data.moderationStatus,
      downloadAllowed: data.downloadAllowed, securityRevoked: data.securityRevoked, ...nowFields(),
    }));
    return (await this.findById(id))!;
  }

  static async update(id: string, updates: Partial<VersionEntity>): Promise<VersionEntity | null> {
    const ref = await this.findRefById(id);
    if (!ref || !(await ref.get()).exists) return null;
    const safe = { ...updates } as Record<string, any>;
    delete safe.id; delete safe.createdAt; delete safe.appId;
    await ref.update(updateFields(safe));
    return this.findById(id);
  }

  static async publish(id: string): Promise<VersionEntity | null> {
    return this.update(id, { status: 'PUBLISHED', downloadAllowed: true, securityRevoked: false });
  }

  static async archive(id: string): Promise<VersionEntity | null> {
    return this.update(id, { status: 'ARCHIVED', archivedAt: FieldValue.serverTimestamp() as any, downloadAllowed: false });
  }

  static async revoke(id: string, reason?: string): Promise<VersionEntity | null> {
    return this.update(id, { status: 'REVOKED', downloadAllowed: false, securityRevoked: true, revokedAt: FieldValue.serverTimestamp() as any, archiveReason: reason || 'Security or policy violation revocation' });
  }

  static async listAll(): Promise<VersionEntity[]> {
    const snap = await firestore.collectionGroup(COLLECTIONS.versions).get();
    return snap.docs.map(doc => withId<VersionEntity>(doc.id, doc.data())!).filter(Boolean);
  }

  static async findBySha256(sha256: string): Promise<VersionEntity | null> {
    const normalized = sha256.toUpperCase();
    const snap = await firestore.collectionGroup(COLLECTIONS.versions).where('sha256', '==', normalized).limit(1).get();
    return snap.empty ? null : withId<VersionEntity>(snap.docs[0].id, snap.docs[0].data());
  }
}

export class CategoryRepository {
  static async findActive(): Promise<CategoryEntity[]> {
    const list = await queryAll<CategoryEntity>(COLLECTIONS.categories, [['status', '==', 'ACTIVE']]);
    return list.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }
  static async findBySlug(slug: string): Promise<CategoryEntity | null> {
    const snap = await firestore.collection(COLLECTIONS.categories).where('slug', '==', slug).limit(1).get();
    return snap.empty ? null : withId<CategoryEntity>(snap.docs[0].id, snap.docs[0].data());
  }
  static async findById(id: string): Promise<CategoryEntity | null> { return getById<CategoryEntity>(COLLECTIONS.categories, id); }
  static async findAll(): Promise<CategoryEntity[]> { const list = await listAll<CategoryEntity>(COLLECTIONS.categories); return list.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)); }
  static async create(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    if (!data.name || !data.slug) throw new Error('name and slug are required');
    const duplicate = await firestore.collection(COLLECTIONS.categories).where('slug', '==', data.slug).limit(1).get();
    if (!duplicate.empty) throw new Error('CATEGORY_ALREADY_EXISTS');
    const id = newId('cat');
    await firestore.collection(COLLECTIONS.categories).doc(id).create(cleanUndefined({ name: data.name, slug: data.slug, status: data.status || 'ACTIVE', description: data.description || '', sortOrder: Number(data.sortOrder || 0), ...nowFields() }));
    return (await getById<CategoryEntity>(COLLECTIONS.categories, id))!;
  }
  static async update(id: string, updates: Partial<CategoryEntity>): Promise<CategoryEntity | null> { const ref = firestore.collection(COLLECTIONS.categories).doc(id); if (!(await ref.get()).exists) return null; await ref.update(updateFields({ ...updates, id: undefined, createdAt: undefined })); return getById<CategoryEntity>(COLLECTIONS.categories, id); }
  static async archive(id: string): Promise<CategoryEntity | null> { return this.update(id, { status: 'ARCHIVED' }); }
  static async restore(id: string): Promise<CategoryEntity | null> { return this.update(id, { status: 'ACTIVE' }); }
}

export class CollectionRepository {
  static async findPublished(): Promise<CollectionEntity[]> { const list = await listAll<CollectionEntity>(COLLECTIONS.collections); return list.filter(c => c.status === 'PUBLISHED' && c.visibility === 'PUBLIC').sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)); }
  static async findBySlug(slug: string): Promise<CollectionEntity | null> { const snap = await firestore.collection(COLLECTIONS.collections).where('slug','==',slug).limit(1).get(); const c=snap.empty?null:withId<CollectionEntity>(snap.docs[0].id,snap.docs[0].data()); return c?.status==='PUBLISHED'?c:null; }
  static async findById(id: string): Promise<CollectionEntity | null> { return getById<CollectionEntity>(COLLECTIONS.collections,id); }
  static async findAll(): Promise<CollectionEntity[]> { return listAll<CollectionEntity>(COLLECTIONS.collections); }
  static async create(data: Partial<CollectionEntity>): Promise<CollectionEntity> { if(!data.title||!data.slug) throw new Error('title and slug are required'); const id=newId('col'); await firestore.collection(COLLECTIONS.collections).doc(id).create(cleanUndefined({...data,title:data.title,slug:data.slug,description:data.description||'',status:data.status||'DRAFT',visibility:data.visibility||'PUBLIC',bannerUrl:data.bannerUrl,appIds:Array.isArray(data.appIds)?data.appIds:[],sortOrder:Number(data.sortOrder||0),...nowFields()})); return (await getById<CollectionEntity>(COLLECTIONS.collections,id))!; }
  static async update(id:string,updates:Partial<CollectionEntity>):Promise<CollectionEntity|null>{const ref=firestore.collection(COLLECTIONS.collections).doc(id);if(!(await ref.get()).exists)return null;await ref.update(updateFields({...updates,id:undefined,createdAt:undefined}));return getById<CollectionEntity>(COLLECTIONS.collections,id);}
  static async publish(id:string){return this.update(id,{status:'PUBLISHED'});}
  static async archive(id:string){return this.update(id,{status:'ARCHIVED'});}
  static async addApp(id:string,appId:string){await firestore.collection(COLLECTIONS.collections).doc(id).update({appIds:FieldValue.arrayUnion(appId),updatedAt:FieldValue.serverTimestamp()});return getById<CollectionEntity>(COLLECTIONS.collections,id);}
  static async removeApp(id:string,appId:string){await firestore.collection(COLLECTIONS.collections).doc(id).update({appIds:FieldValue.arrayRemove(appId),updatedAt:FieldValue.serverTimestamp()});return getById<CollectionEntity>(COLLECTIONS.collections,id);}
  static async reorderApps(id:string,orderedAppIds:string[]){await firestore.collection(COLLECTIONS.collections).doc(id).update({appIds:orderedAppIds,updatedAt:FieldValue.serverTimestamp()});return getById<CollectionEntity>(COLLECTIONS.collections,id);}
}

export class ModerationRepository {
  static async list(filters: {status?:string;priority?:string} = {}): Promise<ModerationEntity[]> { let list=await listAll<ModerationEntity>(COLLECTIONS.moderation); if(filters.status)list=list.filter(x=>x.status===filters.status); if(filters.priority)list=list.filter(x=>x.priority===filters.priority); return list.sort((a,b)=>Date.parse(b.createdAt||'')-Date.parse(a.createdAt||'')); }
  static async findById(id:string){return getById<ModerationEntity>(COLLECTIONS.moderation,id);}
  static async update(id:string,updates:Partial<ModerationEntity>){const ref=firestore.collection(COLLECTIONS.moderation).doc(id);if(!(await ref.get()).exists)return null;await ref.update(updateFields(updates));return getById<ModerationEntity>(COLLECTIONS.moderation,id);}
}

export class SecurityScanRepository {
  static async list():Promise<SecurityScanEntity[]>{return listAll<SecurityScanEntity>(COLLECTIONS.securityScans);}
  static async findByVersionId(versionId:string):Promise<SecurityScanEntity|null>{const snap=await firestore.collection(COLLECTIONS.securityScans).where('versionId','==',versionId).limit(1).get();return snap.empty?null:withId<SecurityScanEntity>(snap.docs[0].id,snap.docs[0].data());}
  static async upsert(versionId:string,data:Partial<SecurityScanEntity>):Promise<SecurityScanEntity>{const existing=await this.findByVersionId(versionId);const ref=existing?firestore.collection(COLLECTIONS.securityScans).doc(existing.id!):firestore.collection(COLLECTIONS.securityScans).doc(newId('scan'));if(existing)await ref.update(updateFields(data));else await ref.create(cleanUndefined({versionId,...data,...nowFields()}));return (await getById<SecurityScanEntity>(COLLECTIONS.securityScans,ref.id))!;}
}

export class AuditLogRepository {
  static async create(data:Record<string,any>){const id=newId('audit');await firestore.collection(COLLECTIONS.auditLogs).doc(id).create(cleanUndefined({...data,id,...nowFields()}));return getById<any>(COLLECTIONS.auditLogs,id);}
  static async list(page=1,pageSize=50){const all=await listAll<any>(COLLECTIONS.auditLogs);all.sort((a,b)=>Date.parse(b.createdAt||'')-Date.parse(a.createdAt||''));const {page:p,pageSize:s}=normalizePage(page,pageSize);return {data:all.slice((p-1)*s,p*s),total:all.length,page:p,pageSize:s};}
  static async findById(id:string){return getById<any>(COLLECTIONS.auditLogs,id);}
}

export class UserRepository {
  static async findAll():Promise<UserEntity[]>{return listAll<UserEntity>(COLLECTIONS.users);}
  static async findById(id:string){return getById<UserEntity>(COLLECTIONS.users,id);}
  static async findByEmail(email:string){const normalized=email.toLowerCase().trim();const snap=await firestore.collection(COLLECTIONS.users).where('email','==',normalized).limit(1).get();return snap.empty?null:withId<UserEntity>(snap.docs[0].id,snap.docs[0].data());}
  static async create(data:Partial<UserEntity>):Promise<UserEntity>{if(!data.email)throw new Error('email is required');const id=data.id||newId('usr');await firestore.collection(COLLECTIONS.users).doc(id).create(cleanUndefined({...data,id,email:data.email.toLowerCase().trim(),...nowFields()}));return (await getById<UserEntity>(COLLECTIONS.users,id))!;}
  static async update(id:string,updates:Partial<UserEntity>){const ref=firestore.collection(COLLECTIONS.users).doc(id);if(!(await ref.get()).exists)return null;await ref.update(updateFields(updates));return getById<UserEntity>(COLLECTIONS.users,id);}
}

export class SettingsRepository {
  static async get(settingId='global'):Promise<Record<string,any>>{const value=await getById<any>(COLLECTIONS.settings,settingId);return value||{};}
  static async set(settingId:string,data:Record<string,any>){const ref=firestore.collection(COLLECTIONS.settings).doc(settingId);await ref.set(cleanUndefined({...data,updatedAt:FieldValue.serverTimestamp()}),{merge:true});return this.get(settingId);}
}

export class UploadRepository {
  static async create(data:Omit<UploadEntity,'createdAt'|'updatedAt'>):Promise<UploadEntity>{const ref=firestore.collection(COLLECTIONS.uploads).doc(data.uploadId);await ref.create(cleanUndefined({...data,...nowFields()}));return (await getById<UploadEntity>(COLLECTIONS.uploads,ref.id))!;}
  static async findById(uploadId:string){return getById<UploadEntity>(COLLECTIONS.uploads,uploadId);}
  static async update(uploadId:string,updates:Partial<UploadEntity>){const ref=firestore.collection(COLLECTIONS.uploads).doc(uploadId);if(!(await ref.get()).exists)return null;await ref.update(updateFields(updates));return getById<UploadEntity>(COLLECTIONS.uploads,uploadId);}
  static async listAll(){return listAll<UploadEntity>(COLLECTIONS.uploads);}
}

export class JobRepository {
  static async findById(jobId:string){return getById<JobEntity>(COLLECTIONS.jobs,jobId);}
  static async findActive(type?:string,uploadId?:string){let list=await listAll<JobEntity>(COLLECTIONS.jobs);list=list.filter(j=>j.status==='QUEUED'||j.status==='PROCESSING');if(type)list=list.filter(j=>j.type===type);if(uploadId)list=list.filter(j=>j.uploadId===uploadId);return list;}
  static async create(data:JobEntity){const ref=firestore.collection(COLLECTIONS.jobs).doc(data.jobId);await ref.create(cleanUndefined({...data,...nowFields()}));return (await getById<JobEntity>(COLLECTIONS.jobs,ref.id))!;}
  static async update(jobId:string,updates:Partial<JobEntity>){const ref=firestore.collection(COLLECTIONS.jobs).doc(jobId);if(!(await ref.get()).exists)return null;await ref.update(updateFields(updates));return getById<JobEntity>(COLLECTIONS.jobs,jobId);}
  static async listAll(){return listAll<JobEntity>(COLLECTIONS.jobs);}
}

export class DeadLetterJobRepository {
  static async create(data:Record<string,any>){const id=data.jobId||newId('dlq');await firestore.collection(COLLECTIONS.deadLetterJobs).doc(id).create(cleanUndefined({...data,jobId:id,...nowFields()}));return getById<any>(COLLECTIONS.deadLetterJobs,id);}
  static async list(){return listAll<any>(COLLECTIONS.deadLetterJobs);}
  static async findByJobId(jobId:string){const direct=await getById<any>(COLLECTIONS.deadLetterJobs,jobId);if(direct)return direct;const snap=await firestore.collection(COLLECTIONS.deadLetterJobs).where('jobId','==',jobId).limit(1).get();return snap.empty?null:withId<any>(snap.docs[0].id,snap.docs[0].data());}
  static async update(jobId:string,updates:Record<string,any>){const ref=firestore.collection(COLLECTIONS.deadLetterJobs).doc(jobId);if(!(await ref.get()).exists)return null;await ref.update(updateFields(updates));return getById<any>(COLLECTIONS.deadLetterJobs,jobId);}
  static async deleteByJobId(jobId:string){await firestore.collection(COLLECTIONS.deadLetterJobs).doc(jobId).delete();}
}

// Explicitly exported so callers can access the cache/queues backed by Firestore
export const appsDb: AppEntity[] = [];
export const versionsDb: VersionEntity[] = [];
export const jobsDb: JobEntity[] = [];
export const uploadsDb: UploadEntity[] = [];
export const deadLetterJobsDb: any[] = [];
export const moderationDb: ModerationEntity[] = [];
export const securityScansDb: SecurityScanEntity[] = [];
export const auditLogsDb: any[] = [];
export const usersDb: UserEntity[] = [];
export const systemSettingsDb: Record<string, any> = {};

export async function syncInMemoryDbs() {
  try {
    const apps = await AppRepository.listAll();
    appsDb.length = 0;
    appsDb.push(...apps);

    const versions = await VersionRepository.listAll();
    versionsDb.length = 0;
    versionsDb.push(...versions);

    const jobs = await JobRepository.listAll();
    jobsDb.length = 0;
    jobsDb.push(...jobs);

    const uploads = await UploadRepository.listAll();
    uploadsDb.length = 0;
    uploadsDb.push(...uploads);

    const dls = await DeadLetterJobRepository.list();
    deadLetterJobsDb.length = 0;
    deadLetterJobsDb.push(...dls);

    const moderations = await ModerationRepository.list();
    moderationDb.length = 0;
    moderationDb.push(...moderations);

    const scans = await SecurityScanRepository.list();
    securityScansDb.length = 0;
    securityScansDb.push(...scans);

    const audits = await AuditLogRepository.list(1, 1000);
    auditLogsDb.length = 0;
    auditLogsDb.push(...audits.data);

    const users = await UserRepository.findAll();
    usersDb.length = 0;
    usersDb.push(...users);

    const settings = await SettingsRepository.get('global');
    for (const key of Object.keys(systemSettingsDb)) {
      delete systemSettingsDb[key];
    }
    Object.assign(systemSettingsDb, settings);

    console.log(`[Database Sync] Synced ${appsDb.length} apps, ${versionsDb.length} versions, ${jobsDb.length} jobs, ${uploadsDb.length} uploads, ${usersDb.length} users from Firestore.`);
  } catch (err) {
    console.error("Failed to sync in-memory DBs from Firestore:", err);
  }
}

export const FirestoreCollections = COLLECTIONS;

export interface SecurityEventEntity extends SecurityEventRepositoryInput {
  id: string;
  createdAt: string;
}
export interface SecurityEventRepositoryInput {
  type: string;
  severity: string;
  actorId?: string;
  anonymousId?: string;
  ipHash?: string;
  userAgentHash?: string;
  requestId: string;
  endpoint?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
export interface SecurityIncidentEntity {
  id: string;
  type: string;
  severity: string;
  entityType?: string;
  entityId?: string;
  description: string;
  evidence?: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}
export interface AbuseScoreEntity {
  id: string;
  entityType: string;
  entityId: string;
  score: number;
  level: string;
  reasons: string[];
  updatedAt: string;
}
export interface RateLimitEntity {
  id: string;
  count: number;
  resetAt: string;
  updatedAt: string;
}
export interface IdempotencyEntity {
  id: string;
  expiresAt: string;
  createdAt: string;
}

export class SecurityEventRepository {
  static async create(data: SecurityEventRepositoryInput & { id?: string }) {
    const id = data.id || newId('sec_evt');
    const ref = firestore.collection('securityEvents').doc(id);
    const createdAt = FieldValue.serverTimestamp();
    await ref.create(cleanUndefined({ ...data, id, createdAt }));
    return getById<SecurityEventEntity>('securityEvents', id);
  }

  static async list(options: { limit?: number; type?: string; severity?: string } = {}) {
    let q: Query = firestore.collection('securityEvents').orderBy('createdAt', 'desc');
    if (options.type) q = q.where('type', '==', options.type);
    if (options.severity) q = q.where('severity', '==', options.severity);
    q = q.limit(Math.min(Math.max(options.limit || 50, 1), 500));
    const snap = await q.get();
    return snap.docs.map(d => withId<SecurityEventEntity>(d.id, d.data())!).filter(Boolean);
  }

  static async count(options: { type?: string; since?: Date } = {}) {
    let q: Query = firestore.collection('securityEvents');
    if (options.type) q = q.where('type', '==', options.type);
    if (options.since) q = q.where('createdAt', '>=', Timestamp.fromDate(options.since));
    const snap = await q.count().get();
    return snap.data().count;
  }
}

export class SecurityIncidentRepository {
  static async create(data: Omit<SecurityIncidentEntity, 'createdAt' | 'updatedAt'>) {
    const ref = firestore.collection('securityIncidents').doc(data.id);
    await ref.create(cleanUndefined({ ...data, ...nowFields() }));
    return getById<SecurityIncidentEntity>('securityIncidents', data.id);
  }

  static async findById(id: string) {
    return getById<SecurityIncidentEntity>('securityIncidents', id);
  }

  static async list(limit = 100) {
    const snap = await firestore.collection('securityIncidents').orderBy('createdAt', 'desc').limit(Math.min(Math.max(limit, 1), 500)).get();
    return snap.docs.map(d => withId<SecurityIncidentEntity>(d.id, d.data())!).filter(Boolean);
  }

  static async update(id: string, updates: Partial<SecurityIncidentEntity>) {
    const ref = firestore.collection('securityIncidents').doc(id);
    if (!(await ref.get()).exists) return null;
    await ref.update(updateFields(updates));
    return getById<SecurityIncidentEntity>('securityIncidents', id);
  }
}

export class AbuseScoreRepository {
  static async get(entityType: string, entityId: string) {
    return getById<AbuseScoreEntity>('abuseScores', `${entityType}:${entityId}`);
  }

  static async upsert(data: Omit<AbuseScoreEntity, 'updatedAt'>) {
    const ref = firestore.collection('abuseScores').doc(data.id);
    await ref.set(cleanUndefined({ ...data, updatedAt: FieldValue.serverTimestamp() }), { merge: true });
    return getById<AbuseScoreEntity>('abuseScores', data.id);
  }

  static async list(limit = 100) {
    const snap = await firestore.collection('abuseScores').orderBy('updatedAt', 'desc').limit(Math.min(Math.max(limit, 1), 500)).get();
    return snap.docs.map(d => withId<AbuseScoreEntity>(d.id, d.data())!).filter(Boolean);
  }

  static async reset(entityType: string, entityId: string) {
    const ref = firestore.collection('abuseScores').doc(`${entityType}:${entityId}`);
    if (!(await ref.get()).exists) return null;
    await ref.update({
      score: 0,
      level: 'NORMAL',
      reasons: [],
      updatedAt: FieldValue.serverTimestamp(),
    });
    return getById<AbuseScoreEntity>('abuseScores', ref.id);
  }
}

export class RateLimitRepository {
  static async consume(
    key: string,
    windowMs: number,
    max: number
  ): Promise<{ allowed: boolean; current: number; resetAt: number }> {
    const ref = firestore.collection('rateLimits').doc(crypto.createHash('sha256').update(key).digest('hex'));
    const now = Date.now();
    const result = await firestore.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists ? normalize(snap.data()) as RateLimitEntity : null;
      if (!data || now >= new Date(data.resetAt).getTime()) {
        const resetAt = now + windowMs;
        tx.set(ref, {
          count: 1,
          resetAt: Timestamp.fromMillis(resetAt),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { allowed: 1 <= max, current: 1, resetAt };
      }

      const nextCount = Number(data.count || 0) + 1;
      tx.update(ref, {
        count: nextCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {
        allowed: nextCount <= max,
        current: nextCount,
        resetAt: new Date(data.resetAt).getTime(),
      };
    });
    return result;
  }
}

export class IdempotencyRepository {
  static async claim(id: string, ttlMs = 24 * 60 * 60 * 1000): Promise<boolean> {
    const ref = firestore.collection('idempotencyKeys').doc(crypto.createHash('sha256').update(id).digest('hex'));
    const now = Date.now();
    return firestore.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        const expiresAt = snap.data()?.expiresAt;
        if (expiresAt && normalize(expiresAt) && new Date(normalize(expiresAt)).getTime() > now) return false;
      }
      tx.set(ref, {
        expiresAt: Timestamp.fromMillis(now + ttlMs),
        createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
  }
}

export interface ApiCacheEntity {
  key: string;
  body: unknown;
  headers?: Record<string, string>;
  expiresAt: string;
  createdAt: string;
}

export class ApiCacheRepository {
  static async get(key: string) {
    const id = crypto.createHash('sha256').update(key).digest('hex');
    const value = await getById<ApiCacheEntity>('apiCache', id);
    if (!value) return null;
    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      await firestore.collection('apiCache').doc(id).delete().catch(() => undefined);
      return null;
    }
    return value;
  }

  static async set(key: string, body: unknown, ttlSeconds: number, headers: Record<string, string> = {}) {
    const id = crypto.createHash('sha256').update(key).digest('hex');
    await firestore.collection('apiCache').doc(id).set({
      key,
      body,
      headers,
      expiresAt: Timestamp.fromMillis(Date.now() + ttlSeconds * 1000),
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  static async invalidate(pattern?: string | RegExp) {
    const ref = firestore.collection('apiCache');
    const snap = await ref.limit(500).get();
    const batch = firestore.batch();
    let count = 0;
    for (const doc of snap.docs) {
      const key = String(doc.data().key || '');
      const matches = !pattern || (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key));
      if (matches) {
        batch.delete(doc.ref);
        count++;
      }
    }
    if (count) await batch.commit();
  }

  static async stats() {
    const snap = await firestore.collection('apiCache').count().get();
    return { size: snap.data().count, enabled: process.env.CACHE_ENABLED !== 'false' };
  }
}

export interface PerformanceMetricEntity {
  id: string;
  requestId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  category: string;
  cacheHit: boolean;
  createdAt: string;
}

export class PerformanceMetricRepository {
  static async create(data: Omit<PerformanceMetricEntity, 'createdAt'>) {
    const ref = firestore.collection('performanceMetrics').doc(data.id);
    await ref.create(cleanUndefined({ ...data, createdAt: FieldValue.serverTimestamp() }));
    return getById<PerformanceMetricEntity>('performanceMetrics', data.id);
  }

  static async list(limit = 1000) {
    const snap = await firestore.collection('performanceMetrics')
      .orderBy('createdAt', 'desc')
      .limit(Math.min(Math.max(limit, 1), 5000))
      .get();
    return snap.docs.map(d => withId<PerformanceMetricEntity>(d.id, d.data())!).filter(Boolean);
  }

  static async stats(limit = 1000) {
    const metrics = await this.list(limit);
    if (!metrics.length) return { totalRequests: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, errorRate: 0, cacheHitRatio: 0 };

    const durations = metrics.map(m => Number(m.durationMs || 0)).sort((a, b) => a - b);
    const percentile = (p: number) => durations[Math.min(durations.length - 1, Math.floor(durations.length * p))] || 0;
    const errors = metrics.filter(m => Number(m.statusCode) >= 400).length;
    const hits = metrics.filter(m => m.cacheHit).length;

    return {
      totalRequests: metrics.length,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99),
      errorRate: Number(((errors / metrics.length) * 100).toFixed(2)),
      cacheHitRatio: Number(((hits / metrics.length) * 100).toFixed(2)),
    };
  }
}

export interface DeveloperSubmissionEntity {
  id: string;
  developerId: string;
  developerEmail: string;
  appId?: string;
  appName: string;
  slug: string;
  packageName: string;
  category: string;
  categoryId?: string;
  shortDescription: string;
  description: string;
  downloadUrl: string;
  officialUrl: string;
  ownershipStatus: string;
  securityStatus: string;
  reviewStatus: string;
  status: string;
  versionName: string;
  versionCode: number;
  sha256: string;
  fileSize: number;
  whatsNew?: string;
  versionHistory?: Record<string, any>[];
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export class DeveloperSubmissionRepository {
  private static collection() {
    return firestore.collection('developerSubmissions');
  }

  static async create(data: Omit<DeveloperSubmissionEntity, 'createdAt' | 'updatedAt'>) {
    const ref = this.collection().doc(data.id);
    await ref.create(cleanUndefined({ ...data, ...nowFields() }));
    return getById<DeveloperSubmissionEntity>('developerSubmissions', data.id);
  }

  static async findById(id: string) {
    return getById<DeveloperSubmissionEntity>('developerSubmissions', id);
  }

  static async listByDeveloper(developerId?: string, email?: string) {
    let snap;
    if (developerId) {
      snap = await this.collection().where('developerId', '==', developerId).get();
    } else {
      snap = await this.collection().where('developerEmail', '==', String(email || '').toLowerCase()).get();
    }
    return snap.docs.map(d => withId<DeveloperSubmissionEntity>(d.id, d.data())!).filter(Boolean)
      .sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));
  }

  static async listAll(limit = 500) {
    const snap = await this.collection().orderBy('updatedAt', 'desc').limit(limit).get();
    return snap.docs.map(d => withId<DeveloperSubmissionEntity>(d.id, d.data())!).filter(Boolean);
  }

  static async update(id: string, updates: Partial<DeveloperSubmissionEntity>) {
    const ref = this.collection().doc(id);
    if (!(await ref.get()).exists) return null;
    await ref.update(updateFields(updates));
    return getById<DeveloperSubmissionEntity>('developerSubmissions', id);
  }
}
