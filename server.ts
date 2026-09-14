import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { getSession } from '@auth/express';

import { authConfig } from './auth';
import { resolveOrCreateFirestoreUser } from './server/auth';
import { publicRouter } from './server/routes/publicRoutes';
import { adminRouter } from './server/routes/adminRoutes';
import { internalRouter } from './server/routes/internalRoutes';
import { authRouter } from './server/routes/authRoutes';
import { developerRouter } from './server/routes/developerRoutes';
import { smartCollectionsRouter } from './server/routes/smartCollections';
import { customerServiceRouter } from './server/routes/customerServiceRoutes';
import { assistantRouter } from './server/routes/assistantRoutes';
import { adminIntelligenceRouter } from './server/routes/adminIntelligence';
import { developerIntelligenceRouter } from './server/routes/developerIntelligence';
import { healthRouter } from './server/routes/healthRoutes';
import { seoRouter } from './server/routes/seoRoutes';
import { aiDiscoveryRouter } from './server/routes/aiDiscoveryRoutes';

import { initializeBackgroundWorkers } from './server/jobs';
import { runReconciliation } from './server/reconciliation';
import { SecurityService, createRateLimiter as createAdaptiveLimiter } from './server/services/securityService';
import { performanceMiddleware } from './server/middleware/performance';
import { cacheMiddleware } from './server/middleware/cache';
import { timeoutMiddleware } from './server/middleware/timeout';
import { validateProductionConfig } from './server/config/production';
import { CloudinaryService } from './server/storage/cloudinary';
import { generateRobotsTxt } from './server/seo/robots';
import {
  generateSitemapIndexXml,
  generateAppsSitemapXml,
  generateGamesSitemapXml,
  generateCategoriesSitemapXml,
  generateBlogSitemapXml
} from './server/seo/sitemap';
import { sendError, ERROR_CODES } from './server/errors';

const app = express();
app.set('trust proxy', true);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

validateProductionConfig();

// ---------------------------------------------------------------------------
// Request/security middleware
// ---------------------------------------------------------------------------
app.use((req: any, res, next) => {
  const supplied = String(req.headers['x-request-id'] || '');
  const requestId = /^[A-Za-z0-9._:-]{1,100}$/.test(supplied)
    ? supplied
    : `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  const botCheck = SecurityService.detectBotOrScraper(req);
  if (botCheck.isBot) {
    SecurityService.recordSecurityEvent({
      type: 'BOT_DETECTED',
      severity: 'MEDIUM',
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'],
      requestId,
      endpoint: req.originalUrl || req.path,
      metadata: { reason: botCheck.reason }
    });

    return sendError(res, ERROR_CODES.FORBIDDEN, `Akses ditolak: ${botCheck.reason}`, 403);
  }

  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Resolve the real Auth.js session for protected routes.
// There is deliberately no x-user-email identity fallback here.
app.use(async (req: any, res, next) => {
  if (!req.path.startsWith('/api/')) return next();

  try {
    const session = await getSession(req, authConfig as any);
    if (session?.user?.email) {
      req.session = session;
      req.user = await resolveOrCreateFirestoreUser(
        session.user.email,
        session.user.name || session.user.email.split('@')[0],
        session.user.image || undefined
      );
    }
  } catch {
    // Protected routers perform their own authorization and will return 401.
  }

  next();
});

// ---------------------------------------------------------------------------
// Upload compatibility endpoints
// ---------------------------------------------------------------------------
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1
  }
});

function sha256(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function validateImageFile(file: Express.Multer.File) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
  return allowed.has(file.mimetype) && allowedExt.has(ext);
}

// This endpoint intentionally requires Cloudinary in production.
// Local disk fallback is not safe on ephemeral/serverless production storage.
app.post('/api/upload-image', memoryUpload.single('image') as any, async (req: any, res) => {
  try {
    if (!req.file) return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Tidak ada berkas gambar yang diunggah.', 400);
    if (!validateImageFile(req.file)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Format gambar tidak didukung.', 415);
    }

    const type = String(req.body?.type || 'upload');
    const result = await CloudinaryService.uploadImage(req.file.buffer, type);

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      secure_url: result.secure_url,
      cloudinary_public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      size: req.file.size
    });
  } catch (err: any) {
    console.error('[Image Upload]', err);
    return sendError(
      res,
      ERROR_CODES.INTERNAL_ERROR,
      isProduction ? 'Gagal mengunggah gambar.' : (err.message || 'Gagal mengunggah gambar.'),
      500
    );
  }
});

app.post('/api/delete-image', async (req: any, res) => {
  try {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!url) return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'URL gambar wajib disertakan.', 400);

    // Only allow deletion of assets owned by our Cloudinary account.
    if (!url.startsWith('https://res.cloudinary.com/')) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'URL gambar tidak valid.', 400);
    }

    const deleted = await CloudinaryService.deleteImage(url);
    return res.status(200).json({ success: deleted });
  } catch (err: any) {
    console.error('[Image Delete]', err);
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal menghapus gambar.', 500);
  }
});

// Legacy APK endpoints are kept only for development compatibility.
// Production APK uploads must use the authenticated Admin/Developer upload workflow
// and the configured persistent object storage.
app.post('/api/upload-apk', memoryUpload.single('apk') as any, async (req: any, res) => {
  if (isProduction) {
    return sendError(
      res,
      ERROR_CODES.INVALID_REQUEST,
      'Endpoint upload APK legacy dinonaktifkan di production. Gunakan alur upload aplikasi yang terautentikasi.',
      410
    );
  }

  try {
    if (!req.file) return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Tidak ada berkas APK yang diunggah.', 400);
    if (req.file.mimetype !== 'application/vnd.android.package-archive' && !req.file.originalname.toLowerCase().endsWith('.apk')) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Berkas harus berupa APK.', 415);
    }

    const digest = sha256(req.file.buffer);
    const uploadDir = path.join(process.cwd(), 'uploads', 'apks');
    fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `${digest}.apk`;
    fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);

    return res.status(200).json({
      success: true,
      url: `/uploads/apks/${filename}`,
      metadata: {
        fileSize: req.file.size,
        sha256: digest
      }
    });
  } catch (err: any) {
    console.error('[Legacy APK Upload]', err);
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal mengunggah APK.', 500);
  }
});

// APK analysis never invents package/version/signing data.
// A real APK parser is required for those fields, so this compatibility endpoint
// only returns cryptographically verifiable file metadata.
app.post('/api/analyze-apk', memoryUpload.single('apk') as any, (req: any, res) => {
  try {
    if (!req.file?.buffer?.length) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Tidak ada berkas APK yang dianalisis.', 400);
    }

    return res.status(200).json({
      fileSize: req.file.size,
      sha256: sha256(req.file.buffer)
    });
  } catch (err: any) {
    console.error('[APK Analyze]', err);
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal menganalisis APK.', 500);
  }
});

// ---------------------------------------------------------------------------
// Application routers. These are the single source of truth for API behavior.
// No second set of in-memory/mock CRUD endpoints is registered here.
// ---------------------------------------------------------------------------
app.use('/api', performanceMiddleware);
app.use('/api', timeoutMiddleware(30000));

app.use(seoRouter);
app.use(aiDiscoveryRouter);
app.use('/api/health', healthRouter);

app.use('/api/public', createAdaptiveLimiter('PUBLIC_APP_DETAIL'), cacheMiddleware(300), publicRouter);
app.use('/api/admin/intelligence', createAdaptiveLimiter('ADMIN'), adminIntelligenceRouter);
app.use('/api/admin', createAdaptiveLimiter('ADMIN'), adminRouter);
app.use('/api/developer/intelligence', createAdaptiveLimiter('ADMIN'), developerIntelligenceRouter);
app.use('/api/developer', createAdaptiveLimiter('DEVELOPER_UPLOAD'), developerRouter);
app.use('/api/internal', internalRouter);
app.use('/api/auth', createAdaptiveLimiter('AUTH'), authRouter);
app.use('/api/customer-service', customerServiceRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api', smartCollectionsRouter);

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------
app.get('/robots.txt', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(generateRobotsTxt(baseUrl));
});

app.get('/ads.txt', (req, res) => {
  const publisherId = process.env.ADSENSE_PUBLISHER_ID;
  if (!publisherId) return res.status(404).type('text/plain').send('');
  res.type('text/plain').send(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.type('application/xml').send(generateSitemapIndexXml(baseUrl));
});

app.get(['/sitemap-apps.xml', '/sitemaps/apps.xml'], async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.type('application/xml').send(await generateAppsSitemapXml(undefined, baseUrl));
  } catch {
    res.status(500).type('application/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    );
  }
});

app.get(['/sitemap-games.xml', '/sitemaps/games.xml'], async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.type('application/xml').send(await generateGamesSitemapXml(undefined, baseUrl));
  } catch {
    res.status(500).type('application/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    );
  }
});

app.get(['/sitemap-categories.xml', '/sitemaps/categories.xml'], (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.type('application/xml').send(generateCategoriesSitemapXml(undefined, baseUrl));
});

app.get(['/sitemap-blog.xml', '/sitemaps/blog.xml'], async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.type('application/xml').send(await generateBlogSitemapXml(undefined, baseUrl));
  } catch {
    res.status(500).type('application/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    );
  }
});

// ---------------------------------------------------------------------------
// API 404/error handlers
// ---------------------------------------------------------------------------
app.use('/api', (req, res) => {
  return sendError(res, ERROR_CODES.INVALID_REQUEST, 'Endpoint API tidak ditemukan.', 404);
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Server Error]', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    error: err?.message
  });

  if (res.headersSent) return next(err);

  return sendError(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    isProduction ? 'Terjadi kesalahan internal server.' : (err?.message || 'Terjadi kesalahan internal server.'),
    500
  );
});

// ---------------------------------------------------------------------------
// Frontend
// ---------------------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      index: 'index.html',
      maxAge: '1h'
    }));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mod Station] Server running on 0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[Mod Station] Fatal startup error:', error);
  process.exit(1);
});
