// ---------------------------------------------------------------------------
// ADMIN API ROUTER (/api/admin/*) (STAGE 8.8 & 8.9)
// Enforces Authentication, RBAC, Validation, Services & DTO Projections
// ---------------------------------------------------------------------------

import { Router } from 'express';
import { requireAuth, requirePermission } from '../auth';
import {
  AdminAppService,
  VersionService,
  CategoryService,
  CollectionService,
  ModerationService,
  SecurityService,
  AnalyticsService,
  UploadService
} from '../services';
import {
  auditLogsDb,
  usersDb,
  systemSettingsDb,
  CategoryRepository,
  uploadsDb
} from '../repositories';
import { sendSuccess, sendList, sendError, ERROR_CODES } from '../errors';
import fs from 'fs';
import path from 'path';

export const adminRouter = Router();

// Apply Authentication for all Admin routes
adminRouter.use(requireAuth);

// ---------------------------------------------------------------------------
// 1. APPS MANAGEMENT
// ---------------------------------------------------------------------------
adminRouter.get('/apps', requirePermission('apps.read'), async (req, res) => {
  try {
    const result = await AdminAppService.list(req.query);
    return sendList(res, result.data, result.page, result.pageSize, result.total);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/apps', requirePermission('apps.create'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await AdminAppService.create(req.body, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal membuat aplikasi.', 400);
    }
    return sendSuccess(res, result.data, 201);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/apps/:id', requirePermission('apps.read'), async (req, res) => {
  try {
    const app = await AdminAppService.getById(req.params.id);
    if (!app) {
      return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);
    }
    return sendSuccess(res, app);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.patch('/apps/:id', requirePermission('apps.update'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await AdminAppService.update(req.params.id, req.body, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal memperbarui aplikasi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/apps/:id/publish', requirePermission('apps.publish'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await AdminAppService.publish(req.params.id, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal mempublikasikan aplikasi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/apps/:id/archive', requirePermission('apps.archive'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await AdminAppService.archive(req.params.id, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal mengarsipkan aplikasi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/apps/:id/restore', requirePermission('apps.update'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await AdminAppService.restore(req.params.id, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal mengembalikan aplikasi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// ---------------------------------------------------------------------------
// 2. VERSIONS MANAGEMENT
// ---------------------------------------------------------------------------
adminRouter.get('/apps/:id/versions', requirePermission('versions.read'), async (req, res) => {
  try {
    const list = await VersionService.listByAppId(req.params.id);
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/apps/:id/versions', requirePermission('versions.create'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await VersionService.create(req.params.id, req.body, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal menambahkan versi.', 400);
    }
    return sendSuccess(res, result.data, 201);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.patch('/versions/:id', requirePermission('versions.update'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await VersionService.update(req.params.id, req.body, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal memperbarui versi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/versions/:id/publish', requirePermission('versions.publish'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await VersionService.publish(req.params.id, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal mempublikasikan versi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/versions/:id/archive', requirePermission('versions.update'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await VersionService.archive(req.params.id, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal mengarsipkan versi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/versions/:id/retry-analysis', requirePermission('security.retry'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await VersionService.retryAnalysis(req.params.id, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal menjadwalkan analisa ulang.', 400);
    }
    return sendSuccess(res, result.data, 202);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// ---------------------------------------------------------------------------
// 3. CATEGORIES MANAGEMENT
// ---------------------------------------------------------------------------
adminRouter.get('/categories', requirePermission('categories.read'), async (req, res) => {
  try {
    const list = await CategoryService.listAdmin();
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/categories', requirePermission('categories.create'), async (req, res) => {
  try {
    const result = await CategoryService.create(req.body);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal membuat kategori.', 400);
    }
    return sendSuccess(res, result.data, 201);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/categories/:id', requirePermission('categories.read'), async (req, res) => {
  try {
    const cat = await CategoryRepository.findById(req.params.id);
    if (!cat) {
      return sendError(res, ERROR_CODES.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);
    }
    return sendSuccess(res, cat);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.patch('/categories/:id', requirePermission('categories.update'), async (req, res) => {
  try {
    const result = await CategoryService.update(req.params.id, req.body);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal memperbarui kategori.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/categories/:id/archive', requirePermission('categories.update'), async (req, res) => {
  try {
    const result = await CategoryService.archive(req.params.id);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal mengarsipkan kategori.', 409, {
        dependentCount: (result as any).dependentCount
      });
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/categories/:id/restore', requirePermission('categories.update'), async (req, res) => {
  try {
    const result = await CategoryService.restore(req.params.id);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal memulihkan kategori.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// ---------------------------------------------------------------------------
// 4. COLLECTIONS MANAGEMENT
// ---------------------------------------------------------------------------
adminRouter.get('/collections', requirePermission('collections.read'), async (req, res) => {
  try {
    const list = await CollectionService.listAdmin();
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/collections', requirePermission('collections.create'), async (req, res) => {
  try {
    const result = await CollectionService.create(req.body);
    return sendSuccess(res, result.data, 201);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/collections/:id', requirePermission('collections.read'), async (req, res) => {
  try {
    const col = await CollectionService.update(req.params.id, {});
    if (!col) {
      return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Koleksi tidak ditemukan.', 404);
    }
    return sendSuccess(res, col);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.patch('/collections/:id', requirePermission('collections.update'), async (req, res) => {
  try {
    const result = await CollectionService.update(req.params.id, req.body);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal memperbarui koleksi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/collections/:id/publish', requirePermission('collections.publish'), async (req, res) => {
  try {
    const result = await CollectionService.publish(req.params.id);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal mempublikasikan koleksi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/collections/:id/archive', requirePermission('collections.update'), async (req, res) => {
  try {
    const result = await CollectionService.archive(req.params.id);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal mengarsipkan koleksi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/collections/:id/apps', requirePermission('collections.update'), async (req, res) => {
  try {
    const result = await CollectionService.addApp(req.params.id, req.body.appId);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal menambahkan aplikasi ke koleksi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.delete('/collections/:id/apps/:appId', requirePermission('collections.update'), async (req, res) => {
  try {
    const result = await CollectionService.removeApp(req.params.id, req.params.appId);
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.patch('/collections/:id/apps/reorder', requirePermission('collections.update'), async (req, res) => {
  try {
    const result = await CollectionService.reorderApps(req.params.id, req.body.appIds);
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// ---------------------------------------------------------------------------
// 5. HOMEPAGE MANAGEMENT
// ---------------------------------------------------------------------------
adminRouter.get('/homepage', requirePermission('homepage.read'), (req, res) => {
  return sendSuccess(res, {
    heroSection: {
      headline: 'Temukan & Unduh Aplikasi Android Terbaik',
      subheadline: 'Aman, terverifikasi SHA-256, bebas malware, dan berkecepatan tinggi.'
    },
    featuredAppIds: ['app_capcut', 'app_whatsapp', 'app_spotify'],
    curatedCollectionIds: ['col_1']
  });
});

adminRouter.patch('/homepage', requirePermission('homepage.update'), (req, res) => {
  return sendSuccess(res, {
    message: 'Konfigurasi beranda berhasil diperbarui.',
    updatedConfig: req.body
  });
});

// ---------------------------------------------------------------------------
// 6. MODERATION WORKFLOW
// ---------------------------------------------------------------------------
adminRouter.get('/moderation', requirePermission('moderation.read'), async (req, res) => {
  try {
    const list = await ModerationService.list(req.query);
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/moderation/:id', requirePermission('moderation.read'), async (req, res) => {
  try {
    const item = await ModerationService.getById(req.params.id);
    if (!item) {
      return sendError(res, ERROR_CODES.MODERATION_NOT_FOUND, 'Item moderasi tidak ditemukan.', 404);
    }
    return sendSuccess(res, item);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/moderation/:id/approve', requirePermission('moderation.approve'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await ModerationService.approve(req.params.id, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal menyetujui moderasi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/moderation/:id/reject', requirePermission('moderation.reject'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await ModerationService.reject(req.params.id, req.body.reason, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal menolak item moderasi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/moderation/:id/request-revision', requirePermission('moderation.review'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await ModerationService.requestRevision(req.params.id, req.body.reason, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal meminta revisi.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// ---------------------------------------------------------------------------
// 7. SECURITY SCAN & AUDIT
// ---------------------------------------------------------------------------
adminRouter.get('/security', requirePermission('security.read'), async (req, res) => {
  try {
    const list = await SecurityService.list(req.query);
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/security/:versionId', requirePermission('security.read'), async (req, res) => {
  try {
    const scan = await SecurityService.getByVersionId(req.params.versionId);
    if (!scan) {
      return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Hasil pindai keamanan versi tidak ditemukan.', 404);
    }
    return sendSuccess(res, scan);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/security/:versionId/scan', requirePermission('security.scan'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await SecurityService.scan(req.params.versionId, actor);
    return sendSuccess(res, result.data, 202);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/security/:versionId/retry', requirePermission('security.retry'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await SecurityService.retry(req.params.versionId, actor);
    return sendSuccess(res, result.data, 202);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// ---------------------------------------------------------------------------
// 8. ANALYTICS & AUDIT LOGS
// ---------------------------------------------------------------------------
adminRouter.get('/analytics/overview', requirePermission('analytics.read'), async (req, res) => {
  try {
    const result = await AnalyticsService.getOverview(req.query);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Parameter tanggal tidak valid.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/analytics/apps/:id', requirePermission('analytics.read'), async (req, res) => {
  try {
    const result = await AnalyticsService.getAppAnalytics(req.params.id);
    if (!result) {
      return sendError(res, ERROR_CODES.APP_NOT_FOUND, 'Aplikasi tidak ditemukan.', 404);
    }
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/analytics/downloads', requirePermission('analytics.read'), async (req, res) => {
  try {
    const result = await AnalyticsService.getDownloads(req.query);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/analytics/search', requirePermission('analytics.read'), async (req, res) => {
  try {
    const result = await AnalyticsService.getSearch();
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/analytics/trending', requirePermission('analytics.read'), async (req, res) => {
  try {
    const result = await AnalyticsService.getTrending(50);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/audit', requirePermission('audit.read'), (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 50;
  return sendList(res, auditLogsDb, page, pageSize, auditLogsDb.length);
});

adminRouter.get('/audit/:id', requirePermission('audit.read'), (req, res) => {
  const log = auditLogsDb.find(a => a.id === req.params.id);
  if (!log) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Catatan audit tidak ditemukan.', 404);
  }
  return sendSuccess(res, log);
});

// ---------------------------------------------------------------------------
// 9. ACCESS & USER MANAGEMENT
// ---------------------------------------------------------------------------
adminRouter.get('/access/users', requirePermission('access.read'), (req, res) => {
  return sendSuccess(res, usersDb);
});

adminRouter.get('/access/users/:id', requirePermission('access.read'), (req, res) => {
  const user = usersDb.find(u => u.id === req.params.id);
  if (!user) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Pengguna tidak ditemukan.', 404);
  }
  return sendSuccess(res, user);
});

adminRouter.post('/access/users', requirePermission('access.update'), (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !role) {
    return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Email dan peran (role) wajib disertakan.', 400);
  }
  const newUser = {
    id: `usr_${Date.now()}`,
    email,
    name: name || email.split('@')[0],
    role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
  usersDb.push(newUser);
  return sendSuccess(res, newUser, 201);
});

adminRouter.patch('/access/users/:id', requirePermission('access.update'), (req, res) => {
  const user = usersDb.find(u => u.id === req.params.id);
  if (!user) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Pengguna tidak ditemukan.', 404);
  }
  Object.assign(user, req.body);
  return sendSuccess(res, user);
});

adminRouter.post('/access/users/:id/suspend', requirePermission('access.update'), (req, res) => {
  const user = usersDb.find(u => u.id === req.params.id);
  if (!user) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Pengguna tidak ditemukan.', 404);
  }
  user.status = 'SUSPENDED';
  return sendSuccess(res, user);
});

adminRouter.post('/access/users/:id/activate', requirePermission('access.update'), (req, res) => {
  const user = usersDb.find(u => u.id === req.params.id);
  if (!user) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Pengguna tidak ditemukan.', 404);
  }
  user.status = 'ACTIVE';
  return sendSuccess(res, user);
});

// ---------------------------------------------------------------------------
// 10. SYSTEM SETTINGS
// ---------------------------------------------------------------------------
adminRouter.get('/settings', requirePermission('settings.read'), (req, res) => {
  return sendSuccess(res, systemSettingsDb);
});

adminRouter.patch('/settings', requirePermission('settings.update'), (req, res) => {
  Object.assign(systemSettingsDb, req.body);
  return sendSuccess(res, systemSettingsDb);
});

// ---------------------------------------------------------------------------
// 11. UPLOAD SESSIONS & STORAGE (STAGE 8.9)
// ---------------------------------------------------------------------------
adminRouter.post('/uploads/session', requirePermission('uploads.create'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await UploadService.createUploadSession(req.body, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal membuat sesi unggah.', 400);
    }
    return sendSuccess(res, result.data, 201);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.post('/uploads/:uploadId/complete', requirePermission('uploads.process'), async (req, res) => {
  try {
    const actor = (req as any).user;
    const result = await UploadService.completeUpload(req.params.uploadId, req.body, actor);
    if (result.error) {
      return sendError(res, result.error, result.message || 'Gagal menyelesaikan sesi unggah.', 400);
    }
    return sendSuccess(res, result.data);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

adminRouter.get('/uploads/:uploadId/status', requirePermission('uploads.create'), async (req, res) => {
  try {
    const status = await UploadService.getStatus(req.params.uploadId);
    if (!status) {
      return sendError(res, ERROR_CODES.UPLOAD_NOT_FOUND, 'Sesi unggah tidak ditemukan.', 404);
    }
    return sendSuccess(res, status);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// Direct storage binary handler for local fallback
adminRouter.put('/uploads/direct-storage/:uploadId', (req, res) => {
  const uploadId = req.params.uploadId;
  const session = uploadsDb.find(u => u.uploadId === uploadId);
  const key = (req.query.key as string) || (session ? session.objectKey : `temporary/${uploadId}/application.apk`);
  
  // Resolve target in GCS local fallback storage directory
  const targetFile = path.join(process.cwd(), 'uploads', 'gcs_storage', key.replace(/\//g, path.sep));
  const targetDir = path.dirname(targetFile);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const fileStream = fs.createWriteStream(targetFile);

  req.pipe(fileStream);

  fileStream.on('finish', () => {
    // Also copy to uploads/apks for fallback/compatibility if needed
    try {
      const fallbackDir = path.join(process.cwd(), 'uploads', 'apks');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      fs.copyFileSync(targetFile, path.join(fallbackDir, path.basename(key)));
    } catch (e) {
      // ignore
    }
    return res.status(200).json({ success: true, message: 'Berkas berhasil disimpan ke penyimpanan.' });
  });

  fileStream.on('error', (err) => {
    return sendError(res, ERROR_CODES.UPLOAD_FAILED, err.message, 500);
  });
});
