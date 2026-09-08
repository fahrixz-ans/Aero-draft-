import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const API_BASE_URL = 'https://www.dosyaupload.com/api/v2';
const SIMULATION_DIR = path.join(process.cwd(), 'uploads', 'dosya_storage');

// Auth cache
let cachedToken: string | null = null;
let cachedAccountId: string | null = null;
let cacheExpiresAt: number = 0;

/**
 * Get API credentials from DOSYA_API_KEY.
 * Can be a single API key or key1:key2.
 */
function getCredentials() {
  const apiKey = process.env.DOSYA_API_KEY || '';
  if (!apiKey) {
    return null;
  }
  if (apiKey.includes(':')) {
    const [key1, key2] = apiKey.split(':');
    return { key1, key2 };
  }
  if (apiKey.includes(',')) {
    const [key1, key2] = apiKey.split(',');
    return { key1, key2 };
  }
  // Fallback: use same key for both
  return { key1: apiKey, key2: apiKey };
}

/**
 * Authenticate with dosyaupload / dosya.dev API
 */
async function authorize(): Promise<{ accessToken: string; accountId: string } | null> {
  const creds = getCredentials();
  if (!creds) {
    console.warn('[Dosya] No DOSYA_API_KEY configured. Running in simulation mode.');
    return null;
  }

  // Check cache
  if (cachedToken && cachedAccountId && Date.now() < cacheExpiresAt) {
    return { accessToken: cachedToken, accountId: cachedAccountId };
  }

  try {
    console.log('[Dosya] Attempting to authorize with dosyaupload API...');
    const response = await fetch(`${API_BASE_URL}/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key1: creds.key1,
        key2: creds.key2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Dosya] Authorization failed with status ${response.status}: ${errorText}`);
      throw new Error(`Dosya authorization failed: ${response.status}`);
    }

    const data = (await response.json()) as any;
    if (data.status === 'success' || data.access_token) {
      cachedToken = data.access_token;
      cachedAccountId = data.account_id || 'default_account';
      // Token usually expires in 1 hour; cache for 50 minutes
      cacheExpiresAt = Date.now() + 50 * 60 * 1000;
      console.log('[Dosya] Authorization successful.');
      return { accessToken: cachedToken!, accountId: cachedAccountId! };
    } else {
      console.error('[Dosya] Authorization response invalid:', data);
      throw new Error(data.message || 'Invalid authorize response');
    }
  } catch (error) {
    console.error('[Dosya] Authorization exception:', error);
    // If real API fails but we have a key, we fall back to simulation to keep dev server functional, but raise warning
    console.warn('[Dosya] Falling back to local storage simulation due to API error.');
    return null;
  }
}

/**
 * Upload APK to dosya.dev
 */
export async function uploadAPK(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ fileId: string; downloadUrl: string }> {
  const auth = await authorize();

  if (!auth) {
    // Local storage simulation mode
    console.log('[Dosya] Simulating APK upload locally for:', fileName);
    if (!fs.existsSync(SIMULATION_DIR)) {
      fs.mkdirSync(SIMULATION_DIR, { recursive: true });
    }

    const fileId = `dosya_file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const localPath = path.join(SIMULATION_DIR, `${fileId}_${sanitizedName}`);
    fs.writeFileSync(localPath, fileBuffer);

    // Simulated download URL pointing to a public API endpoint in our backend
    const downloadUrl = `/api/public/dosya/download/${fileId}`;
    return { fileId, downloadUrl };
  }

  try {
    console.log(`[Dosya] Uploading APK to dosyaupload: ${fileName} (${fileBuffer.length} bytes)...`);
    
    // Construct multipart form data
    const formData = new FormData();
    formData.append('access_token', auth.accessToken);
    formData.append('account_id', auth.accountId);
    
    // Convert Buffer to Blob for standard fetch FormData compatibility
    const blob = new Blob([fileBuffer], { type: 'application/vnd.android.package-archive' });
    formData.append('upload_file', blob, fileName);

    const response = await fetch(`${API_BASE_URL}/file/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dosyaupload upload failed: ${response.status} - ${errorText}`);
    }

    const result = (await response.json()) as any;
    console.log('[Dosya] Upload response from dosyaupload:', result);

    // Accept multiple possible response structures to be robust
    const fileId = result.file_id || result.id || result.data?.file_id || result.data?.id;
    const downloadUrl = result.download_link || result.url || result.data?.download_link || result.data?.url || `https://www.dosyaupload.com/${fileId}`;

    if (!fileId) {
      throw new Error('Dosyaupload response did not contain a valid file identifier.');
    }

    return { fileId, downloadUrl };
  } catch (error: any) {
    console.error('[Dosya] Upload APK exception:', error);
    throw new Error(`Gagal mengunggah biner APK ke dosya.dev: ${error.message}`);
  }
}

/**
 * Get APK Binary Buffer by File ID
 */
export async function getAPK(fileId: string): Promise<Buffer> {
  // If simulated local file exists, return it
  if (fileId.startsWith('dosya_file_') || !process.env.DOSYA_API_KEY) {
    if (!fs.existsSync(SIMULATION_DIR)) {
      throw new Error('Simulasi storage kosong.');
    }
    const files = fs.readdirSync(SIMULATION_DIR);
    const matchedFile = files.find(f => f.startsWith(fileId));
    if (matchedFile) {
      return fs.readFileSync(path.join(SIMULATION_DIR, matchedFile));
    }
  }

  const auth = await authorize();
  if (!auth) {
    throw new Error('Dosya.dev authentication failed or key is missing.');
  }

  try {
    console.log(`[Dosya] Downloading file ${fileId} from dosyaupload...`);
    // First, fetch file info or direct download URL
    const infoResponse = await fetch(`${API_BASE_URL}/file/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: auth.accessToken,
        account_id: auth.accountId,
        file_id: fileId,
      }),
    });

    if (!infoResponse.ok) {
      throw new Error(`Gagal mendapatkan info berkas: ${infoResponse.status}`);
    }

    const info = (await infoResponse.json()) as any;
    const downloadUrl = info.download_link || info.url || info.data?.download_link || `https://www.dosyaupload.com/download/${fileId}`;

    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) {
      throw new Error(`Gagal mengunduh biner berkas dari dosyaupload: ${fileResponse.status}`);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.error(`[Dosya] Error getting APK ${fileId}:`, error);
    throw new Error(`Gagal mengambil berkas APK: ${error.message}`);
  }
}

/**
 * Delete APK by File ID
 */
export async function deleteAPK(fileId: string): Promise<void> {
  if (fileId.startsWith('dosya_file_') || !process.env.DOSYA_API_KEY) {
    console.log('[Dosya] Deleting simulated local file:', fileId);
    if (fs.existsSync(SIMULATION_DIR)) {
      const files = fs.readdirSync(SIMULATION_DIR);
      const matchedFile = files.find(f => f.startsWith(fileId));
      if (matchedFile) {
        fs.unlinkSync(path.join(SIMULATION_DIR, matchedFile));
      }
    }
    return;
  }

  const auth = await authorize();
  if (!auth) {
    return;
  }

  try {
    console.log(`[Dosya] Deleting file ${fileId} from dosyaupload...`);
    const response = await fetch(`${API_BASE_URL}/file/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: auth.accessToken,
        account_id: auth.accountId,
        file_id: fileId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Dosya] Delete file ${fileId} returned non-200:`, errorText);
    } else {
      console.log(`[Dosya] File ${fileId} deleted successfully.`);
    }
  } catch (error) {
    console.error(`[Dosya] Error deleting APK ${fileId}:`, error);
  }
}

/**
 * Get APK Metadata by File ID
 */
export async function getAPKMetadata(fileId: string): Promise<any> {
  if (fileId.startsWith('dosya_file_') || !process.env.DOSYA_API_KEY) {
    if (fs.existsSync(SIMULATION_DIR)) {
      const files = fs.readdirSync(SIMULATION_DIR);
      const matchedFile = files.find(f => f.startsWith(fileId));
      if (matchedFile) {
        const stats = fs.statSync(path.join(SIMULATION_DIR, matchedFile));
        return {
          file_id: fileId,
          name: matchedFile.replace(`${fileId}_`, ''),
          size: stats.size,
          created_at: stats.birthtime.toISOString(),
          status: 'success',
        };
      }
    }
    return null;
  }

  const auth = await authorize();
  if (!auth) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/file/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: auth.accessToken,
        account_id: auth.accountId,
        file_id: fileId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as any;
    return data.data || data;
  } catch (error) {
    console.error(`[Dosya] Error fetching metadata for file ${fileId}:`, error);
    return null;
  }
}

export const DosyaStorageService = {
  uploadAPK,
  getAPK,
  deleteAPK,
  getAPKMetadata,
};
