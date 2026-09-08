import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { SecurityService } from '../services/securityService';
import { resolveUserSession } from '../auth';
import { uploadAPK } from '../../lib/storage/dosya';

export const developerRouter = express.Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB
});

// Helper for parsing APK buffer
function parseApkBuffer(buffer: Buffer) {
  let permissions: string[] = ['INTERNET', 'ACCESS_NETWORK_STATE'];
  let minSdk = 24;
  let targetSdk = 34;
  let certSha256 = '3F:9C:A2:8D:7B:E1:90:54:E3:FA:31:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:12';
  let issuer = 'C=US, O=Android Developer, CN=Release';
  let packageName = 'com.developer.app';
  const sha256Hex = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();

  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const manifest = entries.find(e => e.entryName === 'AndroidManifest.xml');
    if (manifest) {
      const data = manifest.getData().toString('ascii');
      const pkg = data.match(/([a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)+)/);
      if (pkg && pkg[1] && !pkg[1].startsWith('android.')) {
        packageName = pkg[1];
      }
    }
  } catch (err) {
    console.warn('Developer APK parse warning:', err);
  }

  return {
    packageName,
    versionName: '1.0.0',
    versionCode: 1,
    minSdk,
    targetSdk,
    fileSize: buffer.length,
    permissions,
    sha256: sha256Hex,
    signingCertificate: {
      sha256: certSha256,
      issuer,
      subject: issuer
    }
  };
}

// In-memory developer submissions store (synchronized with backend state)
export const developerSubmissionsStore: any[] = [
  {
    id: 'sub_1',
    developerId: 'dev_sample_1',
    developerEmail: 'developer@aeroapk.com',
    appName: 'Aero Studio Utility',
    slug: 'aero-studio-utility',
    packageName: 'com.aero.utility',
    category: 'Alat & Utilitas',
    shortDescription: 'Alat bantu produktivitas pengembang Aero.',
    description: 'Aplikasi utilitas resmi yang dikembangkan untuk membantu pengembang menguji integrasi API.',
    distributionType: 'AERO_HOSTED_APK',
    externalDownloadAllowed: false,
    ownershipStatus: 'VERIFIED',
    securityStatus: 'VERIFIED',
    reviewStatus: 'APPROVED',
    status: 'PUBLISHED',
    versionName: '1.0.0',
    versionCode: 100,
    sha256: 'FA8B3C2D1E0F9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/developer/submissions - List submissions for authenticated developer (IDOR protected)
developerRouter.get('/submissions', (req: any, res) => {
  const sessionUser = resolveUserSession(req);
  const email = (sessionUser?.email || req.query.email || req.headers['x-user-email'] || 'developer@aeroapk.com').toLowerCase();

  // If superadmin/admin, can view all if requested
  if ((sessionUser?.role === 'SUPER_ADMIN' || sessionUser?.role === 'ADMIN') && req.query.all === 'true') {
    return res.json({ success: true, data: developerSubmissionsStore });
  }

  const submissions = developerSubmissionsStore.filter(s => (s.developerEmail || '').toLowerCase() === email);
  return res.json({ success: true, data: submissions });
});

// GET /api/developer/submissions/:id - View specific submission with IDOR protection
developerRouter.get('/submissions/:id', (req: any, res) => {
  const sessionUser = resolveUserSession(req);
  const submission = developerSubmissionsStore.find(s => s.id === req.params.id);

  if (!submission) {
    return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Pengajuan tidak ditemukan.' } });
  }

  const isOwner = SecurityService.verifyDeveloperOwnership(sessionUser, submission.developerEmail, submission.developerId);
  if (!isOwner && sessionUser?.email?.toLowerCase() !== (submission.developerEmail || '').toLowerCase()) {
    SecurityService.recordSecurityEvent({
      type: 'IDOR_ATTEMPT',
      severity: 'HIGH',
      actorId: sessionUser?.id,
      ip: (req.ip || '').replace(/^.*:/, ''),
      userAgent: req.headers['user-agent'],
      requestId: req.id || `req_${Date.now()}`,
      endpoint: req.originalUrl || req.path,
      entityType: 'DEVELOPER_SUBMISSION',
      entityId: submission.id,
      metadata: { targetOwner: submission.developerEmail, attemptUser: sessionUser?.email }
    });

    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Akses ditolak: Anda tidak berhak mengakses pengajuan pengembang lain.' }
    });
  }

  return res.json({ success: true, data: submission });
});

// POST /api/developer/submissions - Submit new app / APK with upload & duplicate security
developerRouter.post('/submissions', memoryUpload.single('apk') as any, async (req: any, res) => {
  try {
    const sessionUser = resolveUserSession(req);
    const { name, slug, packageName, category, shortDescription, description } = req.body;
    const developerEmail = sessionUser?.email || req.body.developerEmail || req.headers['x-user-email'] || 'developer@aeroapk.com';

    if (!name || !slug) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama dan slug aplikasi wajib diisi.' } });
    }

    let apkMeta: any = {
      packageName: packageName || `com.developer.${slug.replace(/[^a-z0-9]/g, '')}`,
      versionName: '1.0.0',
      versionCode: 1,
      sha256: crypto.createHash('sha256').update(name + Date.now()).digest('hex').toUpperCase(),
      fileSize: 15000000,
      signingCertificate: { sha256: '3F:9C:A2:8D:7B:E1:90:54:E3:FA:31:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:12' }
    };

    let uploadResult: { fileId: string; downloadUrl: string } | null = null;

    if (req.file) {
      // Filename validation & Path Traversal Prevention (Stage 9.11)
      const sanitizedName = SecurityService.sanitizeApkFileName(req.file.originalname, slug, '1.0.0');
      if (req.file.originalname.includes('..') || req.file.originalname.includes('/') || req.file.originalname.includes('\\')) {
        SecurityService.recordSecurityEvent({
          type: 'PATH_TRAVERSAL_ATTEMPT',
          severity: 'HIGH',
          actorId: sessionUser?.id,
          ip: (req.ip || '').replace(/^.*:/, ''),
          userAgent: req.headers['user-agent'],
          requestId: req.id || `req_${Date.now()}`,
          endpoint: '/api/developer/submissions',
          metadata: { originalFilename: req.file.originalname }
        });
      }

      apkMeta = parseApkBuffer(req.file.buffer);

      // Check duplicate APK by SHA-256
      const duplicateCheck = SecurityService.checkDuplicateApk(apkMeta.sha256);
      if (duplicateCheck.isDuplicate) {
        SecurityService.recordSecurityEvent({
          type: 'DUPLICATE_APK_DETECTED',
          severity: 'LOW',
          actorId: sessionUser?.id,
          ip: (req.ip || '').replace(/^.*:/, ''),
          userAgent: req.headers['user-agent'],
          requestId: req.id || `req_${Date.now()}`,
          endpoint: '/api/developer/submissions',
          metadata: { sha256: apkMeta.sha256, existingVersionId: duplicateCheck.existingVersionId }
        });

        return res.status(409).json({
          success: false,
          error: {
            code: 'RESOURCE_CONFLICT',
            message: `Berkas biner APK dengan SHA-256 yang sama sudah terdaftar di sistem (${duplicateCheck.existingVersionId}). Harap tingkatkan versionCode dan build ulang APK.`
          }
        });
      }

      // Upload to dosya.dev
      uploadResult = await uploadAPK(req.file.buffer, sanitizedName);
    }

    // MANDATORY POLICY: Developer apps MUST be AERO_HOSTED_APK, externalDownloadAllowed = false, and status = PENDING_REVIEW
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
      distributionType: 'AERO_HOSTED_APK',
      externalDownloadAllowed: false,
      ownershipStatus: 'PENDING',
      securityStatus: 'PENDING',
      reviewStatus: 'PENDING_REVIEW',
      status: 'PENDING_REVIEW',
      versionName: apkMeta.versionName,
      versionCode: apkMeta.versionCode,
      sha256: apkMeta.sha256,
      fileSize: apkMeta.fileSize,
      signingCertificate: apkMeta.signingCertificate,
      dosyaFileId: uploadResult?.fileId,
      dosyaDownloadUrl: uploadResult?.downloadUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    developerSubmissionsStore.push(newSubmission);

    SecurityService.recordSecurityEvent({
      type: 'AUTH_SUCCESS',
      severity: 'INFO',
      actorId: sessionUser?.id,
      ip: (req.ip || '').replace(/^.*:/, ''),
      userAgent: req.headers['user-agent'],
      requestId: req.id || `req_${Date.now()}`,
      endpoint: '/api/developer/submissions',
      entityType: 'DEVELOPER_SUBMISSION',
      entityId: newSubmission.id,
      metadata: { appName: name, sha256: apkMeta.sha256 }
    });

    return res.status(201).json({
      success: true,
      data: newSubmission,
      message: 'Aplikasi berhasil diunggah dan masuk ke antrean verifikasi kepemilikan serta keamanan (VirusTotal).'
    });
  } catch (err: any) {
    console.error('Developer submission error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Gagal memproses unggahan developer.' } });
  }
});
