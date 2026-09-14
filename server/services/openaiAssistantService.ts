import OpenAI from 'openai';
import { AppRepository } from '../repositories';
import { askGeminiAssistant } from './geminiAssistantService';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    try {
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } catch (err) {
      console.warn('[OpenAI Assistant] Failed to initialize OpenAI client:', err);
    }
  }
  return openaiClient;
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

export async function askModStationAssistant(params: AssistantChatParams): Promise<AssistantChatResponse> {
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

  const systemPrompt = `Kamu adalah AI Assistant & Pusat Bantuan resmi dari website Mod Station.
Fungsi utama kamu adalah:
1. Membantu pengguna memahami fitur-fitur yang ada di Mod Station (Pencarian APK, Filter Kategori, Unduhan APK Aman, Verifikasi SHA-256).
2. Menjawab pertanyaan umum seputar instalasi APK Android, izin 'Sumber Tidak Dikenal', pembaruan aplikasi, dan keamanan file.
3. Memberikan panduan penggunaan website yang jelas, ramah, dan solutif dalam Bahasa Indonesia.
4. Jangan pernah memberikan API key atau informasi rahasia sistem kepada pengguna.

Katalog Aplikasi Terpopuler di Mod Station:
${catalogSummary || '- Berbagai aplikasi & game Android terverifikasi.'}

Sapa pengguna dengan nama ${userName} jika relevan. Berikan jawaban yang terstruktur dan mudah dibaca.`;

  const openai = getOpenAIClient();

  if (openai) {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 800
      });

      const answer = response.choices[0]?.message?.content || 'Halo! Ada yang bisa saya bantu terkait fitur dan penggunaan Mod Station?';
      return {
        answer,
        suggestedTopics: [
          'Cara menginstal APK di Android',
          'Bagaimana keamanan aplikasi di Mod Station?',
          'Cara melaporkan kendala unduhan'
        ]
      };
    } catch (err) {
      console.info('[OpenAI Assistant] OpenAI API unavailable (429/credits). Using Gemini Assistant fallback.');
    }
  }

  // Fallback to Gemini Assistant if GEMINI_API_KEY is configured
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    try {
      return await askGeminiAssistant({ userMessage, conversationHistory, userName });
    } catch (geminiErr) {
      console.info('[Gemini Assistant] Fallback to local knowledge base.');
    }
  }

  // Fallback response if OpenAI key is not configured or fails
  const lower = userMessage.toLowerCase();
  if (lower.includes('cara install') || lower.includes('cara pasang') || lower.includes('unknown sources')) {
    return {
      answer: `Halo kak ${userName}! Untuk menginstal berkas APK dari Mod Station:\n\n1. **Unduh File**: Klik tombol "Download APK" pada halaman aplikasi yang diinginkan.\n2. **Izinkan Instalasi**: Masuk ke Pengaturan HP > Keamanan / Privasi > Aktifkan "Instal dari Sumber Tidak Dikenal" untuk browser/file manager Anda.\n3. **Pasang Aplikasi**: Buka file yang selesai diunduh lalu tekan tombol "Instal".\n4. **Selesai**: Aplikasi siap digunakan!`,
      suggestedTopics: ['Keamanan file APK', 'Mengatasi gagal download']
    };
  }

  if (lower.includes('aman') || lower.includes('virus') || lower.includes('malware') || lower.includes('keamanan')) {
    return {
      answer: `Semua aplikasi di Mod Station melalui verifikasi berkas dan pengecekan sidik jari SHA-256 untuk memastikan file asli, utuh, dan bebas dari malware sebelum dipublikasikan.`,
      suggestedTopics: ['Cara cek versi APK', 'Cara instalasi APK']
    };
  }

  return {
    answer: `Halo kak ${userName}! Saya adalah AI Assistant Mod Station. Saya dapat membantu menjawab pertanyaan seputar fitur website, panduan instalasi APK, pencarian kategori aplikasi, dan tips keamanan Android. Apa yang ingin kakak ketahui?`,
    suggestedTopics: [
      'Panduan instalasi APK',
      'Keamanan di Mod Station',
      'Cara memperbarui aplikasi'
    ]
  };
}
