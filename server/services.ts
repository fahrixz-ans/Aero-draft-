// ---------------------------------------------------------------------------
// AERO DOMAIN SERVICES LAYER (STAGE 8.8 & 8.9)
// Orchestrates business rules, transactions, publish gates, events & DTOs
// ---------------------------------------------------------------------------

import {
  AppRepository,
  VersionRepository,
  CategoryRepository,
  CollectionRepository,
  moderationDb,
  securityScansDb,
  auditLogsDb,
  usersDb,
  systemSettingsDb,
  uploadsDb,
  deadLetterJobsDb,
  jobsDb,
  AppEntity,
  VersionEntity
} from './repositories';
import {
  toPublicAppDTO,
  toAdminAppDTO,
  toPublicVersionDTO,
  toAdminVersionDTO,
  toPublicCategoryDTO,
  toAdminCategoryDTO,
  toPublicCollectionDTO,
  PublicAppDTO
} from './dto';
import { emitAeroEvent, submitBackgroundJob } from './events';
import {
  generateR2UploadSession,
  verifyR2Object,
  promoteToPublishedR2Object,
  generateSignedDownloadUrl,
  getPublishedObjectKey
} from './cloudflareR2';
import { analyzeApkBuffer } from './apkAnalyzer';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// 1. Public App Service
// ---------------------------------------------------------------------------
export class PublicAppService {
  static async list(query: any) {
    const page = parseInt(query.page as string, 10) || 1;
    const pageSize = parseInt(query.pageSize as string, 10) || 20;
    const result = await AppRepository.findPublished({
      search: query.search || query.q,
      category: query.category,
      sort: query.sort,
      order: query.order,
      page,
      pageSize
    });

    const dtoList = result.data.map(toPublicAppDTO);
    return { data: dtoList, total: result.total, page, pageSize };
  }

  static async getBySlug(slug: string) {
    const app = await AppRepository.findBySlug(slug);
    if (!app) return null;

    // Asynchronous APP_VIEW event recording
    setImmediate(() => {
      emitAeroEvent('APP_VIEW', app.id, { slug });
    });

    return toPublicAppDTO(app);
  }

  static async getVersions(slug: string) {
    const app = await AppRepository.findBySlug(slug);
    if (!app) return null;

    const versions = await VersionRepository.findPublishedByAppId(app.id);
    return versions.map(toPublicVersionDTO);
  }

  static async getDownloadTarget(slug: string, reqContext?: { ip?: string; sessionId?: string; userId?: string }) {
    const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
    const sessionId = reqContext?.sessionId || 'guest_session';
    const userId = reqContext?.userId;

    // Emit download attempt event (Stage 9.5 / 9.7)
    emitAeroEvent('DOWNLOAD_ATTEMPT', '', { slug, requestId, sessionId, userId });

    const app = await AppRepository.findBySlug(slug);
    if (!app) {
      emitAeroEvent('DOWNLOAD_DENIED', '', { slug, reason: 'APP_NOT_FOUND', requestId });
      return { error: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' };
    }

    if (app.status && app.status !== 'PUBLISHED') {
      emitAeroEvent('DOWNLOAD_DENIED', app.id, { slug, reason: 'APP_NOT_PUBLISHED', requestId });
      return { error: 'APP_NOT_PUBLISHED', message: 'Aplikasi belum dipublikasikan.' };
    }

    if (app.distributionType === 'OFFICIAL_WEBSITE' || (app.distributionType as string) === 'EXTERNAL_OFFICIAL_LINK') {
      return { error: 'DOWNLOAD_NOT_AVAILABLE', message: 'Aplikasi ini didistribusikan melalui situs web resmi.' };
    }

    const versions = await VersionRepository.findPublishedByAppId(app.id);
    const latestVersion = versions[0];
    if (!latestVersion) {
      emitAeroEvent('DOWNLOAD_DENIED', app.id, { slug, reason: 'VERSION_NOT_FOUND', requestId });
      return { error: 'VERSION_NOT_FOUND', message: 'Tidak ada versi rilis aktif yang dapat diunduh.' };
    }

    if (latestVersion.status && latestVersion.status !== 'PUBLISHED' && latestVersion.status !== 'VERIFIED') {
      emitAeroEvent('DOWNLOAD_DENIED', app.id, { slug, versionId: latestVersion.id, reason: 'VERSION_NOT_PUBLISHED', requestId });
      return { error: 'VERSION_NOT_PUBLISHED', message: 'Versi aplikasi belum dipublikasikan.' };
    }

    if (latestVersion.status === 'REVOKED' || latestVersion.downloadAllowed === false || latestVersion.securityRevoked === true) {
      emitAeroEvent('DOWNLOAD_DENIED', app.id, { slug, versionId: latestVersion.id, reason: 'VERSION_REVOKED', requestId });
      return { error: 'VERSION_REVOKED', message: 'Versi aplikasi telah dicabut (revoked) karena masalah keamanan atau kebijakan.' };
    }

    // Security Gate: Check security status
    const securityStatus = String(latestVersion.securityStatus || '');
    if (securityStatus === 'QUARANTINED' || securityStatus === 'MALICIOUS') {
      emitAeroEvent('DOWNLOAD_DENIED', app.id, { slug, versionId: latestVersion.id, reason: 'APK_QUARANTINED', requestId });
      return { error: 'APK_QUARANTINED', message: 'Berkas APK masuk dalam karantina keamanan dan diblokir.' };
    }

    const isClean = securityStatus === 'VERIFIED' || securityStatus === 'passed' || securityStatus === 'CLEAN';
    if (!isClean) {
      emitAeroEvent('DOWNLOAD_DENIED', app.id, { slug, versionId: latestVersion.id, reason: 'SECURITY_CHECK_REQUIRED', requestId });
      return { error: 'SECURITY_CHECK_REQUIRED', message: 'Berkas APK belum lolos verifikasi keamanan AeroShield.' };
    }

    // R2 Object Existence Verification
    const objectKey = (latestVersion as any).storageObjectKey || getPublishedObjectKey(app.id, latestVersion.id, `${app.slug}.apk`);
    const r2Meta = await verifyR2Object(objectKey);
    if (!r2Meta) {
      emitAeroEvent('DOWNLOAD_DENIED', app.id, { slug, versionId: latestVersion.id, reason: 'APK_UNAVAILABLE', requestId });
      return { error: 'APK_UNAVAILABLE', message: 'Berkas APK fisik tidak ditemukan di Cloudflare R2 storage.' };
    }

    // Authorized successfully
    emitAeroEvent('DOWNLOAD_AUTHORIZED', app.id, { versionId: latestVersion.id, requestId, sessionId, userId });

    // Increment download counter asynchronously
    setImmediate(() => {
      AppRepository.incrementDownloads(app.id);
      emitAeroEvent('DOWNLOAD_RECORDED', app.id, { versionId: latestVersion.id });
      emitAeroEvent('DOWNLOAD_STARTED', app.id, { versionId: latestVersion.id, requestId });
    });

    const signedUrl = generateSignedDownloadUrl(app.slug, latestVersion.id);

    return {
      success: true,
      data: {
        app: toPublicAppDTO(app),
        version: toPublicVersionDTO(latestVersion),
        downloadUrl: signedUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        sha256: latestVersion.sha256,
        fileName: `${app.slug}_${latestVersion.versionName}.apk`,
        fileSize: latestVersion.fileSize || r2Meta.size
      }
    };
  }

  static async getVersionDownloadTarget(slug: string, versionId: string, reqContext?: { ip?: string; sessionId?: string; userId?: string }) {
    const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
    const sessionId = reqContext?.sessionId || 'guest_session';
    const userId = reqContext?.userId;

    emitAeroEvent('version_download_attempt', '', { slug, versionId, requestId, sessionId, userId });

    const app = await AppRepository.findBySlug(slug);
    if (!app) {
      emitAeroEvent('version_download_denied', '', { slug, versionId, reason: 'APP_NOT_FOUND', requestId });
      return { error: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' };
    }

    if (app.status && app.status !== 'PUBLISHED') {
      emitAeroEvent('version_download_denied', app.id, { slug, versionId, reason: 'APP_NOT_PUBLISHED', requestId });
      return { error: 'APP_NOT_PUBLISHED', message: 'Aplikasi belum dipublikasikan.' };
    }

    const version = await VersionRepository.findById(versionId);
    if (!version || version.appId !== app.id) {
      emitAeroEvent('version_download_denied', app.id, { slug, versionId, reason: 'VERSION_NOT_FOUND', requestId });
      return { error: 'VERSION_NOT_FOUND', message: 'Versi aplikasi tidak ditemukan.' };
    }

    if (version.status === 'REVOKED' || (version as any).securityRevoked || (version as any).downloadAllowed === false) {
      emitAeroEvent('version_download_denied', app.id, { slug, versionId, reason: 'VERSION_REVOKED', requestId });
      return { error: 'VERSION_REVOKED', message: 'Versi aplikasi ini telah dicabut (revoked) karena masalah keamanan dan tidak dapat diunduh.' };
    }

    const securityStatus = String(version.securityStatus || '');
    if (securityStatus === 'QUARANTINED' || securityStatus === 'MALICIOUS') {
      emitAeroEvent('version_download_denied', app.id, { slug, versionId, reason: 'APK_QUARANTINED', requestId });
      return { error: 'APK_QUARANTINED', message: 'Berkas APK masuk dalam karantina keamanan dan diblokir.' };
    }

    const objectKey = (version as any).storageObjectKey || (version as any).r2ObjectKey || getPublishedObjectKey(app.id, version.id, `${app.slug}.apk`);
    const r2Meta = await verifyR2Object(objectKey);
    if (!r2Meta) {
      emitAeroEvent('version_download_denied', app.id, { slug, versionId, reason: 'APK_UNAVAILABLE', requestId });
      return { error: 'APK_UNAVAILABLE', message: 'Berkas APK fisik tidak ditemukan di Cloudflare R2 storage.' };
    }

    emitAeroEvent('version_download_authorized', app.id, { versionId, requestId, sessionId, userId });

    setImmediate(() => {
      AppRepository.incrementDownloads(app.id);
      emitAeroEvent('DOWNLOAD_RECORDED', app.id, { versionId });
    });

    const signedUrl = generateSignedDownloadUrl(app.slug, version.id);

    return {
      success: true,
      data: {
        app: toPublicAppDTO(app),
        version: toPublicVersionDTO(version),
        downloadUrl: signedUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        sha256: version.sha256,
        fileName: `${app.slug}_${version.versionName}.apk`,
        fileSize: version.fileSize || r2Meta.size
      }
    };
  }

  static async getOfficialUrl(slug: string) {
    const app = await AppRepository.findBySlug(slug);
    if (!app) return { error: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' };

    if (app.distributionType !== 'OFFICIAL_WEBSITE' || !app.officialWebsiteUrl) {
      return { error: 'INVALID_REQUEST', message: 'Aplikasi bukan bertipe distribusi situs resmi.' };
    }

    return { success: true, url: app.officialWebsiteUrl };
  }
}

// ---------------------------------------------------------------------------
// 2. Admin App Service
// ---------------------------------------------------------------------------
export class AdminAppService {
  static async list(query: any) {
    const page = parseInt(query.page as string, 10) || 1;
    const pageSize = parseInt(query.pageSize as string, 10) || 50;
    const result = await AppRepository.findAllAdmin({
      search: query.search,
      status: query.status,
      category: query.category,
      distributionType: query.distributionType,
      page,
      pageSize
    });

    return {
      data: result.data.map(toAdminAppDTO),
      total: result.total,
      page,
      pageSize
    };
  }

  static async getById(id: string) {
    const app = await AppRepository.findById(id);
    if (!app) return null;
    return toAdminAppDTO(app);
  }

  static async create(body: any, actor: any) {
    // Validate category
    const cat = await CategoryRepository.findById(body.categoryId);
    if (!cat || cat.status !== 'ACTIVE') {
      return { error: 'DEPENDENCY_CONFLICT', message: 'Kategori tidak valid atau sedang di-archive.' };
    }

    // Validate distribution
    if (body.distributionType === 'OFFICIAL_WEBSITE') {
      if (!body.officialWebsiteUrl && !body.officialUrl) {
        return { error: 'VALIDATION_ERROR', message: 'Aplikasi situs resmi wajib menyertakan officialWebsiteUrl.' };
      }
      const testUrl = body.officialWebsiteUrl || body.officialUrl;
      if (!/^https?:\/\//i.test(testUrl) || /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(testUrl)) {
        return { error: 'OFFICIAL_URL_INVALID', message: 'URL situs resmi tidak valid atau mengarah ke target lokal.' };
      }
    } else {
      if (!body.packageName) {
        return { error: 'VALIDATION_ERROR', message: 'Aplikasi APK wajib menyertakan packageName.' };
      }
    }

    const created = await AppRepository.create({
      ...body,
      category: cat.name,
      officialWebsiteUrl: body.officialWebsiteUrl || body.officialUrl,
      createdBy: actor.email,
      updatedBy: actor.email
    });

    emitAeroEvent('APP_CREATED', created.id, { name: created.name });
    auditLogsDb.push({
      id: `audit_${Date.now()}`,
      adminEmail: actor.email,
      action: 'CREATE_APP',
      entityType: 'application',
      entityId: created.id,
      createdAt: new Date().toISOString()
    });

    return { success: true, data: toAdminAppDTO(created) };
  }

  static async update(id: string, body: any, actor: any) {
    const app = await AppRepository.findById(id);
    if (!app) return { error: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' };

    if (body.categoryId) {
      const cat = await CategoryRepository.findById(body.categoryId);
      if (!cat || cat.status !== 'ACTIVE') {
        return { error: 'DEPENDENCY_CONFLICT', message: 'Kategori baru tidak valid atau tidak aktif.' };
      }
      body.category = cat.name;
    }

    const updated = await AppRepository.update(id, {
      ...body,
      updatedBy: actor.email
    });

    emitAeroEvent('APP_UPDATED', id, { updatedFields: Object.keys(body) });
    return { success: true, data: toAdminAppDTO(updated!) };
  }

  static async publish(id: string, actor: any) {
    const app = await AppRepository.findById(id);
    if (!app) return { error: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' };

    // Strict Publish Gate
    if (app.distributionType === 'APK') {
      const versions = await VersionRepository.findAllByAppId(app.id);
      const activeVersion = versions.find(v => v.status === 'PUBLISHED' || v.status === 'APPROVED' || v.status === 'VERIFIED');
      if (!activeVersion) {
        return { error: 'PUBLISH_GATE_FAILED', message: 'Aplikasi APK harus memiliki setidaknya satu versi terverifikasi sebelum dipublish.' };
      }
      if (activeVersion.securityStatus !== 'VERIFIED' && activeVersion.securityStatus !== 'passed') {
        return { error: 'SECURITY_CHECK_FAILED', message: 'Versi aplikasi belum lolos verifikasi keamanan.' };
      }
    } else if (app.distributionType === 'OFFICIAL_WEBSITE') {
      if (!app.officialWebsiteUrl) {
        return { error: 'PUBLISH_GATE_FAILED', message: 'Aplikasi situs resmi wajib memiliki tautan resmi yang valid.' };
      }
    }

    const published = await AppRepository.publish(id);
    emitAeroEvent('APP_PUBLISHED', id);
    auditLogsDb.push({
      id: `audit_${Date.now()}`,
      adminEmail: actor.email,
      action: 'PUBLISH_APP',
      entityType: 'application',
      entityId: id,
      createdAt: new Date().toISOString()
    });

    return { success: true, data: toAdminAppDTO(published!) };
  }

  static async archive(id: string, actor: any) {
    const app = await AppRepository.findById(id);
    if (!app) return { error: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' };

    const archived = await AppRepository.archive(id);
    emitAeroEvent('APP_ARCHIVED', id);
    return { success: true, data: toAdminAppDTO(archived!) };
  }

  static async restore(id: string, actor: any) {
    const app = await AppRepository.findById(id);
    if (!app) return { error: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' };

    const restored = await AppRepository.restore(id);
    return { success: true, data: toAdminAppDTO(restored!) };
  }
}

// ---------------------------------------------------------------------------
// 3. Version Service
// ---------------------------------------------------------------------------
export class VersionService {
  static async listByAppId(appId: string) {
    const versions = await VersionRepository.findAllByAppId(appId);
    return versions.map(toAdminVersionDTO);
  }

  static async create(appId: string, body: any, actor: any) {
    const app = await AppRepository.findById(appId);
    if (!app) return { error: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' };

    const existing = await VersionRepository.findAllByAppId(appId);
    const duplicate = existing.find(v => v.versionCode === Number(body.versionCode));
    if (duplicate) {
      return { error: 'VERSION_CONFLICT', message: `Versi dengan kode ${body.versionCode} sudah terdaftar pada aplikasi ini.` };
    }

    const newVer = await VersionRepository.create({
      ...body,
      appId,
      versionCode: Number(body.versionCode)
    });

    emitAeroEvent('VERSION_CREATED', newVer.id, { appId });
    return { success: true, data: toAdminVersionDTO(newVer) };
  }

  static async update(id: string, body: any, actor: any) {
    const ver = await VersionRepository.findById(id);
    if (!ver) return { error: 'VERSION_NOT_FOUND', message: 'Versi tidak ditemukan.' };

    // Published versions have immutable core fields
    if (ver.status === 'PUBLISHED') {
      delete body.versionCode;
      delete body.packageName;
      delete body.sha256;
      delete body.storageKey;
      delete body.r2ObjectKey;
    }

    const updated = await VersionRepository.update(id, body);
    return { success: true, data: toAdminVersionDTO(updated!) };
  }

  static async publish(id: string, actor: any) {
    const ver = await VersionRepository.findById(id);
    if (!ver) return { error: 'VERSION_NOT_FOUND', message: 'Versi tidak ditemukan.' };

    // Publish Gate for Version
    if (!ver.sha256) {
      return { error: 'PUBLISH_GATE_FAILED', message: 'Integritas SHA-256 berkas APK belum diverifikasi.' };
    }
    if (ver.securityStatus !== 'VERIFIED' && ver.securityStatus !== 'passed') {
      return { error: 'SECURITY_CHECK_FAILED', message: 'Status keamanan berkas APK belum bersih/lolos.' };
    }

    // Auto-archive previous published version if exists
    const app = await AppRepository.findById(ver.appId);
    if (app && app.latestVersionId && app.latestVersionId !== id) {
      const oldVer = await VersionRepository.findById(app.latestVersionId);
      if (oldVer && oldVer.status === 'PUBLISHED') {
        await VersionRepository.archive(oldVer.id);
        emitAeroEvent('VERSION_ARCHIVED', oldVer.id, { appId: ver.appId, reason: 'Superseded by newer version' });
      }
    }

    const published = await VersionRepository.publish(id);
    await AppRepository.update(ver.appId, {
      latestVersionId: id,
      versionName: ver.versionName,
      versionCode: ver.versionCode,
      sha256: ver.sha256,
      size: `${Math.round((ver.fileSize || 50000000) / (1024 * 1024))} MB`
    });

    emitAeroEvent('VERSION_PUBLISHED', id, { appId: ver.appId });
    auditLogsDb.push({
      id: `audit_${Date.now()}`,
      actorId: actor?.email || 'admin',
      actorRole: actor?.role || 'ADMIN',
      action: 'PUBLISH_VERSION',
      appId: ver.appId,
      versionId: id,
      createdAt: new Date().toISOString()
    });

    return { success: true, data: toAdminVersionDTO(published!) };
  }

  static async archive(id: string, actor: any) {
    const ver = await VersionRepository.findById(id);
    if (!ver) return { error: 'VERSION_NOT_FOUND', message: 'Versi tidak ditemukan.' };

    const archived = await VersionRepository.archive(id);
    emitAeroEvent('VERSION_ARCHIVED', id, { appId: ver.appId });
    return { success: true, data: toAdminVersionDTO(archived!) };
  }

  static async revoke(id: string, reason: string, actor: any) {
    const ver = await VersionRepository.findById(id);
    if (!ver) return { error: 'VERSION_NOT_FOUND', message: 'Versi tidak ditemukan.' };

    const revoked = await VersionRepository.revoke(id, reason);
    
    // Check if this was the current published version and handle fallback
    const app = await AppRepository.findById(ver.appId);
    if (app && app.latestVersionId === id) {
      const remainingVersions = (await VersionRepository.findAllByAppId(ver.appId))
        .filter(v => v.id !== id && (v.status === 'PUBLISHED' || v.status === 'VERIFIED'));
      if (remainingVersions.length > 0) {
        const fallback = remainingVersions[0];
        await AppRepository.update(ver.appId, {
          latestVersionId: fallback.id,
          versionName: fallback.versionName,
          versionCode: fallback.versionCode,
          sha256: fallback.sha256
        });
      } else {
        await AppRepository.update(ver.appId, {
          latestVersionId: '',
          status: 'UNPUBLISHED'
        });
      }
    }

    emitAeroEvent('VERSION_REVOKED', id, { appId: ver.appId, reason });
    auditLogsDb.push({
      id: `audit_${Date.now()}`,
      actorId: actor?.email || 'admin',
      actorRole: actor?.role || 'ADMIN',
      action: 'REVOKE_VERSION',
      appId: ver.appId,
      versionId: id,
      reason,
      createdAt: new Date().toISOString()
    });

    return { success: true, data: toAdminVersionDTO(revoked!) };
  }

  static async compare(versionIdA: string, versionIdB: string) {
    const verA = await VersionRepository.findById(versionIdA);
    const verB = await VersionRepository.findById(versionIdB);
    if (!verA || !verB) return { error: 'VERSION_NOT_FOUND', message: 'Salah satu versi tidak ditemukan.' };

    const permsA = new Set(verA.permissions || []);
    const permsB = new Set(verB.permissions || []);

    const addedPermissions = [...permsB].filter(p => !permsA.has(p));
    const removedPermissions = [...permsA].filter(p => !permsB.has(p));
    const unchangedPermissions = [...permsB].filter(p => permsA.has(p));

    const sizeDiffBytes = (verB.fileSize || 0) - (verA.fileSize || 0);

    return {
      success: true,
      data: {
        versionA: toAdminVersionDTO(verA),
        versionB: toAdminVersionDTO(verB),
        diffs: {
          permissions: {
            added: addedPermissions,
            removed: removedPermissions,
            unchanged: unchangedPermissions
          },
          sizeDiffBytes,
          sizeDiffFormatted: `${sizeDiffBytes >= 0 ? '+' : ''}${Math.round(sizeDiffBytes / (1024 * 1024))} MB`,
          versionCodeDiff: (verB.versionCode || 0) - (verA.versionCode || 0)
        }
      }
    };
  }

  static async retryAnalysis(id: string, actor: any) {
    const ver = await VersionRepository.findById(id);
    if (!ver) return { error: 'VERSION_NOT_FOUND', message: 'Versi tidak ditemukan.' };

    const job = await submitBackgroundJob({
      type: 'APK_PROCESSING',
      versionId: id,
      appId: ver.appId
    });

    return { success: true, data: { jobId: job.jobId, status: 'QUEUED' } };
  }
}

// ---------------------------------------------------------------------------
// 4. Category Service
// ---------------------------------------------------------------------------
export class CategoryService {
  static async listPublic() {
    const cats = await CategoryRepository.findActive();
    const publishedApps = await AppRepository.findPublished({ pageSize: 1000 });

    return cats.map(c => {
      const count = publishedApps.data.filter(a => a.categoryId === c.id || a.category.toLowerCase() === c.name.toLowerCase()).length;
      return toPublicCategoryDTO(c, count);
    });
  }

  static async getBySlug(slug: string) {
    const cat = await CategoryRepository.findBySlug(slug);
    if (!cat || cat.status !== 'ACTIVE') return null;

    const publishedApps = await AppRepository.findPublished({ category: cat.slug, pageSize: 1000 });
    return toPublicCategoryDTO(cat, publishedApps.total);
  }

  static async getCategoryApps(slug: string, query: any) {
    const cat = await CategoryRepository.findBySlug(slug);
    if (!cat || cat.status !== 'ACTIVE') return null;

    return await PublicAppService.list({
      ...query,
      category: cat.slug
    });
  }

  static async listAdmin() {
    const cats = await CategoryRepository.findAll();
    return cats.map(c => toAdminCategoryDTO(c));
  }

  static async create(body: any) {
    const existing = await CategoryRepository.findBySlug(body.slug);
    if (existing) {
      return { error: 'CATEGORY_ALREADY_EXISTS', message: 'Kategori dengan slug tersebut sudah terdaftar.' };
    }
    const newCat = await CategoryRepository.create(body);
    emitAeroEvent('CATEGORY_UPDATED', newCat.id);
    return { success: true, data: toAdminCategoryDTO(newCat) };
  }

  static async update(id: string, body: any) {
    const cat = await CategoryRepository.findById(id);
    if (!cat) return { error: 'CATEGORY_NOT_FOUND', message: 'Kategori tidak ditemukan.' };

    const updated = await CategoryRepository.update(id, body);
    emitAeroEvent('CATEGORY_UPDATED', id);
    return { success: true, data: toAdminCategoryDTO(updated!) };
  }

  static async archive(id: string) {
    const cat = await CategoryRepository.findById(id);
    if (!cat) return { error: 'CATEGORY_NOT_FOUND', message: 'Kategori tidak ditemukan.' };

    const dependentApps = await AppRepository.findAllAdmin({ category: cat.id, pageSize: 100 });
    if (dependentApps.total > 0) {
      return {
        error: 'DEPENDENCY_CONFLICT',
        message: 'Kategori tidak dapat di-archive karena masih digunakan oleh aplikasi aktif.',
        dependentCount: dependentApps.total
      };
    }

    const archived = await CategoryRepository.archive(id);
    emitAeroEvent('CATEGORY_UPDATED', id);
    return { success: true, data: toAdminCategoryDTO(archived!) };
  }

  static async restore(id: string) {
    const cat = await CategoryRepository.findById(id);
    if (!cat) return { error: 'CATEGORY_NOT_FOUND', message: 'Kategori tidak ditemukan.' };

    const restored = await CategoryRepository.restore(id);
    emitAeroEvent('CATEGORY_UPDATED', id);
    return { success: true, data: toAdminCategoryDTO(restored!) };
  }
}

// ---------------------------------------------------------------------------
// 5. Collection Service
// ---------------------------------------------------------------------------
export class CollectionService {
  static async listPublic() {
    const collections = await CollectionRepository.findPublished();
    return collections.map(c => toPublicCollectionDTO(c, c.appIds.length));
  }

  static async getBySlug(slug: string, query: any) {
    const col = await CollectionRepository.findBySlug(slug);
    if (!col) return null;

    const apps: PublicAppDTO[] = [];
    for (const appId of col.appIds) {
      const app = await AppRepository.findById(appId);
      if (app && app.status === 'PUBLISHED') {
        apps.push(toPublicAppDTO(app));
      }
    }

    return {
      collection: toPublicCollectionDTO(col, apps.length),
      apps,
      pagination: {
        page: 1,
        pageSize: apps.length,
        total: apps.length,
        totalPages: 1
      }
    };
  }

  static async listAdmin() {
    const collections = await CollectionRepository.findAll();
    return collections;
  }

  static async create(body: any) {
    const newCol = await CollectionRepository.create(body);
    emitAeroEvent('COLLECTION_UPDATED', newCol.id);
    return { success: true, data: newCol };
  }

  static async update(id: string, body: any) {
    const col = await CollectionRepository.findById(id);
    if (!col) return { error: 'COLLECTION_NOT_FOUND', message: 'Koleksi tidak ditemukan.' };

    const updated = await CollectionRepository.update(id, body);
    emitAeroEvent('COLLECTION_UPDATED', id);
    return { success: true, data: updated };
  }

  static async publish(id: string) {
    const col = await CollectionRepository.findById(id);
    if (!col) return { error: 'COLLECTION_NOT_FOUND', message: 'Koleksi tidak ditemukan.' };

    const published = await CollectionRepository.publish(id);
    emitAeroEvent('COLLECTION_UPDATED', id);
    return { success: true, data: published };
  }

  static async archive(id: string) {
    const col = await CollectionRepository.findById(id);
    if (!col) return { error: 'COLLECTION_NOT_FOUND', message: 'Koleksi tidak ditemukan.' };

    const archived = await CollectionRepository.archive(id);
    emitAeroEvent('COLLECTION_UPDATED', id);
    return { success: true, data: archived };
  }

  static async addApp(id: string, appId: string) {
    const app = await AppRepository.findById(appId);
    if (!app || app.status !== 'PUBLISHED') {
      return { error: 'VALIDATION_ERROR', message: 'Hanya aplikasi berstatus PUBLISHED yang dapat dimasukkan ke dalam koleksi.' };
    }

    const updated = await CollectionRepository.addApp(id, appId);
    return { success: true, data: updated };
  }

  static async removeApp(id: string, appId: string) {
    const updated = await CollectionRepository.removeApp(id, appId);
    return { success: true, data: updated };
  }

  static async reorderApps(id: string, appIds: string[]) {
    const updated = await CollectionRepository.reorderApps(id, appIds);
    return { success: true, data: updated };
  }
}

// ---------------------------------------------------------------------------
// 6. Moderation Service
// ---------------------------------------------------------------------------
export class ModerationService {
  static async list(query: any) {
    let list = [...moderationDb];
    if (query.status) list = list.filter(m => m.status === query.status);
    if (query.priority) list = list.filter(m => m.priority === query.priority);
    return list;
  }

  static async getById(id: string) {
    const item = moderationDb.find(m => m.id === id);
    return item || null;
  }

  static async approve(id: string, actor: any) {
    const item = moderationDb.find(m => m.id === id);
    if (!item) return { error: 'MODERATION_NOT_FOUND', message: 'Item moderasi tidak ditemukan.' };

    item.status = 'approved';
    item.resolvedBy = actor.email;
    item.resolvedAt = new Date().toISOString();

    emitAeroEvent('MODERATION_APPROVED', id);
    return { success: true, data: item };
  }

  static async reject(id: string, reason: string, actor: any) {
    const item = moderationDb.find(m => m.id === id);
    if (!item) return { error: 'MODERATION_NOT_FOUND', message: 'Item moderasi tidak ditemukan.' };
    if (!reason) return { error: 'VALIDATION_ERROR', message: 'Alasan penolakan wajib diisi.' };

    item.status = 'rejected';
    item.rejectionReason = reason;
    item.resolvedBy = actor.email;
    item.resolvedAt = new Date().toISOString();

    emitAeroEvent('MODERATION_REJECTED', id);
    return { success: true, data: item };
  }

  static async requestRevision(id: string, reason: string, actor: any) {
    const item = moderationDb.find(m => m.id === id);
    if (!item) return { error: 'MODERATION_NOT_FOUND', message: 'Item moderasi tidak ditemukan.' };
    if (!reason) return { error: 'VALIDATION_ERROR', message: 'Catatan revisi wajib diisi.' };

    item.status = 'revision_requested';
    item.revisionNotes = reason;
    item.updatedAt = new Date().toISOString();

    return { success: true, data: item };
  }
}

// ---------------------------------------------------------------------------
// 7. Security Service
// ---------------------------------------------------------------------------
export class SecurityService {
  static async list(query: any) {
    return [...securityScansDb];
  }

  static async getByVersionId(versionId: string) {
    const scan = securityScansDb.find(s => s.versionId === versionId);
    return scan || null;
  }

  static async scan(versionId: string, actor: any) {
    const job = await submitBackgroundJob({
      type: 'SECURITY_SCAN',
      versionId
    });
    return { success: true, data: { jobId: job.jobId, status: 'QUEUED' } };
  }

  static async retry(versionId: string, actor: any) {
    const job = await submitBackgroundJob({
      type: 'SECURITY_SCAN',
      versionId
    });
    return { success: true, data: { jobId: job.jobId, status: 'QUEUED' } };
  }
}

// ---------------------------------------------------------------------------
// 8. Analytics Service
// ---------------------------------------------------------------------------
export class AnalyticsService {
  static async getOverview(query: any) {
    const { from, to } = query;
    if (from && to && new Date(from as string) > new Date(to as string)) {
      return { error: 'VALIDATION_ERROR', message: 'Tanggal awal (from) tidak boleh melebihi tanggal akhir (to).' };
    }

    const apps = await AppRepository.findAllAdmin({ pageSize: 1000 });
    const categories = await CategoryRepository.findActive();

    const totalDownloads = apps.data.reduce((acc, a) => acc + (a.downloads || 0), 0);
    const totalViews = totalDownloads * 4;

    return {
      success: true,
      data: {
        views: totalViews,
        downloads: totalDownloads,
        searches: 45000,
        publishedApps: apps.data.filter(a => a.status === 'PUBLISHED').length,
        activeCategories: categories.length,
        growth: {
          downloadsWeekly: '+18.4%',
          viewsWeekly: '+24.1%'
        },
        range: { from: from || 'all-time', to: to || 'now' }
      }
    };
  }

  static async getAppAnalytics(appId: string) {
    const app = await AppRepository.findById(appId);
    if (!app) return null;

    return {
      appId: app.id,
      name: app.name,
      views: app.downloads * 3 + 1000,
      downloads: app.downloads,
      searchClicks: Math.round(app.downloads * 0.4),
      growth: '+12.5%',
      trendScore: 98.4
    };
  }

  static async getDownloads(query: any) {
    const apps = await AppRepository.findPublished({ pageSize: 10 });
    return apps.data.map(a => ({
      appId: a.id,
      name: a.name,
      downloads: a.downloads,
      distributionType: a.distributionType
    }));
  }

  static async getSearch() {
    return {
      topQueries: [
        { query: 'capcut mod', count: 12400 },
        { query: 'whatsapp', count: 9800 },
        { query: 'spotify', count: 7600 },
        { query: 'video editor', count: 5400 }
      ],
      noResultQueries: [],
      ctr: '68.2%'
    };
  }

  static async getTrending(limit = 20, category?: string) {
    const result = await AppRepository.findPublished({ sort: 'popular', category, pageSize: limit });
    return result.data.map((app, index) => ({
      rank: index + 1,
      app: toPublicAppDTO(app),
      score: 100 - index * 2.5
    }));
  }
}

// ---------------------------------------------------------------------------
// 9. Upload & Storage Service (Stage 8.9)
// ---------------------------------------------------------------------------
export class UploadService {
  static async createUploadSession(body: any, actor: any) {
    const { fileName, contentType, size } = body;
    if (!fileName || !fileName.endsWith('.apk')) {
      return { error: 'INVALID_FILE_NAME', message: 'Berkas harus memiliki ekstensi .apk yang valid.' };
    }

    const maxBytes = 200 * 1024 * 1024; // 200MB limit
    if (size && size > maxBytes) {
      return { error: 'FILE_TOO_LARGE', message: 'Ukuran berkas melebihi batas maksimum 200MB.' };
    }

    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const session = await generateR2UploadSession({
      uploadId,
      fileName,
      contentType: contentType || 'application/vnd.android.package-archive',
      expectedSize: size || 0
    });

    const uploadRecord: any = {
      uploadId,
      fileName,
      objectKey: session.objectKey,
      contentType: contentType || 'application/vnd.android.package-archive',
      expectedSize: size || 0,
      status: 'CREATED',
      createdBy: actor.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    uploadsDb.push(uploadRecord);

    return { success: true, data: session };
  }

  static async completeUpload(uploadId: string, body: any, actor: any) {
    const record = uploadsDb.find(u => u.uploadId === uploadId);
    if (!record) return { error: 'UPLOAD_NOT_FOUND', message: 'Sesi unggah tidak ditemukan.' };

    if (record.status === 'COMPLETED' || record.status === 'QUEUED') {
      return { error: 'UPLOAD_ALREADY_COMPLETED', message: 'Sesi unggah ini sudah selesai diproses.' };
    }

    // Verify object existence in R2
    const objMeta = await verifyR2Object(record.objectKey);
    if (!objMeta) {
      return { error: 'R2_OBJECT_NOT_FOUND', message: 'Objek APK belum ditemukan pada penyimpanan Cloudflare R2.' };
    }

    record.actualSize = objMeta.size;
    record.status = 'QUEUED';
    record.updatedAt = new Date().toISOString();

    // Trigger background APK analysis job
    const job = await submitBackgroundJob({
      type: 'APK_PROCESSING',
      uploadId: record.uploadId
    });

    return {
      success: true,
      data: {
        uploadId: record.uploadId,
        jobId: job.jobId,
        status: 'QUEUED'
      }
    };
  }

  static async getStatus(uploadId: string) {
    const record = uploadsDb.find(u => u.uploadId === uploadId);
    if (!record) return null;
    const job = jobsDb.find(j => j.uploadId === uploadId);
    return {
      upload: record,
      job: job || null
    };
  }
}
