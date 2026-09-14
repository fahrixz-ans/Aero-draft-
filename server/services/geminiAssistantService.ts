import { GoogleGenAI } from '@google/genai';
import { AppRepository } from '../repositories';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch (err) {
      console.warn('[Gemini Assistant] Failed to initialize GoogleGenAI client:', err);
    }
  }
  return geminiClient;
}

export interface AssistantChatParams {
  userMessage: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userName?: string;
}

export interface AssistantChatResponse {
  answer: string;
  suggestedTopics?: string[];
  suggestedApps?: Array<{ name: string; slug: string }>;
}

export async function askGeminiAssistant(params: AssistantChatParams): Promise<AssistantChatResponse> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim().length === 0) {
    const error: any = new Error('Error. The API is not connected yet.');
    error.code = 'API_NOT_CONNECTED';
    throw error;
  }

  const ai = getGeminiClient();
  if (!ai) {
    const error: any = new Error('Error. The API is not connected yet.');
    error.code = 'API_NOT_CONNECTED';
    throw error;
  }

  const { userMessage, conversationHistory = [], userName = 'Pengguna' } = params;

  // Retrieve app context for relevant answers
  let catalogSummary = '';
  try {
    const appsResult = await AppRepository.findPublished({ pageSize: 30 });
    const apps = appsResult?.data || [];
    if (apps.length > 0) {
      catalogSummary = apps.slice(0, 10).map(a => `- ${a.name} (Versi: ${a.versionName || '1.0'}, Kategori: ${a.category || 'Aplikasi'})`).join('\n');
    }
  } catch (err) {
    // ignore
  }

  const systemInstruction = `Kamu adalah AI Assistant & Pusat Bantuan resmi dari website Mod Station.
Fungsi utama kamu adalah:
1. Membantu pengguna memahami fitur-fitur yang ada di Mod Station (Pencarian APK, Filter Kategori, Unduhan APK Aman, Verifikasi SHA-256).
2. Menjawab pertanyaan umum seputar instalasi APK Android, izin 'Sumber Tidak Dikenal', pembaruan aplikasi, dan keamanan file.
3. Memberikan panduan penggunaan website yang jelas, ramah, dan solutif dalam Bahasa Indonesia.
4. JANGAN pernah memberikan API key atau informasi rahasia sistem kepada pengguna.

Katalog Aplikasi Terpopuler di Mod Station:
${catalogSummary || '- Berbagai aplikasi & game Android terverifikasi.'}

Sapa pengguna dengan nama ${userName} jika relevan. Berikan jawaban yang terstruktur dan solutif.`;

  const formattedHistory = conversationHistory.slice(-6).map(m => 
    `${m.role === 'user' ? 'Pengguna' : 'Asisten AI'}: ${m.content}`
  ).join('\n');

  const fullPrompt = `${systemInstruction}\n\nRiwayat Percakapan:\n${formattedHistory}\n\nPertanyaan Pengguna:\n${userMessage}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: fullPrompt
    });

    const answer = response.text ? response.text.trim() : 'Halo! Ada yang bisa saya bantu terkait fitur dan penggunaan Mod Station?';
    return {
      answer,
      suggestedTopics: [
        'Cara menginstal APK di Android',
        'Bagaimana keamanan aplikasi di Mod Station?',
        'Cara melaporkan kendala unduhan'
      ]
    };
  } catch (err: any) {
    console.error('[Gemini Assistant API Error]', err);
    throw err;
  }
}
