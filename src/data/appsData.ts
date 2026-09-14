import { AppData } from '../types';
import { CATEGORIES_100 } from './categories100';

export const CATEGORIES = CATEGORIES_100;

/**
 * Mod Station Production Real Data Store
 * All live application records are queried dynamically from Firebase Firestore / Server API.
 * When no applications are stored yet, the UI presents clean, structured empty states.
 */
export const appsData: AppData[] = [];
