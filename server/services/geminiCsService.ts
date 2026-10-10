import { getGeminiClient, GEMINI_MODEL, isGeminiConfigured } from '../lib/gemini';
import { CSAction } from '../../src/types';

export interface GeminiCSParams {
  userMessage: string;
  conversationHistory?: any[];
  userName?: string;
  userEmail?: string;
  category?: string;
}

export interface GeminiCSResponse {
  message: string;
  actions: CSAction[];
  suggestedState?: 'REQUESTING_AGENT' | 'AI_CHAT';
  confidence?: number;
}

export async function generateGeminiCSResponse(params: GeminiCSParams): Promise<GeminiCSResponse> {
  const { userMessage, userName = 'Pengguna', category = 'general' } = params;

  if (!isGeminiConfigured()) {
    return {
      message: `Halo kak ${userName}, terima kasih telah menghubungi Mod Station Support. Kami telah mencatat laporan Anda mengenai kategori ${category}. Tim kami siap membantu kendala Anda.`,
      actions: [
        {
          type: 'OPEN_APP',
          label: 'Jelajahi Aplikasi',
        }
      ],
      suggestedState: 'AI_CHAT',
      confidence: 0.8,
    };
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Gemini client not initialized');
    }

    const systemInstruction = `Anda adalah Famo AI, asisten Customer Service pintar Mod Station (platform download APK Android resmi dan terverifikasi di Indonesia).
Bantu pengguna dengan ramah, jelas, solutif, dan akurat mengenai instalasi APK, verifikasi SHA-256, izin keamanan Android, atau kendala download. Gunakan Bahasa Indonesia yang sopan dan ramah.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    const reply = response.text || `Halo kak ${userName}, Famo AI Mod Station siap membantu Anda.`;

    return {
      message: reply,
      actions: [],
      suggestedState: 'AI_CHAT',
      confidence: 0.95,
    };
  } catch (err) {
    console.warn('[Gemini CS] Fallback response triggered:', err);
    return {
      message: `Halo kak ${userName}, kami telah menerima pertanyaan Anda. Tim spesialis APK Mod Station siap membantu.`,
      actions: [],
      suggestedState: 'AI_CHAT',
      confidence: 0.7,
    };
  }
}
