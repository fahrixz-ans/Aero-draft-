import { GoogleGenAI } from '@google/genai';
import { AppRepository } from '../repositories';
import { CSAction } from '../../src/types';

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
      console.warn('[Gemini CS] Failed to initialize GoogleGenAI client:', err);
    }
  }
  return geminiClient;
}

/**
 * Sensitive Data Sanitization & Redaction Layer
 */
export function sanitizeUserText(text: string): string {
  if (!text) return '';
  let sanitized = text;
  sanitized = sanitized.replace(/(sk-[a-zA-Z0-9_-]{20,})/gi, '[API_KEY_TERPROTEKSI]');
  sanitized = sanitized.replace(/(AIza[0-9A-Za-z-_]{35})/g, '[API_KEY_TERPROTEKSI]');
  sanitized = sanitized.replace(/(bearer\s+[a-zA-Z0-9_\-\.]{20,})/gi, '[TOKEN_TERPROTEKSI]');
  sanitized = sanitized.replace(/(eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,})/g, '[JWT_TERPROTEKSI]');
  sanitized = sanitized.replace(/(password|kata\s*sandi|passcode|pin|otp|kode\s*verifikasi)\s*[:=]?\s*([^\s,;]+)/gi, '$1: [DATA_SENSITIF_TERPROTEKSI]');
  sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[KARTU_TERPROTEKSI]');
  sanitized = sanitized.replace(/\b(cvv|cvc)\s*[:=]?\s*\d{3,4}\b/gi, '$1: [CVV_TERPROTEKSI]');
  return sanitized;
}

/**
 * Fetch real public catalog information from database
 */
export async function getRelevantAppCatalogContext(userQuery: string): Promise<string> {
  try {
    const appsResult = await AppRepository.findPublished({ pageSize: 50 });
    const allApps = appsResult?.data || [];
    if (!allApps || allApps.length === 0) {
      return 'Status Katalog: Saat ini katalog aplikasi sedang dalam sinkronisasi.';
    }

    const queryWords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const matchingApps = allApps.filter(app => {
      const name = (app.name || '').toLowerCase();
      const slug = (app.slug || '').toLowerCase();
      const pkg = (app.packageName || '').toLowerCase();
      return queryWords.some(word => name.includes(word) || slug.includes(word) || pkg.includes(word));
    }).slice(0, 3);

    if (matchingApps.length === 0) {
      return 'Informasi Database: Tidak ditemukan aplikasi spesifik yang cocok langsung dengan kata kunci dalam katalog Mod Station.';
    }

    const appSummaries = matchingApps.map(app => {
      return `- Nama: "${app.name}" (Slug: ${app.slug})\n  Versi: ${app.versionName || 'Terbaru'}\n  Ukuran: ${app.size || 'Bervariasi'}\n  Kategori: ${app.category || 'Aplikasi'}\n  Total Unduhan: ${app.downloads?.toLocaleString('id-ID') || 0}`;
    });

    return `Data Riil Aplikasi dari Database Mod Station:\n${appSummaries.join('\n\n')}`;
  } catch (err) {
    console.warn('[Gemini CS] Error fetching app catalog context:', err);
    return 'Data Katalog: Sistem database sedang memproses informasi.';
  }
}

/**
 * Detect human agent intent using natural language patterns
 */
export function checkHumanAgentIntent(text: string): boolean {
  const lower = text.toLowerCase().trim();
  
  if (
    lower.includes('apa tugas cs') || 
    lower.includes('apa itu customer service') || 
    lower.includes('jam operasional cs') || 
    lower.includes('siapa cs') ||
    lower.includes('bagaimana cs bekerja')
  ) {
    return false;
  }

  const agentKeywords = [
    'chat sama cs', 'chat dengan cs', 'bicara dengan cs', 'ngomong sama cs',
    'mau chat admin', 'hubungi admin', 'bicara dengan manusia', 'agen manusia',
    'panggil cs', 'sambungkan ke cs', 'hubungkan ke cs', 'minta admin',
    'butuh admin', 'ada admin', 'bisa bicara dengan orang', 'live agent',
    'customer service manusia', 'operator manusia', 'bicara dengan staf'
  ];

  return agentKeywords.some(kw => lower.includes(kw));
}

export interface GeminiCSResponse {
  message: string;
  actions: CSAction[];
  suggestedState?: 'REQUESTING_AGENT' | 'AI_CHAT';
}

/**
 * Generate intelligent customer service response using Google Gemini API
 */
export async function generateGeminiCSResponse(params: {
  userMessage: string;
  conversationHistory: Array<{ senderType: string; message: string }>;
  userName?: string;
  userEmail?: string;
}): Promise<GeminiCSResponse> {
  const { userMessage, conversationHistory, userName = 'Pengguna' } = params;
  const sanitizedInput = sanitizeUserText(userMessage);

  const catalogContext = await getRelevantAppCatalogContext(sanitizedInput);
  const wantsHumanAgent = checkHumanAgentIntent(sanitizedInput);

  const systemInstruction = `Kamu adalah "Famo", AI Customer Service resmi dari Mod Station (platform distribusi aplikasi & game Android resmi dan modifikasi terverifikasi).
Pedoman & Aturan:
1. Bersikaplah ramah, solutif, sopan, dan profesional dalam Bahasa Indonesia yang natural. Sapa pengguna dengan hangat (${userName}).
2. Pengetahuan Mod Station:
   - Mod Station menyediakan berkas APK resmi dan versi modifikasi (MOD) yang aman dan terverifikasi.
   - Pengguna perlu mengaktifkan izin "Instal dari Sumber Tidak Dikenal" (Unknown Sources) pada smartphone Android jika memasang APK langsung.
3. Kepatuhan Data:
   - Gunakan data aplikasi riil berikut:
   ${catalogContext}
   - JANGAN mengarang status aplikasi jika tidak tersedia di data. Jika tidak tersedia, sampaikan secara sopan.
4. Permintaan Agen Manusia:
   - Jika pengguna ingin berbicara dengan CS / Admin manusia (misal: "chat sama cs", "mau bicara dengan staf", "hubungkan ke agen"), tawarkan bantuan dan berikan action "REQUEST_HUMAN_AGENT" dengan label "Chat Dengan CS Mod Station".
5. Format Response:
   Kamu WAJIB merespons HANYA dalam format JSON valid tanpa markdown formatting tambahan atau pembungkus codeblock lain:
   {
     "message": "isi teks balasan ramah dalam bahasa Indonesia",
     "actions": [
       { "type": "OPEN_APP" | "OPEN_GAME" | "OPEN_HELP" | "OPEN_FAQ" | "OPEN_CUSTOMER_SERVICE" | "OPEN_REPORT_HISTORY" | "REQUEST_HUMAN_AGENT", "label": "Teks Tombol", "targetId": "opsional_id" }
     ]
   }`;

  const ai = getGeminiClient();

  if (ai) {
    try {
      const formattedHistory = conversationHistory.slice(-6).map(msg => 
        `${msg.senderType === 'USER' ? 'Pengguna' : 'Famo CS'}: ${sanitizeUserText(msg.message)}`
      ).join('\n');

      const prompt = `${systemInstruction}

Riwayat Percakapan:
${formattedHistory}

Pesan Pengguna Saat Ini:
${sanitizedInput}

Keluaran JSON:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt
      });

      const rawText = response.text ? response.text.trim() : '';
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

      const parsed = JSON.parse(cleanJson);
      return {
        message: parsed.message || 'Halo kak, ada yang bisa kami bantu seputar aplikasi di Mod Station?',
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        suggestedState: wantsHumanAgent ? 'REQUESTING_AGENT' : 'AI_CHAT'
      };
    } catch (apiErr) {
      console.warn('[Gemini CS] Gemini API call error, falling back to rule-based response:', apiErr);
    }
  }

  // Fallback Rule-based engine
  if (wantsHumanAgent) {
    return {
      message: `Tentu kak ${userName}, saya dapat menghubungkan kakak ke Customer Service staf kami. Silakan klik tombol di bawah untuk masuk ke antrean langsung ya.`,
      actions: [
        { type: 'REQUEST_HUMAN_AGENT', label: 'Hubungkan ke CS Manusia' }
      ],
      suggestedState: 'REQUESTING_AGENT'
    };
  }

  const lower = sanitizedInput.toLowerCase();
  if (lower.includes('cara install') || lower.includes('cara pasang') || lower.includes('unknown source')) {
    return {
      message: `Untuk memasang APK di Mod Station:\n1. Unduh berkas APK aplikasi yang diinginkan.\n2. Buka Pengaturan HP > Keamanan > Aktifkan "Instal aplikasi dari sumber tidak dikenal".\n3. Buka File Manager > Unduhan > Klik file APK lalu pilih "Instal".`,
      actions: [
        { type: 'OPEN_HELP', label: 'Buka Panduan Instalasi' }
      ]
    };
  }

  return {
    message: `Halo kak ${userName}! Saya Famo AI Customer Service dari Mod Station. Ada yang bisa kami bantu terkait pencarian aplikasi, download APK, atau kendala lainnya?`,
    actions: [
      { type: 'OPEN_FAQ', label: 'Lihat FAQ & Bantuan' }
    ]
  };
}
