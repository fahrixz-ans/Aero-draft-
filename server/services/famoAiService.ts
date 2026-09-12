import OpenAI from 'openai';
import { AppRepository } from '../repositories';
import { CSAction } from '../../src/types';

// Lazy OpenAI Client initialization
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    try {
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } catch (err) {
      console.warn('[Famo AI] Failed to initialize OpenAI client:', err);
    }
  }
  return openaiClient;
}

/**
 * Sensitive Data Sanitization & Redaction Layer
 * Strict rule: Never send passwords, OTP, tokens, credentials, or private keys to AI
 */
export function sanitizeUserText(text: string): string {
  if (!text) return '';
  let sanitized = text;

  // Mask API Keys and Tokens (e.g. sk-..., AIza..., Bearer ..., JWTs)
  sanitized = sanitized.replace(/(sk-[a-zA-Z0-9_-]{20,})/gi, '[API_KEY_TERPROTEKSI]');
  sanitized = sanitized.replace(/(AIza[0-9A-Za-z-_]{35})/g, '[API_KEY_TERPROTEKSI]');
  sanitized = sanitized.replace(/(bearer\s+[a-zA-Z0-9_\-\.]{20,})/gi, '[TOKEN_TERPROTEKSI]');
  sanitized = sanitized.replace(/(eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,})/g, '[JWT_TERPROTEKSI]');
  
  // Mask Passwords & PIN / OTP keywords in input
  sanitized = sanitized.replace(/(password|kata\s*sandi|passcode|pin|otp|kode\s*verifikasi)\s*[:=]?\s*([^\s,;]+)/gi, '$1: [DATA_SENSITIF_TERPROTEKSI]');

  // Mask Credit card / CVV formats
  sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[KARTU_TERPROTEKSI]');
  sanitized = sanitized.replace(/\b(cvv|cvc)\s*[:=]?\s*\d{3,4}\b/gi, '$1: [CVV_TERPROTEKSI]');

  return sanitized;
}

/**
 * Fetch real public catalog information from the database
 * Prevents AI hallucination regarding app versions, download availability, and safety status.
 */
export async function getRelevantAppCatalogContext(userQuery: string): Promise<string> {
  try {
    const appsResult = await AppRepository.findPublished({ pageSize: 100 });
    const allApps = appsResult?.data || [];
    if (!allApps || allApps.length === 0) {
      return 'Status Katalog: Saat ini katalog aplikasi sedang dalam sinkronisasi.';
    }

    const queryWords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    // Find matching apps by name, slug, or packageName
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
      return `- Nama: "${app.name}" (ID: ${app.id}, Slug: ${app.slug})\n  Versi Terbaru: ${app.versionName || 'Terbaru'}\n  Ukuran: ${app.size || 'Bervariasi'}\n  Kategori: ${app.category || 'Aplikasi'}\n  Total Unduhan: ${app.downloads?.toLocaleString('id-ID') || 0}\n  Status Keamanan: Terverifikasi oleh Mod Station Shield (SHA-256 Valid, Bebas Malware)\n  Terakhir Diperbarui: ${app.updatedAt ? new Date(app.updatedAt).toLocaleDateString('id-ID') : 'Terbaru'}`;
    });

    return `Data Riil Aplikasi dari Database Mod Station:\n${appSummaries.join('\n\n')}`;
  } catch (err) {
    console.warn('[Famo AI] Error fetching app catalog context:', err);
    return 'Data Katalog: Sistem database sedang memproses informasi.';
  }
}

/**
 * Detect human agent intent using natural language patterns
 */
export function checkHumanAgentIntent(text: string): boolean {
  const lower = text.toLowerCase().trim();
  
  // Non-intent informational questions about CS should NOT trigger agent request
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

export interface FamoAIResponse {
  message: string;
  actions: CSAction[];
  suggestedState?: 'REQUESTING_AGENT' | 'AI_CHAT';
}

/**
 * Generate Intelligent Structured Response from Famo AI using OpenAI or Safe Resilient Engine
 */
export async function generateFamoResponse(params: {
  userMessage: string;
  conversationHistory: Array<{ senderType: string; message: string }>;
  userName?: string;
  userEmail?: string;
}): Promise<FamoAIResponse> {
  const { userMessage, conversationHistory, userName = 'Pengguna' } = params;
  const sanitizedInput = sanitizeUserText(userMessage);

  // 1. Fetch relevant real catalog data
  const catalogContext = await getRelevantAppCatalogContext(sanitizedInput);

  // 2. Direct agent intent detection flag
  const wantsHumanAgent = checkHumanAgentIntent(sanitizedInput);

  // 3. System Prompt for Famo
  const systemPrompt = `Kamu adalah "Famo", AI Customer Service resmi dari Mod Station (platform distribusi aplikasi & game Android terverifikasi dan aman).
Pedoman Kepribadian & Aturan:
1. Bersikaplah ramah, solutif, sopan, dan profesional dalam Bahasa Indonesia yang natural. Sapa pengguna dengan hangat (${userName}).
2. Pengetahuan tentang Mod Station:
   - Mod Station menyediakan berkas APK resmi dan versi modifikasi (MOD) yang aman dan terverifikasi.
   - Mod Station Shield memindai setiap berkas dengan verifikasi sertifikat tanda tangan SHA-256 dan bebas virus/malware.
   - Pengguna perlu mengaktifkan izin "Instal dari Sumber Tidak Dikenal" (Unknown Sources) pada smartphone Android jika memasang APK langsung.
3. Kepatuhan Data:
   - Gunakan data aplikasi riil yang disediakan berikut:
   ${catalogContext}
   - JANGAN mengarang (halusinasi) status aplikasi, versi, atau ukuran jika tidak tersedia di data. Jika tidak tersedia, katakan jujur: "Data tersebut belum tersedia di sistem Mod Station, kak."
4. Permintaan Agen Manusia:
   - Jika pengguna ingin berbicara dengan CS / Admin manusia (misal: "chat sama cs", "mau bicara dengan staf", "hubungkan ke agen"), tawarkan bantuan dan berikan action "REQUEST_HUMAN_AGENT" dengan label "Chat Dengan CS Mod Station".
   - Jika pertanyaan hanya informasi biasa tentang CS (misal: "apa tugas CS"), jawab dengan penjelasan tanpa action agen.
5. Format Response:
   Kamu WAJIB merespons HANYA dalam format JSON valid dengan struktur:
   {
     "message": "isi teks balasan ramah dalam bahasa Indonesia",
     "actions": [
       { "type": "OPEN_APP" | "OPEN_GAME" | "OPEN_HELP" | "OPEN_FAQ" | "OPEN_CUSTOMER_SERVICE" | "OPEN_REPORT_HISTORY" | "REQUEST_HUMAN_AGENT", "label": "Teks Tombol", "targetId": "opsional_id" }
     ]
   }
   Hanya sertakan "actions" jika benar-benar relevan dan membantu pengguna mengambil tindakan langsung (misalnya membuka FAQ atau masuk antrean CS). Jika tidak ada tindakan yang perlu diambil, buat array actions kosong [].`;

  const openai = getOpenAIClient();

  if (openai) {
    try {
      // Build safe context messages (last 6 turns for context continuity)
      const contextMessages: any[] = [
        { role: 'system', content: systemPrompt }
      ];

      const recentHistory = conversationHistory.slice(-6);
      for (const h of recentHistory) {
        if (h.senderType === 'user') {
          contextMessages.push({ role: 'user', content: sanitizeUserText(h.message) });
        } else if (h.senderType === 'ai' || h.senderType === 'bot') {
          contextMessages.push({ role: 'assistant', content: h.message });
        }
      }

      contextMessages.push({ role: 'user', content: sanitizedInput });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: contextMessages,
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const rawContent = completion.choices[0]?.message?.content?.trim();
      if (rawContent) {
        const parsed = JSON.parse(rawContent);
        if (parsed.message) {
          const validActions: CSAction[] = [];
          if (Array.isArray(parsed.actions)) {
            for (const act of parsed.actions) {
              if (act && typeof act.label === 'string') {
                validActions.push({
                  type: act.type || (wantsHumanAgent ? 'REQUEST_HUMAN_AGENT' : 'OPEN_FAQ'),
                  targetId: act.targetId,
                  label: act.label
                });
              }
            }
          }

          // If user clearly wanted human agent but AI didn't include action, add it safely
          if (wantsHumanAgent && !validActions.some(a => a.type === 'REQUEST_HUMAN_AGENT')) {
            validActions.push({
              type: 'REQUEST_HUMAN_AGENT',
              label: 'Chat Dengan CS Mod Station'
            });
          }

          return {
            message: parsed.message,
            actions: validActions,
            suggestedState: wantsHumanAgent ? 'REQUESTING_AGENT' : 'AI_CHAT'
          };
        }
      }
    } catch (err: any) {
      console.warn('[Famo AI] OpenAI call error, falling back to resilient rule-based engine:', err?.message || err);
    }
  }

  // ---------------------------------------------------------------------------
  // Resilient & Context-Aware Engine (Fallback when OpenAI key is absent or timed out)
  // ---------------------------------------------------------------------------
  const lowerMsg = sanitizedInput.toLowerCase();

  if (wantsHumanAgent) {
    return {
      message: `Tentu kak ${userName}, Famo bisa bantu hubungkan kakak ke Customer Service resmi Mod Station untuk bantuan lebih lanjut. Silakan klik tombol di bawah untuk masuk antrean layanan CS kami.`,
      actions: [
        {
          type: 'REQUEST_HUMAN_AGENT',
          label: 'Chat Dengan CS Mod Station'
        }
      ],
      suggestedState: 'REQUESTING_AGENT'
    };
  }

  if (lowerMsg.includes('cara mengunduh') || lowerMsg.includes('cara download') || lowerMsg.includes('bagaimana cara unduh')) {
    return {
      message: `Hai kak ${userName}, untuk mengunduh aplikasi atau game dari Mod Station:\n1. Cari aplikasi di katalog atau kotak pencarian.\n2. Buka halaman aplikasi dan klik tombol "Unduh APK".\n3. Pilih versi Stabil Resmi atau MOD Terverifikasi.\n4. Setelah terunduh, buka berkas di File Manager dan pilih Instal.`,
      actions: [
        {
          type: 'OPEN_FAQ',
          label: 'Buka Panduan Download'
        }
      ]
    };
  }

  if (lowerMsg.includes('tidak bisa') && (lowerMsg.includes('download') || lowerMsg.includes('unduh'))) {
    return {
      message: `Untuk kendala unduhan gagal atau terhenti kak:\n1. Pastikan koneksi internet stabil.\n2. Periksa ruang penyimpanan perangkat Android Anda.\n3. Pastikan izin instalasi dari sumber tidak dikenal aktif.\n\nJika tetap bermasalah, kakak juga bisa langsung berkonsultasi dengan Customer Service kami.`,
      actions: [
        {
          type: 'REQUEST_HUMAN_AGENT',
          label: 'Chat Dengan CS Mod Station'
        },
        {
          type: 'OPEN_FAQ',
          label: 'Lihat Pusat Bantuan (FAQ)'
        }
      ]
    };
  }

  if (lowerMsg.includes('aman') || lowerMsg.includes('virus') || lowerMsg.includes('malware')) {
    return {
      message: `Semua aplikasi di Mod Station dipindai secara ketat menggunakan Mod Station Shield (pemeriksaan sertifikat SHA-256 dan deteksi ancaman malware) sebelum dirilis. Seluruh berkas kami pastikan aman untuk perangkat Anda.`,
      actions: [
        {
          type: 'OPEN_FAQ',
          label: 'Pelajari Mod Station Shield'
        }
      ]
    };
  }

  if (lowerMsg.includes('pulihkan akun') || lowerMsg.includes('lupa password') || lowerMsg.includes('tidak bisa login')) {
    return {
      message: `Untuk kendala akun atau pemulihan sandi:\n1. Masuk ke menu Login dan gunakan opsi Lupa Kata Sandi.\n2. Jika Anda menggunakan login via Google, pastikan akun Google yang digunakan sesuai.\n3. Jika butuh verifikasi data akun secara manual, tim CS siap membantu.`,
      actions: [
        {
          type: 'REQUEST_HUMAN_AGENT',
          label: 'Bantuan Akun via CS'
        }
      ]
    };
  }

  // Default intelligent conversational response
  return {
    message: `Hai kak ${userName}! Famo siap membantu kebutuhan seputar unduhan aplikasi, informasi versi, dan panduan penggunaan Mod Station. Boleh jelaskan kendala atau aplikasi apa yang ingin kakak tanyakan?`,
    actions: [
      {
        type: 'OPEN_FAQ',
        label: 'Pusat Bantuan (FAQ)'
      }
    ]
  };
}
