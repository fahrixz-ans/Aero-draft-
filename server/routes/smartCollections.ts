import { Router, Request, Response } from 'express';
import { sendSuccess, sendError, ERROR_CODES } from '../errors';
import { ServerCollectionGenerator, ServerSmartCollection } from '../services/smartCollections/collectionGenerator';
import { CollectionStateMachine } from '../services/smartCollections/collectionStateMachine';
import { CollectionRepository } from '../repositories';
import { requireAuth, requirePermission } from '../auth';
import crypto from 'crypto';

export const smartCollectionsRouter = Router();

const toPublicCollection = (value: any) => ({
  ...value,
  state: value.state || (value.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'),
  enabled: value.enabled !== false && value.status !== 'ARCHIVED',
});

async function getCollection(id: string) {
  return CollectionRepository.findById(id);
}

async function saveCollection(collection: ServerSmartCollection) {
  const existing = await CollectionRepository.findById(collection.id);
  const payload: any = {
    id: collection.id,
    title: collection.title,
    slug: collection.id,
    description: collection.description,
    status: collection.state === 'PUBLISHED' ? 'PUBLISHED' : collection.state === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT',
    visibility: collection.enabled ? 'PUBLIC' : 'PRIVATE',
    sortOrder: collection.priority,
    ...collection,
    updatedAt: collection.updatedAt,
  };

  if (existing) return CollectionRepository.update(collection.id, payload);
  return CollectionRepository.create(payload);
}

const generatedCollection = async (config: Partial<ServerSmartCollection>, context?: { query?: string; targetAppId?: string }) => {
  const id = config.id || `sc_${crypto.randomUUID()}`;
  return ServerCollectionGenerator.generate({ ...config, id }, context);
};

smartCollectionsRouter.get('/public/collections', async (_req: Request, res: Response) => {
  try {
    const collections = (await CollectionRepository.findAll())
      .map(toPublicCollection)
      .filter((c: any) => c.enabled && c.state === 'PUBLISHED')
      .sort((a: any, b: any) => Number(a.priority || a.sortOrder || 0) - Number(b.priority || b.sortOrder || 0));
    return sendSuccess(res, { collections });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal memuat koleksi.', 500);
  }
});

smartCollectionsRouter.get('/public/home/collections', async (_req: Request, res: Response) => {
  try {
    const collections = (await CollectionRepository.findAll())
      .map(toPublicCollection)
      .filter((c: any) => c.placement === 'HOME' && c.enabled && c.state === 'PUBLISHED')
      .sort((a: any, b: any) => Number(a.priority || a.sortOrder || 0) - Number(b.priority || b.sortOrder || 0));
    return sendSuccess(res, { collections });
  } catch {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal memuat koleksi beranda.', 500);
  }
});

smartCollectionsRouter.get('/public/collections/:collectionId', async (req: Request, res: Response) => {
  try {
    const col = await getCollection(req.params.collectionId);
    if (!col || !toPublicCollection(col).enabled || toPublicCollection(col).state !== 'PUBLISHED') {
      return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
    }
    return sendSuccess(res, { collection: col });
  } catch {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal memuat collection.', 500);
  }
});

smartCollectionsRouter.get('/public/search/:query/collections', async (req: Request, res: Response) => {
  try {
    const collection = await generatedCollection({
      title: 'Aplikasi Serupa',
      description: 'Aplikasi terkait dengan kata kunci pencarian.',
      type: 'CONTEXTUAL',
      source: 'SEARCH',
      placement: 'SEARCH',
      maxItems: 6,
    }, { query: req.params.query });
    return sendSuccess(res, { collections: [collection] });
  } catch {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal membuat rekomendasi pencarian.', 500);
  }
});

smartCollectionsRouter.get('/public/apps/:appId/collections', async (req: Request, res: Response) => {
  try {
    const collection = await generatedCollection({
      title: 'Aplikasi Serupa',
      description: 'Aplikasi alternatif dan terkait berdasarkan data katalog.',
      type: 'CONTEXTUAL',
      source: 'RECOMMENDATION',
      placement: 'APP_DETAIL',
      maxItems: 6,
    }, { targetAppId: req.params.appId });
    return sendSuccess(res, { collections: [collection] });
  } catch {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal membuat rekomendasi aplikasi.', 500);
  }
});

smartCollectionsRouter.get('/admin/smart-collections', requireAuth, requirePermission('COLLECTION_MANAGE'), async (_req, res) => {
  try {
    return sendSuccess(res, { collections: await CollectionRepository.findAll() });
  } catch {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal memuat smart collections.', 500);
  }
});

smartCollectionsRouter.post('/admin/smart-collections', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req, res) => {
  try {
    const { title, description, type, source, placement, priority, maxItems, diversityRules, editorialAppIds } = req.body;
    if (!title || !type) return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Title dan Type wajib diisi.', 400);

    const collection = await generatedCollection({
      title: String(title).trim(),
      description: typeof description === 'string' ? description : '',
      type,
      source: source || 'RANKING',
      placement: placement || 'HOME',
      priority: Number.isFinite(Number(priority)) ? Number(priority) : 1,
      maxItems: Number.isFinite(Number(maxItems)) ? Number(maxItems) : 8,
      diversityRules: diversityRules || { maxSameDeveloper: 2, maxSameCategory: 3 },
      editorialAppIds: Array.isArray(editorialAppIds) ? editorialAppIds : [],
      state: 'DRAFT',
      enabled: false,
    });
    const saved = await saveCollection(collection);
    return sendSuccess(res, { collection: saved }, 201);
  } catch {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal membuat smart collection.', 500);
  }
});

smartCollectionsRouter.get('/admin/smart-collections/:id', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req, res) => {
  const col = await getCollection(req.params.id);
  if (!col) return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
  return sendSuccess(res, { collection: col });
});

smartCollectionsRouter.post('/admin/smart-collections/:id/transition', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req, res) => {
  try {
    const col: any = await getCollection(req.params.id);
    if (!col) return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);

    const targetState = req.body?.targetState;
    if (!targetState) return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'targetState wajib diisi.', 400);

    CollectionStateMachine.validateTransition(col.state, targetState);
    const updated = await CollectionRepository.update(col.id, {
      state: targetState,
      enabled: targetState === 'PUBLISHED',
      status: targetState === 'PUBLISHED' ? 'PUBLISHED' : targetState === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT',
      visibility: targetState === 'PUBLISHED' ? 'PUBLIC' : 'PRIVATE',
    } as any);

    return sendSuccess(res, { collection: updated });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.VALIDATION_ERROR, err.message || 'Transisi collection tidak valid.', 400);
  }
});

smartCollectionsRouter.post('/admin/smart-collections/:id/regenerate', requireAuth, requirePermission('COLLECTION_MANAGE'), async (req, res) => {
  try {
    const col: any = await getCollection(req.params.id);
    if (!col) return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
    const regenerated = await generatedCollection(col);
    const saved = await saveCollection(regenerated);
    return sendSuccess(res, { collection: saved });
  } catch {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal regenerate collection.', 500);
  }
});

for (const [path, state, enabled] of [
  ['/publish', 'PUBLISHED', true],
  ['/disable', 'DISABLED', false],
] as const) {
  smartCollectionsRouter.post(`/admin/smart-collections/:id${path}`, requireAuth, requirePermission('COLLECTION_MANAGE'), async (req, res) => {
    try {
      const col: any = await getCollection(req.params.id);
      if (!col) return sendError(res, ERROR_CODES.COLLECTION_NOT_FOUND, 'Collection tidak ditemukan.', 404);
      const updated = await CollectionRepository.update(col.id, {
        state,
        enabled,
        status: state === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        visibility: enabled ? 'PUBLIC' : 'PRIVATE',
      } as any);
      return sendSuccess(res, { collection: updated });
    } catch {
      return sendError(res, ERROR_CODES.INTERNAL_ERROR, 'Gagal mengubah status collection.', 500);
    }
  });
}
