import { productionConfig } from './production';

export const stagingConfig = {
  ...productionConfig,
  env: 'staging',
  cors: {
    origin: ['https://staging.modstation.id'],
    credentials: true
  }
};
