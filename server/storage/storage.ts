import { DosyaStorage } from './dosyaStorage';
import { APKStorage } from './types';

export const storage: APKStorage = new DosyaStorage();

export { sanitizeFileName } from './dosyaStorage';
export * from './types';
