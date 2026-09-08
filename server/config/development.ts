import { productionConfig } from './production';

export const developmentConfig = {
  ...productionConfig,
  env: 'development',
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  },
  storage: {
    ...productionConfig.storage,
    r2BucketName: process.env.R2_BUCKET_NAME || 'aero-apk-dev'
  }
};
