import { Router, Request, Response } from 'express';
import { sendSuccess, sendError, ERROR_CODES } from '../errors';
import { ServerCollectionGenerator, ServerSmartCollection } from '../services/smartCollections/collectionGenerator';
import { CollectionStateMachine } from '../services/smartCollections/collectionStateMachine';
import { requireAuth, requirePermission } from '../auth';

export const smartCollectionsRouter = Router();

// In-Memory storage for collections on the server
let serverCollectionsDb: ServerSmartCollection[] = [];

// Seed default Home collections
async function initializeDefaultCollections() {
  if (serverCollectionsDb.length > 0) return;

  const presets: Partial<ServerSmartCollection>[] = [
    {
      id: 'sc_home_popular',
      title: 'Populer Sekarang',
      description: 'Aplikasi terfavorit dengan reputasi ulasan dan total unduhan tertinggi.',
      type: 'POPULAR',
      source: 'ANALYTICS',
      placement: 'HOME',
      priority: 1,
      maxItems: 8
    },
    {
      id: 'sc_home_trending',
      title: 'Trending Minggu Ini',
      description: 'Aplikasi dengan momentum unduhan dan pencarian tertinggi.',
      type: 'TRENDING',
      source: 'RANKING',
      placement: 'HOME',
      priority: 2,
      maxItems: 8
    },
    {
      id: 'sc_home_new_releases',
      title: 'Baru Ditambahkan',
      description: 'Aplikasi terbaru yang baru dirilis di katalog terverifikasi.',
      type: 'FRESH',
      source: 'ANALYTICS',
      placement: 'HOME',
      priority: 3,
      maxItems: 8
    },
    {
      id: 'sc_home_editors_pick',
      title: 'Pilihan Editor',
      description: 'Koleksi kurasi dengan standar performa dan keamanan tertinggi.',
      type: 'EDITORIAL',
      source: 'EDITORIAL',
      placement: 'HOME',
      priority: 4,
      maxItems: 8
    }
  ];

  for (const p of presets) {
    try {
      const generated = await ServerCollectionGenerator.generate(p);
      serverCollectionsDb.push(generated);
    } catch (e) {
      console.warn('Failed to seed smart collection:', p.id, e);
    }
  }
}

initializeDefaultCollections().catch(console.error);

// ---------------------------------------------------------------------------
// 1. PUBLIC ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * GET /api/public/collections
 * List all published, enabled collections
 */
smartCollectionsRouter.get('/public/collections', async (req: Request, res: Response) => {
  try {
    const published = serverCollectionsDb
      .filter(c => c.enabled && c.state === 'PUBLISHED')
      .sort((a, b) => a.priority - b.priority);

    return sendSuccess(res, { collections: published });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/public/home/collections
 * Home shelves
 */
smartCollectionsRouter.get('/public/home/collections', async (req: Request, res: Response) => {
  try {
    await initializeDefaultCollections();

    const homeShelves = serverCollectionsDb
      .filter(c => c.placement === 'HOME' && c.enabled && c.state === 'PUBLISHED')
      .sort((a, b) => a.priority - b.priority);

    return sendSuccess(res, { collections: homeShelves });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/public/collections/:collectionId
 * Get specific collection
 */
smartCollectionsRouter.get('/public/collections/:collectionId', async (req: Request, res: Response) => {
  try {
    const { collectionId } = req.params;
    const col = serverCollectionsDb.find(c => c.id === collectionId);

    if (!col) {
      return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
    }

    if (!col.enabled || col.state === 'DISABLED') {
      return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection sedang dinonaktifkan.', 403);
    }

    return sendSuccess(res, { collection: col });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/public/search/:query/collections
 * Contextual collections for search query
 */
smartCollectionsRouter.get('/public/search/:query/collections', async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const similar = await ServerCollectionGenerator.generate({
      id: `sc_search_${encodeURIComponent(query)}`,
      title: 'Aplikasi Serupa',
      description: `Aplikasi terkait dengan kata kunci "${query}".`,
      type: 'CONTEXTUAL',
      source: 'SEARCH',
      placement: 'SEARCH',
      maxItems: 6
    }, { query });

    return sendSuccess(res, { collections: [similar] });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/public/apps/:appId/collections
 * Contextual collections for app detail view
 */
smartCollectionsRouter.get('/public/apps/:appId/collections', async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const related = await ServerCollectionGenerator.generate({
      id: `sc_detail_${appId}`,
      title: 'Aplikasi Serupa',
      description: 'Aplikasi alternatif dan terkait pilihan pengguna.',
      type: 'CONTEXTUAL',
      source: 'RECOMMENDATION',
      placement: 'APP_DETAIL',
      maxItems: 6
    }, { targetAppId: appId });

    return sendSuccess(res, { collections: [related] });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

// ---------------------------------------------------------------------------
// 2. ADMIN ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/smart-collections
 * List all smart collections for management
 */
smartCollectionsRouter.get('/admin/smart-collections', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req: Request, res: Response) => {
  try {
    await initializeDefaultCollections();
    return sendSuccess(res, { collections: serverCollectionsDb });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * POST /api/admin/smart-collections
 * Create new smart collection
 */
smartCollectionsRouter.post('/admin/smart-collections', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req: Request, res: Response) => {
  try {
    const { title, description, type, source, placement, priority, maxItems, diversityRules, editorialAppIds } = req.body;

    if (!title || !type) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Title dan Type wajib diisi.', 400);
    }

    const newCol = await ServerCollectionGenerator.generate({
      id: `sc_${Date.now()}`,
      title,
      description: description || '',
      type,
      source: source || 'RANKING',
      placement: placement || 'HOME',
      priority: Number(priority) || 1,
      maxItems: Number(maxItems) || 8,
      diversityRules: diversityRules || { maxSameDeveloper: 2, maxSameCategory: 3 },
      editorialAppIds: Array.isArray(editorialAppIds) ? editorialAppIds : []
    });

    serverCollectionsDb.push(newCol);
    return sendSuccess(res, { collection: newCol }, 201);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * GET /api/admin/smart-collections/:id
 */
smartCollectionsRouter.get('/admin/smart-collections/:id', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req: Request, res: Response) => {
  const col = serverCollectionsDb.find(c => c.id === req.params.id);
  if (!col) {
    return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
  }
  return sendSuccess(res, { collection: col });
});

/**
 * POST /api/admin/smart-collections/:id/transition
 * Transition collection state
 */
smartCollectionsRouter.post('/admin/smart-collections/:id/transition', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req: Request, res: Response) => {
  try {
    const col = serverCollectionsDb.find(c => c.id === req.params.id);
    if (!col) {
      return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
    }

    const { targetState } = req.body;
    if (!targetState) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'targetState wajib diisi.', 400);
    }

    try {
      CollectionStateMachine.validateTransition(col.state, targetState);
    } catch (valErr: any) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, valErr.message, 400);
    }

    col.state = targetState;
    if (targetState === 'PUBLISHED') col.enabled = true;
    if (targetState === 'DISABLED') col.enabled = false;
    col.updatedAt = new Date().toISOString();

    return sendSuccess(res, { collection: col });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * POST /api/admin/smart-collections/:id/regenerate
 * Re-run candidate generation and ranking pipeline
 */
smartCollectionsRouter.post('/admin/smart-collections/:id/regenerate', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req: Request, res: Response) => {
  try {
    const col = serverCollectionsDb.find(c => c.id === req.params.id);
    if (!col) {
      return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
    }

    const regenerated = await ServerCollectionGenerator.generate(col);
    const index = serverCollectionsDb.findIndex(c => c.id === req.params.id);
    serverCollectionsDb[index] = regenerated;

    return sendSuccess(res, { collection: regenerated });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message, 500);
  }
});

/**
 * POST /api/admin/smart-collections/:id/publish
 */
smartCollectionsRouter.post('/api/admin/smart-collections/:id/publish', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req: Request, res: Response) => {
  const col = serverCollectionsDb.find(c => c.id === req.params.id);
  if (!col) return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
  col.state = 'PUBLISHED';
  col.enabled = true;
  col.updatedAt = new Date().toISOString();
  return sendSuccess(res, { collection: col });
});

/**
 * POST /api/admin/smart-collections/:id/disable
 */
smartCollectionsRouter.post('/api/admin/smart-collections/:id/disable', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req: Request, res: Response) => {
  const col = serverCollectionsDb.find(c => c.id === req.params.id);
  if (!col) return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
  col.state = 'DISABLED';
  col.enabled = false;
  col.updatedAt = new Date().toISOString();
  return sendSuccess(res, { collection: col });
});
