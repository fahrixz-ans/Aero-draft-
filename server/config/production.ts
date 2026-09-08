export const productionConfig = {
  env: 'production',
  port: Number(process.env.PORT) || 3000,
  host: '0.0.0.0',
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://aeroapk.com', 'https://www.aeroapk.com'],
    credentials: true
  },
  auth: {
    secret: process.env.AUTH_SECRET,
    url: process.env.AUTH_URL || 'https://aeroapk.com',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    sessionMaxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
  },
  firestore: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
  },
  storage: {
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME || 'aero-apk-production',
    downloadDomain: process.env.DOWNLOAD_DOMAIN || 'download.aeroapk.com'
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  virusTotal: {
    apiKey: process.env.VIRUSTOTAL_API_KEY
  },
  featureFlags: {
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    recommendationsEnabled: process.env.RECOMMENDATION_ENABLED !== 'false',
    rankingEnabled: process.env.RANKING_ENABLED !== 'false',
    smartCollectionsEnabled: process.env.SMART_COLLECTIONS_ENABLED !== 'false',
    analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false',
    apkUploadEnabled: process.env.APK_UPLOAD_ENABLED !== 'false',
    apkDownloadEnabled: process.env.APK_DOWNLOAD_ENABLED !== 'false',
    developerUploadEnabled: process.env.DEVELOPER_UPLOAD_ENABLED !== 'false',
    googleLoginEnabled: process.env.GOOGLE_LOGIN_ENABLED !== 'false'
  }
};

export function validateProductionConfig() {
  const missing: string[] = [];
  if (!process.env.AUTH_SECRET) missing.push('AUTH_SECRET');
  if (!process.env.FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(`[Config Warning] Missing production environment variables: ${missing.join(', ')}`);
  }
  return missing.length === 0;
}
