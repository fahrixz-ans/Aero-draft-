import { Router, Request, Response } from 'express';
import { askGeminiAssistant } from '../services/geminiAssistantService';
import {
  searchKnowledgeBase,
  findSimilarActiveJob,
  executeAutoKnowledgeGeneration,
  seedInitialHelpArticlesIfEmpty
} from '../services/helpCenterIntelligenceService';
import { firestore } from '../repositories';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { isGeminiConfigured, GEMINI_MODEL, parseGeminiError } from '../lib/gemini';

export const assistantRouter = Router();

/**
 * GET /api/assistant/status
 * Check if Gemini API is configured and ready
 */
assistantRouter.get('/status', (req: Request, res: Response) => {
  const configured = isGeminiConfigured();
  return res.json({
    success: true,
    connected: configured,
    model: GEMINI_MODEL,
    provider: 'Gemini API'
  });
});

/**
 * POST /api/assistant/chat
 * Gemini API Assistant for Pusat Bantuan & Mod Station feature discovery
 */
assistantRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'GEMINI_API_KEY_MISSING',
          message: 'Gemini API key is not configured on the server.'
        }
      });
    }

    const { message, conversationHistory = [], userName } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Pesan pertanyaan tidak boleh kosong.'
        }
      });
    }

    const sessionUser = (req as any).user || (req as any).session?.user;
    const resolvedName = sessionUser?.name || userName || 'Pengguna';
    const userId = sessionUser?.uid || sessionUser?.id || 'anonymous';

    // 1. Search knowledge base in Firestore
    const queryStr = message.trim();
    const searchResult = await searchKnowledgeBase(queryStr);

    if (searchResult.article) {
      // If relevant article is found, use it to directly generate the response!
      console.log(`[Help Center AI] Relevant article found in knowledge base: "${searchResult.article.title}" (Confidence: ${searchResult.confidence})`);
      
      try {
        const response = await askGeminiAssistant({
          userMessage: queryStr,
          conversationHistory,
          userName: resolvedName,
          groundingArticle: searchResult.article
        });

        return res.json({
          success: true,
          answer: response.answer,
          articleId: searchResult.article.id,
          articleTitle: searchResult.article.title,
          articleSlug: searchResult.article.slug,
          suggestedTopics: response.suggestedTopics
        });
      } catch (err: any) {
        const parsed = parseGeminiError(err);
        console.error(`[AI] Assistant chat error for article: ${searchResult.article.id}`, parsed);
        return res.status(parsed.status).json({
          success: false,
          error: {
            code: parsed.code,
            message: parsed.message
          }
        });
      }
    }

    // 2. No relevant article found. Check for existing active background generation jobs.
    console.log('[Help Center AI] No relevant article found. Checking active similar jobs...');
    const duplicateJobId = await findSimilarActiveJob(queryStr);

    if (duplicateJobId) {
      console.log(`[Help Center AI] Found active duplicate job matching query: "${duplicateJobId}"`);
      return res.json({
        success: true,
        jobId: duplicateJobId,
        status: 'WAITING_ON_ACTIVE_JOB'
      });
    }

    // 3. Create a new background generation job
    const jobId = `job_ai_${crypto.randomUUID().replace(/-/g, '')}`;
    console.log(`[Help Center AI] Creating new knowledge generation job: "${jobId}"`);

    await firestore.collection('ai_jobs').doc(jobId).set({
      jobId,
      userId,
      status: 'QUEUED',
      progress: 0,
      currentStep: 'Mengantrekan tugas...',
      message: 'Pertanyaan Anda sedang diletakkan dalam antrean pembuatan artikel bantuan baru.',
      question: queryStr,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Run the background generation workflow asynchronously
    executeAutoKnowledgeGeneration(jobId, queryStr, userId).catch(err => {
      console.error('[Help Center AI] Async background job error:', err);
    });

    return res.json({
      success: true,
      jobId,
      status: 'GENERATION_STARTED'
    });

  } catch (err: any) {
    const parsed = parseGeminiError(err);
    console.error('[Assistant Route Error]', parsed);
    return res.status(parsed.status || 500).json({
      success: false,
      error: {
        code: parsed.code || 'INTERNAL_SERVER_ERROR',
        message: parsed.message || 'Gagal memproses pertanyaan ke AI Assistant.'
      }
    });
  }
});

