import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { SecurityService } from '../services/securityService';
import { resolveUserSession } from '../auth';

export const developerRouter = express.Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Helper for parsing file buffer
function parseFileBuffer(buffer: Buffer, originalName: string) {
  const sha256Hex = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
  const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1) + ' MB';
  return {
    packageName: 'com.developer.' + originalName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    versionName: '1.0.0',
    versionCode: 1,
    sha256: sha256Hex,
    fileSize: sizeMb
  };
}

// In-memory developer submissions store
export const developerSubmissionsStore: any[] = [];

// GET /api/developer/submissions - List submissions for authenticated developer
developerRouter.get('/submissions', (req: any, res) => {
  const sessionUser = resolveUserSession(req);
  const email = (sessionUser?.email || '').toLowerCase();

  // If superadmin/admin, can view all if requested
  if ((sessionUser?.role === 'SUPER_ADMIN' || sessionUser?.role === 'ADMIN') && req.query.all === 'true') {
    return res.json({ success: true, data: developerSubmissionsStore });
  }

  const submissions = developerSubmissionsStore.filter(s => (s.developerEmail || '').toLowerCase() === email);
  return res.json({ success: true, data: submissions });
});

// GET /api/developer/submissions/:id - View specific submission with ownership protection
developerRouter.get('/submissions/:id', (req: any, res) => {
  const sessionUser = resolveUserSession(req);
  const submission = developerSubmissionsStore.find(s => s.id === req.params.id);

  if (!submission) {
    return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Pengajuan tidak ditemukan.' } });
  }

  const isOwner = SecurityService.verifyDeveloperOwnership(sessionUser, submission.developerEmail, submission.developerId);
  if (!isOwner && sessionUser?.email?.toLowerCase() !== (submission.developerEmail || '').toLowerCase()) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Akses ditolak: Anda tidak berhak mengakses pengajuan pengembang lain.' }
    });
  }

  return res.json({ success: true, data: submission });
});

// POST /api/developer/submissions - Submit new app with metadata and download URL
developerRouter.post('/submissions', memoryUpload.single('apk') as any, async (req: any, res) => {
  try {
    const sessionUser = resolveUserSession(req);
    const { name, slug, packageName, category, shortDescription, description, downloadUrl, officialUrl, versionName } = req.body;
    const developerEmail = sessionUser?.email || '';

    if (!name || !slug) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama dan slug aplikasi wajib diisi.' } });
    }

    let apkMeta: any = {
      packageName: packageName || `com.developer.${slug.replace(/[^a-z0-9]/g, '')}`,
      versionName: versionName || '1.0.0',
      versionCode: 1,
      sha256: crypto.createHash('sha256').update(name + Date.now()).digest('hex').toUpperCase(),
      fileSize: 'N/A'
    };

    let actualDownloadUrl = downloadUrl || officialUrl || '';

    if (req.file) {
      const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
      apkMeta = parseFileBuffer(req.file.buffer, sanitizedName);

      const destDir = path.join(process.cwd(), 'uploads', 'apks');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const destPath = path.join(destDir, `${Date.now()}_${sanitizedName}`);
      fs.writeFileSync(destPath, req.file.buffer);
      actualDownloadUrl = `/uploads/apks/${path.basename(destPath)}`;
    }

    const newSubmission = {
      id: `sub_${Date.now()}`,
      developerId: sessionUser?.id || `dev_${Math.random().toString(36).substring(2, 9)}`,
      developerEmail,
      appName: name,
      slug,
      packageName: packageName || apkMeta.packageName,
      category: category || 'Alat & Utilitas',
      shortDescription: shortDescription || '',
      description: description || '',
      downloadUrl: actualDownloadUrl,
      officialUrl: officialUrl || '',
      ownershipStatus: 'VERIFIED',
      securityStatus: 'VERIFIED',
      reviewStatus: 'APPROVED',
      status: 'PUBLISHED',
      versionName: versionName || apkMeta.versionName,
      versionCode: apkMeta.versionCode,
      sha256: apkMeta.sha256,
      fileSize: apkMeta.fileSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    developerSubmissionsStore.push(newSubmission);

    return res.status(201).json({
      success: true,
      data: newSubmission,
      message: 'Aplikasi berhasil didaftarkan.'
    });
  } catch (err: any) {
    console.error('Developer submission error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Gagal memproses pendaftaran aplikasi.' } });
  }
});

// POST /api/developer/submissions/:id/update-version - Apply app update without creating duplicate app
developerRouter.post('/submissions/:id/update-version', memoryUpload.single('apk') as any, async (req: any, res) => {
  try {
    const sessionUser = resolveUserSession(req);
    const { id } = req.params;
    const { newVersionName, whatsNew, downloadUrl } = req.body;
    const developerEmail = sessionUser?.email || '';

    const submission = developerSubmissionsStore.find(s => s.id === id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Aplikasi tidak ditemukan.' }
      });
    }

    // Ownership check
    const isOwner = SecurityService.verifyDeveloperOwnership(sessionUser, submission.developerEmail, submission.developerId);
    const isAdmin = sessionUser?.role === 'SUPER_ADMIN' || sessionUser?.role === 'ADMIN';
    if (!isOwner && !isAdmin && sessionUser?.email?.toLowerCase() !== (submission.developerEmail || '').toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak: Anda hanya dapat memperbarui aplikasi milik Anda sendiri.' }
      });
    }

    // Validation: newVersionName required
    if (!newVersionName || !newVersionName.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Nama versi baru wajib diisi.' }
      });
    }

    // Validation: newVersionName cannot match current version
    const trimmedNewVersion = newVersionName.trim();
    if (trimmedNewVersion === submission.versionName) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Versi baru (${trimmedNewVersion}) tidak boleh sama dengan versi yang sedang aktif (v${submission.versionName}).` }
      });
    }

    // Archive current version to history
    if (!submission.versionHistory) {
      submission.versionHistory = [];
    }
    submission.versionHistory.push({
      versionName: submission.versionName,
      whatsNew: submission.whatsNew || '',
      sha256: submission.sha256,
      fileSize: submission.fileSize,
      downloadUrl: submission.downloadUrl,
      updatedAt: submission.updatedAt || submission.createdAt
    });

    // Handle new APK file if uploaded
    if (req.file) {
      const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
      const apkMeta = parseFileBuffer(req.file.buffer, sanitizedName);

      const destDir = path.join(process.cwd(), 'uploads', 'apks');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const destPath = path.join(destDir, `${Date.now()}_${sanitizedName}`);
      fs.writeFileSync(destPath, req.file.buffer);

      submission.downloadUrl = `/uploads/apks/${path.basename(destPath)}`;
      submission.sha256 = apkMeta.sha256;
      submission.fileSize = apkMeta.fileSize;
    } else if (downloadUrl) {
      submission.downloadUrl = downloadUrl;
    }

    // Update main fields
    submission.versionName = trimmedNewVersion;
    submission.whatsNew = whatsNew || '';
    submission.updatedAt = new Date().toISOString();
    submission.reviewStatus = 'APPROVED';

    return res.json({
      success: true,
      data: submission,
      message: `Versi aplikasi berhasil diperbarui ke v${trimmedNewVersion}.`
    });
  } catch (err: any) {
    console.error('Update app version error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Gagal menerapkan update aplikasi.' }
    });
  }
});
           
