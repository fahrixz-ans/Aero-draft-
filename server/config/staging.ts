import { productionConfig } from './production';

export const stagingConfig = {
  ...productionConfig,
  env: 'staging',
  storage: {
    ...productionConfig.storage,
    r2BucketName: process.env.R2_BUCKET_NAME || 'aero-apk-staging',
    downloadDomain: process.env.DOWNLOAD_DOMAIN || 'staging-download.aeroapk.com'
  }
};
