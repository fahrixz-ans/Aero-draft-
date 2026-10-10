export type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'unverified';

export interface ValidationResult {
  status: ValidationStatus;
  message: string;
}

/**
 * Validates app download or image URL with responsive status feedback.
 */
export async function validateAppUrl(url: string, type: 'apk' | 'image' | 'general' = 'general'): Promise<ValidationResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    return { status: 'invalid', message: 'URL tidak boleh kosong.' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { status: 'invalid', message: 'Protokol URL harus menggunakan HTTP atau HTTPS.' };
    }

    if (trimmed.toLowerCase().includes('javascript:') || trimmed.toLowerCase().includes('data:')) {
      return { status: 'invalid', message: 'Protokol tidak diizinkan.' };
    }

    if (type === 'image' && typeof window !== 'undefined') {
      return new Promise((resolve) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          resolve({ status: 'valid', message: 'URL format valid (pemeriksaan gambar timeout).' });
        }, 4000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve({ status: 'valid', message: 'URL gambar valid dan dapat dimuat.' });
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve({ status: 'invalid', message: 'Gagal memuat gambar dari URL tersebut.' });
        };

        img.src = trimmed;
      });
    }

    if (type === 'apk') {
      const lower = trimmed.toLowerCase();
      if (!lower.endsWith('.apk') && !lower.includes('.apk?') && !lower.includes('download') && !lower.includes('apk') && !lower.includes('github') && !lower.includes('drive')) {
        return { status: 'unverified', message: 'URL valid secara format, tetapi ekstensi .apk tidak terdeteksi secara eksplisit.' };
      }
    }

    return { status: 'valid', message: 'URL valid dan terverifikasi.' };
  } catch (err) {
    return { status: 'invalid', message: 'Format URL tidak valid atau salah.' };
  }
}
