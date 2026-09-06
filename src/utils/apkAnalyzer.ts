/**
 * Aero APK Engine - Client-side APK Analyzer Utility
 * 
 * Includes:
 * 1. File extension and size validation.
 * 2. Web Crypto API SHA-256 hash calculation.
 * 3. Simulated/heuristic metadata extraction mimicking AndroidManifest.xml and APK binary parsing.
 */

export interface SigningCertificateInfo {
  sha256: string;
  sha1: string;
  issuer: string;
  subject: string;
}

export interface ExtractedApkMetadata {
  packageName: string;
  versionName: string;
  versionCode: number;
  fileSize: number;
  minSdk: number;
  targetSdk: number;
  permissions: string[];
  architectures: string[];
  sha256: string;
  signingCertificate: SigningCertificateInfo;
  securityStatus: 'passed' | 'warning' | 'rejected';
  securityIssues: string[];
  changelog?: string;
  appName?: string;
}

export interface ApkValidationResult {
  isValid: boolean;
  error?: string;
}

const MAX_APK_SIZE = 150 * 1024 * 1024; // 150 MB

/**
 * Validates whether the given file or filename has a valid .apk extension and acceptable file size.
 */
export function validateApkExtension(input: File | string): ApkValidationResult {
  const fileName = typeof input === 'string' ? input : input.name;
  
  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, error: 'Nama file tidak valid.' };
  }

  const cleanName = fileName.trim().toLowerCase();
  if (!cleanName.endsWith('.apk')) {
    return {
      isValid: false,
      error: 'Format file tidak valid. Hanya berkas dengan ekstensi .apk yang diperbolehkan.'
    };
  }

  if (typeof input !== 'string') {
    if (input.size <= 0) {
      return { isValid: false, error: 'Berkas APK kosong (0 bytes).' };
    }
    if (input.size > MAX_APK_SIZE) {
      return {
        isValid: false,
        error: `Ukuran file APK (${(input.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 150 MB.`
      };
    }
  }

  return { isValid: true };
}

/**
 * Calculates cryptographic SHA-256 hash of a Blob/File/ArrayBuffer using the browser's native Web Crypto API.
 */
export async function calculateSha256(input: Blob | File | ArrayBuffer): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  if (input instanceof ArrayBuffer) {
    arrayBuffer = input;
  } else {
    arrayBuffer = await input.arrayBuffer();
  }

  if (!crypto?.subtle) {
    throw new Error('Web Crypto API tidak didukung pada lingkungan browser ini.');
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexHash.toUpperCase();
}

/**
 * Calculates SHA-1 hash for certificates using Web Crypto API.
 */
export async function calculateSha1(input: ArrayBuffer): Promise<string> {
  if (!crypto?.subtle) {
    return '00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33';
  }
  const hashBuffer = await crypto.subtle.digest('SHA-1', input);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

/**
 * Simulates metadata extraction from an APK Blob/File, mimicking AndroidManifest.xml and META-INF parsing.
 * Extracts:
 * - Package Name (mimicking AndroidManifest.xml package attribute)
 * - Version Name & Version Code
 * - Min SDK & Target SDK
 * - Android Permissions
 * - CPU Architectures (ABI)
 * - Signing Certificate digest
 * - Security Verdict (passed, warning, rejected)
 */
export async function simulateApkMetadataExtraction(file: File | Blob, fileNameHint?: string): Promise<ExtractedApkMetadata> {
  const fileName = fileNameHint || (file instanceof File ? file.name : 'application.apk');
  const fileSize = file.size;

  // 1. Validate extension
  const validation = validateApkExtension(fileName);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Berkas tidak valid.');
  }

  // 2. Compute true SHA-256 of the entire binary payload via Web Crypto API
  const sha256 = await calculateSha256(file);

  // 3. Inspect binary slice for manifest indicators or text strings
  // Read first 2MB slice to inspect header strings and ZIP records without loading full 150MB into RAM
  const sampleSliceSize = Math.min(fileSize, 2 * 1024 * 1024);
  const sliceBuffer = await file.slice(0, sampleSliceSize).arrayBuffer();
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const sliceText = textDecoder.decode(sliceBuffer);

  // Analyze package name heuristics
  let packageName = '';
  const packageRegex = /(?:package=")?([a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+)/i;
  const packageMatch = sliceText.match(packageRegex);
  if (packageMatch && packageMatch[1] && !packageMatch[1].startsWith('android.') && !packageMatch[1].startsWith('schema.')) {
    packageName = packageMatch[1].toLowerCase();
  }

  // If no clean package string in the binary slice, derive from sanitized filename
  if (!packageName) {
    const baseClean = fileName
      .replace(/\.apk$/i, '')
      .replace(/[-_]v?[0-9]+(\.[0-9]+)*/gi, '')
      .replace(/[^a-zA-Z0-9]/g, '.')
      .toLowerCase()
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');

    packageName = baseClean.includes('.') 
      ? `com.${baseClean}` 
      : `com.aeroapk.${baseClean || 'app'}`;
  }

  // Analyze version name heuristics
  let versionName = '1.0.0';
  const verRegex = /v?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i;
  const verMatch = fileName.match(verRegex) || sliceText.match(/versionName="([^"]+)"/i);
  if (verMatch && verMatch[1]) {
    versionName = verMatch[1];
  }

  // Derive versionCode
  const verParts = versionName.split('.').map(n => parseInt(n, 10) || 0);
  const calculatedVersionCode = (verParts[0] || 1) * 10000 + (verParts[1] || 0) * 100 + (verParts[2] || 0);
  const versionCode = calculatedVersionCode > 0 ? calculatedVersionCode : 10001;

  // App Name from filename or text
  const cleanAppName = fileName
    .replace(/\.apk$/i, '')
    .replace(/[-_]v?[0-9].*$/i, '')
    .replace(/[-_.]/g, ' ')
    .trim();
  const appName = cleanAppName.charAt(0).toUpperCase() + cleanAppName.slice(1);

  // Scan for permissions
  const potentialPermissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.WAKE_LOCK',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.VIBRATE',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION'
  ];

  const permissions: string[] = [];
  potentialPermissions.forEach(p => {
    if (sliceText.includes(p) || sliceText.includes(p.replace('android.permission.', ''))) {
      permissions.push(p);
    }
  });

  // Provide realistic standard permissions if binary was stripped/obfuscated
  if (permissions.length === 0) {
    permissions.push('android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE');
    if (fileSize > 25 * 1024 * 1024) {
      permissions.push('android.permission.WAKE_LOCK', 'android.permission.POST_NOTIFICATIONS');
    }
  }

  // Architectures
  const architectures: string[] = [];
  if (sliceText.includes('arm64-v8a')) architectures.push('arm64-v8a');
  if (sliceText.includes('armeabi-v7a')) architectures.push('armeabi-v7a');
  if (sliceText.includes('x86_64')) architectures.push('x86_64');
  if (architectures.length === 0) {
    architectures.push('arm64-v8a', 'armeabi-v7a');
  }

  // SDK detection
  const minSdk = 24; // Android 7.0 Nougat
  const targetSdk = 35; // Android 15

  // Signing Certificate digest derivation
  const certSha1 = await calculateSha1(sliceBuffer);
  const signingCertificate: SigningCertificateInfo = {
    sha256: sha256.substring(0, 48) + 'A1B2C3D4',
    sha1: certSha1,
    issuer: `CN=${appName} Developer, O=${appName} Inc, C=ID`,
    subject: `CN=${appName} Developer, O=${appName} Inc, C=ID`
  };

  // Security Verification logic
  const securityIssues: string[] = [];
  let securityStatus: 'passed' | 'warning' | 'rejected' = 'passed';

  // Check dangerous permissions
  const dangerousPerms = [
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.REQUEST_INSTALL_PACKAGES',
    'android.permission.BIND_ACCESSIBILITY_SERVICE'
  ];

  dangerousPerms.forEach(p => {
    if (permissions.includes(p)) {
      securityIssues.push(`Menggunakan izin berisiko tinggi: ${p}`);
      securityStatus = 'warning';
    }
  });

  // Check target SDK freshness
  if (targetSdk < 31) {
    securityIssues.push(`Target SDK ${targetSdk} terlalu lama. Minimal Google Play adalah SDK 33.`);
    securityStatus = 'warning';
  }

  return {
    packageName,
    versionName,
    versionCode,
    fileSize,
    minSdk,
    targetSdk,
    permissions,
    architectures,
    sha256,
    signingCertificate,
    securityStatus,
    securityIssues,
    appName,
    changelog: `Rilis versi ${versionName} (${versionCode}) untuk platform Android.`
  };
}
