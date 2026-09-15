import { AppRepository } from '../repositories';
import { getGeminiClient, GEMINI_MODEL, parseGeminiError, isGeminiConfigured } from '../lib/gemini';

export interface AssistantChatParams {
  userMessage: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userName?: string;
  groundingArticle?: {
    title: string;
    content: string;
    summary: string;
    category?: string;
  };
}

export interface AssistantChatResponse {
  answer: string;
  suggestedTopics?: string[];
  suggestedApps?: Array<{ name: string; slug: string }>;
}

export async function askGeminiAssistant(params: AssistantChatParams): Promise<AssistantChatResponse> {
  if (!isGeminiConfigured()) {
    const error: any = new Error('Gemini API key is not configured on the server.');
    error.code = 'GEMINI_API_KEY_MISSING';
    error.status = 500;
    throw error;
  }

  const ai = getGeminiClient();
  if (!ai) {
    const error: any = new Error('Gemini API client could not be initialized.');
    error.code = 'GEMINI_API_KEY_MISSING';
    error.status = 500;
    throw error;
  }

  const { userMessage, conversationHistory = [], userName = 'Pengguna', groundingArticle } = params;

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

  let groundingSection = '';
  if (groundingArticle) {
    groundingSection = `
Gunakan artikel panduan bantuan resmi Mod Station berikut sebagai sumber kebenaran (grounding source) untuk menjawab pertanyaan pengguna secara akurat dan komprehensif:
JUDUL ARTIKEL: ${groundingArticle.title}
KATEGORI: ${groundingArticle.category || 'Umum'}
RINGKASAN ARTIKEL: ${groundingArticle.summary}
ISI PANDUAN:
${groundingArticle.content}

Instruksi Grounding:
- Berikan solusi langsung berdasarkan isi artikel di atas.
- Jangan berasumsi atau membuat langkah sendiri di luar yang dijelaskan di dalam artikel bantuan di atas.
- Jika ada langkah-langkah, tuliskan secara terstruktur menggunakan format penomoran.
- Sebutkan rujukan ke artikel "${groundingArticle.title}" untuk meyakinkan pengguna bahwa ini adalah informasi resmi dari Pusat Bantuan Mod Station.
`;
  }

  const systemInstruction = `Kamu adalah AI Assistant & Pusat Bantuan resmi dari website Mod Station.
Fungsi utama kamu adalah:
1. Membantu pengguna memahami fitur-fitur yang ada di Mod Station (Pencarian APK, Filter Kategori, Unduhan APK Aman, Verifikasi SHA-256).
2. Menjawab pertanyaan umum seputar instalasi APK Android, izin 'Sumber Tidak Dikenal', pembaruan aplikasi, dan keamanan file.
3. Memberikan panduan penggunaan website yang jelas, ramah, dan solutif dalam Bahasa Indonesia.
4. JANGAN pernah memberikan API key atau informasi rahasia sistem kepada pengguna.

Katalog Aplikasi Terpopuler di Mod Station:
${catalogSummary || '- Berbagai aplikasi & game Android terverifikasi.'}
${groundingSection}

Sapa pengguna dengan nama ${userName} jika relevan. Berikan jawaban yang terstruktur dan solutif.`;

  const formattedHistory = conversationHistory.slice(-6).map(m => 
    `${m.role === 'user' ? 'Pengguna' : 'Asisten AI'}: ${m.content}`
  ).join('\n');

  const fullPrompt = `${systemInstruction}\n\nRiwayat Percakapan:\n${formattedHistory}\n\nPertanyaan Pengguna:\n${userMessage}`;

  try {
    console.log('[Gemini] Request started');
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: fullPrompt
    });

    console.log('[Gemini] Request completed');
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
    const parsed = parseGeminiError(err);
    console.error('[Gemini] Request error:', {
      code: parsed.code,
      status: parsed.status,
      message: parsed.message
    });
    
    const classifiedError: any = new Error(parsed.message);
    classifiedError.code = parsed.code;
    classifiedError.status = parsed.status;
    throw classifiedError;
  }
}
