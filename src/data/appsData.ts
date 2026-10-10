import { AppData } from '../types';
import { CATEGORIES_100 } from './categories100';

export const CATEGORIES = CATEGORIES_100;

export const demoMessengerApp: AppData = {
  id: 'demo-messenger',
  name: 'Demo Messenger',
  slug: 'demo-messenger',
  developer: 'Example Studio',
  developerName: 'Example Studio',
  category: 'Komunikasi',
  categories: ['Komunikasi'],
  version: '1.0.0',
  size: '25 MB',
  apkSize: 26214400,
  description: 'Aplikasi pesan instan modern dengan enkripsi ujung-ke-ujung, performa cepat, dan tampilan intuitif.',
  icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  screenshots: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80'
  ],
  androidVersion: 'Android 8.0+',
  rating: 4.8,
  ratingAverage: 4.8,
  ratingCount: 120,
  downloads: 15400,
  releaseDate: '2026-01-15',
  updatedAt: '2026-03-01',
  downloadUrl: 'https://example.com/downloads/demo-messenger.apk',
  apkFileUrl: 'https://example.com/downloads/demo-messenger.apk',
  officialUrl: 'https://example.com/demo-messenger',
  featured: true,
  popular: true,
  status: 'published',
  publishStatus: 'published',
  sourceType: 'apk'
};

/**
 * Mod Station Production Data Store
 * Initialized with sample fallback data and updated reactively from Firebase Firestore.
 */
export const appsData: AppData[] = [demoMessengerApp];
