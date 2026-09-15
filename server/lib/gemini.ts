import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-3.8-flash';

export interface GeminiErrorInfo {
  code: string;
  status: number;
  message: string;
}

/**
 * Retrieve the Gemini API key strictly from the server environment
 * Follows a clean precedence order:
 * process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY
 */
export function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    return undefined;
  }
  return key.trim();
}

/**
 * Check if the Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey();
}

let geminiClientInstance: GoogleGenAI | null = null;
let lastKeyUsed: string | null = null;

/**
 * Get or initialize the centralized GoogleGenAI client singleton
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.log('[Gemini] API key configured: false');
    geminiClientInstance = null;
    return null;
  }

  // Reinitialize if key has changed during runtime
  if (!geminiClientInstance || lastKeyUsed !== apiKey) {
    try {
      geminiClientInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      lastKeyUsed = apiKey;
      console.log('[Gemini] SDK initialized: true');
      console.log('[Gemini] API key configured: true');
      console.log(`[Gemini] Model: ${GEMINI_MODEL}`);
    } catch (err: any) {
      console.error('[Gemini] Failed to initialize GoogleGenAI SDK client:', err?.message || err);
      geminiClientInstance = null;
      return null;
    }
  }

  return geminiClientInstance;
}

// Startup diagnostic check (Safe: never prints key)
(() => {
  const configured = isGeminiConfigured();
  console.log(`[Gemini] API key configured: ${configured}`);
  if (configured) {
    console.log('[Gemini] SDK initialized: true');
    console.log(`[Gemini] Model: ${GEMINI_MODEL}`);
  }
})();

/**
 * Normalizes and categorizes errors from Gemini API requests into clean, structured responses
 * Ensures raw internal Google stack traces or token authentication details are never exposed.
 */
export function parseGeminiError(err: any): GeminiErrorInfo {
  const errMsg = String(err?.message || err || '');
  const status = err?.status || err?.statusCode || 500;
  const lower = errMsg.toLowerCase();

  // 401: Unauthorized / Invalid Authentication Credentials / ACCESS_TOKEN_TYPE_UNSUPPORTED
  if (
    status === 401 ||
    lower.includes('401') ||
    lower.includes('unauthenticated') ||
    lower.includes('invalid authentication credentials') ||
    lower.includes('access_token_type_unsupported') ||
    lower.includes('oauth 2 access token')
  ) {
    return {
      code: 'GEMINI_AUTHENTICATION_FAILED',
      status: 401,
      message: 'Gemini authentication failed.'
    };
  }

  // 403: Permission Denied / Service Disabled
  if (
    status === 403 ||
    lower.includes('403') ||
    lower.includes('permission_denied') ||
    lower.includes('service_disabled') ||
    lower.includes('has not been used')
  ) {
    return {
      code: 'GEMINI_PERMISSION_DENIED',
      status: 403,
      message: 'Akses Gemini API ditolak atau layanan belum diaktifkan pada proyek cloud.'
    };
  }

  // 404: Model Not Found
  if (
    status === 404 ||
    lower.includes('404') ||
    lower.includes('not_found') ||
    (lower.includes('model') && lower.includes('not found'))
  ) {
    return {
      code: 'GEMINI_MODEL_NOT_FOUND',
      status: 404,
      message: `Model Gemini (${GEMINI_MODEL}) tidak ditemukan atau tidak tersedia.`
    };
  }

  // 429: Rate Limit / Quota Exceeded
  if (
    status === 429 ||
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota')
  ) {
    return {
      code: 'GEMINI_RATE_LIMITED',
      status: 429,
      message: 'Batas kuota Gemini API tercapai. Silakan coba lagi beberapa saat lagi.'
    };
  }

  // 503 / 500: Server unavailable / internal error
  if (
    status === 503 ||
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('overloaded')
  ) {
    return {
      code: 'GEMINI_SERVICE_UNAVAILABLE',
      status: 503,
      message: 'Layanan Gemini AI sedang sibuk atau mengalami pemeliharaan. Silakan coba beberapa saat lagi.'
    };
  }

  return {
    code: 'GEMINI_GENERATION_ERROR',
    status: 500,
    message: 'Terjadi kendala saat berkomunikasi dengan asisten AI.'
  };
}
