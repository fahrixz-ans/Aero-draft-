import { Router, Request, Response } from 'express';
import { askGeminiAssistant } from '../services/geminiAssistantService';

export const assistantRouter = Router();

/**
 * GET /api/assistant/status
 * Check if Gemini API is connected
 */
assistantRouter.get('/status', (req: Request, res: Response) => {
  const isConnected = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  return res.json({
    success: true,
    connected: isConnected,
    provider: 'Gemini API'
  });
});

/**
 * POST /api/assistant/chat
 * Gemini API Assistant for Pusat Bantuan & Mod Station feature discovery
 */
assistantRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const isConnected = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        code: 'API_NOT_CONNECTED',
        error: { message: 'Error. The API is not connected yet.' }
      });
    }

    const { message, conversationHistory = [], userName } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Pesan pertanyaan tidak boleh kosong.' }
      });
    }

    const sessionUser = (req as any).user || (req as any).session?.user;
    const resolvedName = sessionUser?.name || userName || 'Pengguna';

    const response = await askGeminiAssistant({
      userMessage: message.trim(),
      conversationHistory,
      userName: resolvedName
    });

    return res.json({
      success: true,
      ...response
    });
  } catch (err: any) {
    if (err.code === 'API_NOT_CONNECTED' || err.message?.includes('not connected')) {
      return res.status(400).json({
        success: false,
        code: 'API_NOT_CONNECTED',
        error: { message: 'Error. The API is not connected yet.' }
      });
    }
    console.error('[Assistant Route Error]', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Gagal memproses pertanyaan ke AI Assistant.' }
    });
  }
});
