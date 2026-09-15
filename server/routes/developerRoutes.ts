import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { SecurityService } from '../services/securityService';
import { requireAuth, requirePermission, resolveUserSession } from '../auth';
import {
  AppRepository,
  VersionRepository,
  CategoryRepository,
  DeveloperSubmissionRepository,
} from '../repositories';

export const developerRouter = express.Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_APK_SIZE_MB || 150) * 1024 * 1024,
    files: 1,
  },
});

function safeFileName(name: string) {
  const value = path.basename(String(name || 'upload.apk')).replace(/[^a-zA-Z0-9._-]/g, '_');
  return value.toLowerCase().endsWith('.apk') ? value : `${value}.apk`;
}

function isApkContainer(buffer: Buffer) {
  return buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    ([0x03, 0x05, 0x07].includes(buffer[2]) && [0x04, 0x06, 0x08].includes(buffer[3]));
}

function sha256(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function storeApk(buffer: Buffer, originalName: string, slug: string, versionName: string) {
  if (process.env.VERCEL || process.env.APK_LOCAL_STORAGE_ENABLED !== 'true') {
    throw new Error('APK_DURABLE_STORAGE_NOT_CONFIGURED');
  }

  const fileName = `${slug}_${versionName}_${sha256(buffer).slice(0, 16)}_${safeFileName(originalName)}`;
  const dir = path.join(process.cwd(), 'uploads', 'apks');
  fs.mkdirSync(dir, { recursive: true });
  const fullPath = path.join(dir, fileName);
  fs.writeFileSync(fullPath, buffer, { mode: 0o640 });
  return `/uploads/apks/${fileName}`;
}

function userCanManageSubmission(user: any, submission: any) {
  return SecurityService.verifyDeveloperOwnership(
    user,
    submission?.developerEmail,
    submission?.developerId
  );
}

developerRouter.get('/submissions', requireAuth, requirePermission('apps.read'), async (req: any, res) => {
  try {
    const user = req.user;
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(String(user?.role || '').toUpperCase());

    const data = isAdmin && req.query.all === 'true'
      ? await DeveloperSubmissionRepository.listAll()
      : await DeveloperSubmissionRepository.listByDeveloper(user?.id, user?.email);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('[developer/submissions:list]', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Gagal memuat pengajuan.' } });
  }
});

developerRouter.get('/submissions/:id', requireAuth, requirePermission('apps.read'), async (req: any, res) => {
  try {
    const user = req.user;
    const submission = await DeveloperSubmissionRepository.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Pengajuan tidak ditemukan.' } });
    }

    if (!userCanManageSubmission(user, submission)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak.' } });
    }

    return res.json({ success: true, data: submission });
  } catch (error) {
    console.error('[developer/submissions:get]', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Gagal memuat pengajuan.' } });
  }
});

developerRouter.post('/submissions', requireAuth, requirePermission('apps.create'), memoryUpload.single('apk') as any, async (req: any, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Otentikasi diperlukan.' } });

    const name = String(req.body.name || '').trim();
    const slug = String(req.body.slug || '').trim().toLowerCase();
    const packageName = String(req.body.packageName || '').trim();
    const versionName = String(req.body.versionName || '').trim();
    const categoryValue = String(req.body.categoryId || req.body.category || '').trim();
    const downloadUrl = String(req.body.downloadUrl || '').trim();
    const officialUrl = String(req.body.officialUrl || '').trim();

    if (!name || !slug || !packageName || !versionName || !categoryValue) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Nama, slug, package name, versi, dan kategori wajib diisi.' }
      });
    }

    if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Slug tidak valid.' } });
    }

    const category = await CategoryRepository.findById(categoryValue) ||
      await CategoryRepository.findBySlug(categoryValue);

    if (!category) {
      return res.status(400).json({ success: false, error: { code: 'CATEGORY_NOT_FOUND', message: 'Kategori belum tersedia di Firestore.' } });
    }

    let actualDownloadUrl = downloadUrl || officialUrl;
    let distributionType: 'APK' | 'OFFICIAL_WEBSITE' = actualDownloadUrl ? 'OFFICIAL_WEBSITE' : 'APK';
    let fileSize = 0;
    let fileSha256 = '';
    let storageKey: string | undefined;

    if (req.file) {
      if (!isApkContainer(req.file.buffer)) {
        await SecurityService.recordSecurityEvent({
          type: 'UPLOAD_REJECTED',
          severity: 'MEDIUM',
          actorId: user.id,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: (req as any).id || crypto.randomUUID(),
          endpoint: req.originalUrl,
          metadata: { reason: 'Invalid APK/ZIP signature', fileName: req.file.originalname }
        }).catch(() => undefined);
        return res.status(400).json({ success: false, error: { code: 'INVALID_APK', message: 'File bukan container APK yang valid.' } });
      }

      fileSize = req.file.size;
      fileSha256 = sha256(req.file.buffer);

      const duplicate = await SecurityService.checkDuplicateApk(fileSha256);
      if (duplicate.isDuplicate) {
        return res.status(409).json({ success: false, error: { code: 'DUPLICATE_APK', message: 'APK dengan SHA-256 tersebut sudah terdaftar.' } });
      }

      try {
        storageKey = storeApk(req.file.buffer, req.file.originalname, slug, versionName);
        actualDownloadUrl = storageKey;
        distributionType = 'APK';
      } catch (error: any) {
        if (error?.message === 'APK_DURABLE_STORAGE_NOT_CONFIGURED') {
          return res.status(503).json({
            success: false,
            error: { code: 'STORAGE_NOT_CONFIGURED', message: 'Penyimpanan APK durable belum dikonfigurasi.' }
          });
        }
        throw error;
      }
    }

    if (distributionType === 'OFFICIAL_WEBSITE' && !/^https?:\/\//i.test(actualDownloadUrl)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_URL', message: 'URL download tidak valid.' } });
    }

    const app = await AppRepository.create({
      name,
      slug,
      packageName,
      developerName: user.name,
      shortDescription: String(req.body.shortDescription || ''),
      description: String(req.body.description || ''),
      category: category.name,
      categoryId: category.id,
      iconUrl: String(req.body.iconUrl || ''),
      bannerUrl: String(req.body.bannerUrl || ''),
      status: 'PENDING_REVIEW',
      distributionType,
      officialWebsiteUrl: officialUrl || undefined,
      downloads: 0,
      rating: 0,
      reviewsCount: 0,
      size: fileSize ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` : '',
      versionName,
      versionCode: Number(req.body.versionCode || 1),
      sha256: fileSha256,
      createdBy: user.id,
      updatedBy: user.id,
    });

    const version = await VersionRepository.create({
      appId: app.id,
      versionName,
      versionCode: Number(req.body.versionCode || 1),
      packageName,
      sha256: fileSha256,
      status: 'PENDING_REVIEW',
      securityStatus: 'PENDING',
      analysisStatus: 'PENDING',
      storageKey,
      storageProvider: storageKey ? 'local' : undefined,
      downloadUrl: actualDownloadUrl || undefined,
      changelog: String(req.body.whatsNew || ''),
      minSdk: 0,
      targetSdk: 0,
      fileSize,
      permissions: [],
      architectures: [],
      moderationStatus: 'PENDING',
      downloadAllowed: false,
    });

    const submission = await DeveloperSubmissionRepository.create({
      id: `sub_${crypto.randomUUID()}`,
      developerId: user.id,
      developerEmail: user.email,
      appId: app.id,
      appName: app.name,
      slug: app.slug,
      packageName,
      category: category.name,
      categoryId: category.id,
      shortDescription: app.shortDescription,
      description: app.description,
      downloadUrl: actualDownloadUrl,
      officialUrl,
      ownershipStatus: 'PENDING_REVIEW',
      securityStatus: 'PENDING',
      reviewStatus: 'PENDING',
      status: 'PENDING_REVIEW',
      versionName,
      versionCode: Number(req.body.versionCode || 1),
      sha256: fileSha256,
      fileSize,
      whatsNew: String(req.body.whatsNew || ''),
      versionHistory: [],
    });

    await AppRepository.update(app.id, { latestVersionId: version.id });

    return res.status(201).json({
      success: true,
      data: submission,
      message: 'Aplikasi berhasil diajukan dan menunggu pemeriksaan.',
    });
  } catch (error: any) {
    console.error('[developer/submissions:create]', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Gagal memproses pengajuan aplikasi.' } });
  }
});

developerRouter.post('/submissions/:id/update-version', requireAuth, requirePermission('apps.update'), memoryUpload.single('apk') as any, async (req: any, res) => {
  try {
    const user = req.user;
    const submission: any = await DeveloperSubmissionRepository.findById(req.params.id);

    if (!submission) return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Pengajuan tidak ditemukan.' } });
    if (!userCanManageSubmission(user, submission)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak.' } });
    if (!submission.appId) return res.status(409).json({ success: false, error: { code: 'APP_ID_MISSING', message: 'Pengajuan lama tidak memiliki appId Firestore.' } });

    const app = await AppRepository.findById(submission.appId);
    if (!app) return res.status(404).json({ success: false, error: { code: 'APP_NOT_FOUND', message: 'Aplikasi tidak ditemukan di Firestore.' } });

    const newVersionName = String(req.body.newVersionName || '').trim();
    const currentVersions = await VersionRepository.findAllByAppId(app.id);
    const currentVersion = currentVersions[0];

    if (!newVersionName) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Versi baru wajib diisi.' } });
    if (currentVersion && newVersionName === currentVersion.versionName) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Versi baru tidak boleh sama dengan versi aktif.' } });
    }

    let downloadUrl = String(req.body.downloadUrl || submission.downloadUrl || '').trim();
    let fileSize = 0;
    let fileSha256 = '';

    if (req.file) {
      if (!isApkContainer(req.file.buffer)) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_APK', message: 'File APK tidak valid.' } });
      }
      fileSize = req.file.size;
      fileSha256 = sha256(req.file.buffer);
      const duplicate = await SecurityService.checkDuplicateApk(fileSha256);
      if (duplicate.isDuplicate) return res.status(409).json({ success: false, error: { code: 'DUPLICATE_APK', message: 'APK tersebut sudah terdaftar.' } });
      downloadUrl = storeApk(req.file.buffer, req.file.originalname, app.slug, newVersionName);
    }

    const nextCode = Math.max(
      Number(req.body.versionCode || 0),
      Number(currentVersion?.versionCode || 0) + 1
    );

    const version = await VersionRepository.create({
      appId: app.id,
      versionName: newVersionName,
      versionCode: nextCode,
      packageName: app.packageName,
      sha256: fileSha256,
      status: 'PENDING_REVIEW',
      securityStatus: 'PENDING',
      analysisStatus: 'PENDING',
      downloadUrl,
      storageKey: downloadUrl.startsWith('/uploads/') ? downloadUrl : undefined,
      storageProvider: downloadUrl.startsWith('/uploads/') ? 'local' : undefined,
      changelog: String(req.body.whatsNew || ''),
      minSdk: currentVersion?.minSdk || 0,
      targetSdk: currentVersion?.targetSdk || 0,
      fileSize,
      permissions: currentVersion?.permissions || [],
      architectures: currentVersion?.architectures || [],
      moderationStatus: 'PENDING',
      downloadAllowed: false,
    });

    const updated = await DeveloperSubmissionRepository.update(submission.id, {
      versionName: newVersionName,
      versionCode: nextCode,
      sha256: fileSha256,
      fileSize,
      downloadUrl,
      whatsNew: String(req.body.whatsNew || ''),
      reviewStatus: 'PENDING',
      status: 'PENDING_REVIEW',
      securityStatus: 'PENDING',
      versionHistory: [
        ...(submission.versionHistory || []),
        {
          versionName: currentVersion?.versionName || submission.versionName,
          versionCode: currentVersion?.versionCode || submission.versionCode,
          whatsNew: currentVersion?.changelog || submission.whatsNew || '',
          sha256: currentVersion?.sha256 || submission.sha256,
          fileSize: currentVersion?.fileSize || submission.fileSize,
        },
      ],
    });

    await AppRepository.update(app.id, {
      versionName: newVersionName,
      versionCode: nextCode,
      sha256: fileSha256,
      size: fileSize ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` : app.size,
      updatedBy: user.id,
      latestVersionId: version.id,
    });

    return res.json({
      success: true,
      data: { submission: updated, version },
      message: `Versi aplikasi berhasil diajukan ke v${newVersionName}.`,
    });
  } catch (error: any) {
    console.error('[developer/submissions:update-version]', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Gagal memproses update aplikasi.' } });
  }
});
