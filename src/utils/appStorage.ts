// AeroAPK Centralized Local Client Storage Engine
// Replaces external Firebase dependencies with durable, instant browser storage.

import { AppData, ImportJob, AnalyticsEventType } from '../types';
import { appsData as defaultAppsData, CATEGORIES as defaultCategories } from '../data/appsData';

const APPS_STORAGE_KEY = 'aeroapk_stored_applications';
const DELETED_APPS_KEY = 'aeroapk_deleted_app_ids';
const CUSTOM_CATEGORIES_KEY = 'aeroapk_custom_categories';
const DELETED_CATEGORIES_KEY = 'aeroapk_deleted_categories';
const BOOKMARKS_KEY = 'aeroapk_user_bookmarks';
const FEEDBACK_KEY = 'aeroapk_feedback_reports';
const SUBSCRIBERS_KEY = 'aeroapk_newsletter_subscribers';
const IMPORT_HISTORY_KEY = 'aeroapk_import_history';
const ANALYTICS_EVENTS_KEY = 'aeroapk_analytics_events';
const LOCAL_USER_KEY = 'aeroapk_local_user';

// Custom event for reactive cross-component state synchronization
export const notifyStorageChange = (key: string) => {
  window.dispatchEvent(new CustomEvent('aeroapk_storage_change', { detail: { key } }));
};

// ==========================================
// 1. APPLICATIONS STORAGE
// ==========================================

export const getDeletedAppIds = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const addDeletedAppId = (appId: string): void => {
  try {
    const existing = getDeletedAppIds();
    if (!existing.includes(appId)) {
      const updated = [...existing, appId];
      localStorage.setItem(DELETED_APPS_KEY, JSON.stringify(updated));
    }
    // Also remove from stored apps if present
    const stored = getStoredApps();
    const filtered = stored.filter(a => a.id !== appId);
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(filtered));
    notifyStorageChange('apps');
  } catch (err) {
    console.error('Error saving deleted app ID:', err);
  }
};

export const addDeletedAppIds = (appIds: string[]): void => {
  try {
    const existing = getDeletedAppIds();
    const merged = Array.from(new Set([...existing, ...appIds]));
    localStorage.setItem(DELETED_APPS_KEY, JSON.stringify(merged));

    const stored = getStoredApps();
    const filtered = stored.filter(a => !appIds.includes(a.id));
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(filtered));
    notifyStorageChange('apps');
  } catch (err) {
    console.error('Error saving deleted app IDs:', err);
  }
};

export const getStoredApps = (): AppData[] => {
  try {
    const deletedIds = getDeletedAppIds();
    const raw = localStorage.getItem(APPS_STORAGE_KEY);
    if (raw) {
      const parsed: AppData[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(a => !deletedIds.includes(a.id));
      }
    }
    // Initial bootstrap with static apps data
    const initialApps = defaultAppsData.filter(a => !deletedIds.includes(a.id));
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(initialApps));
    return initialApps;
  } catch (err) {
    console.error('Error loading stored apps:', err);
    return defaultAppsData;
  }
};

export const saveStoredApps = (apps: AppData[]): void => {
  try {
    const deletedIds = getDeletedAppIds();
    const cleanApps = apps.filter(a => !deletedIds.includes(a.id));
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(cleanApps));
    notifyStorageChange('apps');
  } catch (err) {
    console.error('Error saving stored apps:', err);
  }
};

export const addOrUpdateStoredApp = (app: AppData): void => {
  try {
    const currentApps = getStoredApps();
    const index = currentApps.findIndex(a => a.id === app.id);
    let updatedApps: AppData[];
    if (index >= 0) {
      updatedApps = [...currentApps];
      updatedApps[index] = { ...updatedApps[index], ...app };
    } else {
      updatedApps = [app, ...currentApps];
    }
    saveStoredApps(updatedApps);
  } catch (err) {
    console.error('Error adding/updating app:', err);
  }
};

export const deleteStoredApp = (appId: string): void => {
  addDeletedAppId(appId);
};

// ==========================================
// 2. CATEGORIES STORAGE
// ==========================================

export const getDeletedCategories = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const addDeletedCategory = (catName: string): void => {
  try {
    const existing = getDeletedCategories();
    const lower = catName.toLowerCase().trim();
    if (!existing.includes(lower)) {
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify([...existing, lower]));
    }
    notifyStorageChange('categories');
  } catch (err) {
    console.error('Error saving deleted category:', err);
  }
};

export const removeDeletedCategory = (catName: string): void => {
  try {
    const existing = getDeletedCategories();
    const lower = catName.toLowerCase().trim();
    const filtered = existing.filter(c => c !== lower);
    localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(filtered));
    notifyStorageChange('categories');
  } catch (err) {
    console.error('Error updating deleted category:', err);
  }
};

export const getCustomCategories = (): string[] => {
  try {
    const deletedCats = getDeletedCategories();
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const customList: string[] = raw ? JSON.parse(raw) : [];
    
    // Combine defaults and custom
    const combined = Array.from(new Set([...defaultCategories, ...customList]));
    return combined.filter(c => !deletedCats.includes(c.toLowerCase().trim()));
  } catch (err) {
    return defaultCategories;
  }
};

export const saveCustomCategories = (categories: string[]): void => {
  try {
    const deletedCats = getDeletedCategories();
    const cleanList = categories.filter(c => !deletedCats.includes(c.toLowerCase().trim()));
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cleanList));
    notifyStorageChange('categories');
  } catch (err) {
    console.error('Error saving custom categories:', err);
  }
};

// ==========================================
// 3. BOOKMARKS STORAGE
// ==========================================

export const getStoredBookmarks = (): string[] => {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const saveStoredBookmarks = (bookmarks: string[]): void => {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    notifyStorageChange('bookmarks');
  } catch (err) {
    console.error('Error saving bookmarks:', err);
  }
};

export const toggleStoredBookmark = (appId: string): boolean => {
  const current = getStoredBookmarks();
  let updated: string[];
  let isBookmarked: boolean;
  if (current.includes(appId)) {
    updated = current.filter(id => id !== appId);
    isBookmarked = false;
  } else {
    updated = [...current, appId];
    isBookmarked = true;
  }
  saveStoredBookmarks(updated);
  return isBookmarked;
};

// ==========================================
// 4. FEEDBACK & BUG REPORTS STORAGE
// ==========================================

export interface StoredFeedback {
  id: string;
  applicationId: string;
  applicationName: string;
  type: string;
  message: string;
  email?: string | null;
  status: 'new' | 'investigating' | 'resolved';
  createdAt: string;
}

export const getStoredFeedback = (): StoredFeedback[] => {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // Default initial sample feedback
    const sample: StoredFeedback[] = [
      {
        id: 'fb_1',
        applicationId: 'whatsapp',
        applicationName: 'WhatsApp Messenger',
        type: 'Saran Fitur',
        message: 'Mohon tambahkan tautan unduhan APK versi beta bila tersedia.',
        email: 'user1@example.com',
        status: 'new',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      },
      {
        id: 'fb_2',
        applicationId: 'capcut',
        applicationName: 'CapCut - Video Editor',
        type: 'Laporan Kecepatan Unduh',
        message: 'Unduhan berkas sangat cepat dan tanda tangan SHA-256 cocok.',
        email: 'editor@example.com',
        status: 'resolved',
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
      }
    ];
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(sample));
    return sample;
  } catch (err) {
    return [];
  }
};

export const addStoredFeedback = (item: Omit<StoredFeedback, 'id' | 'createdAt'>): StoredFeedback => {
  const current = getStoredFeedback();
  const newItem: StoredFeedback = {
    ...item,
    id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString()
  };
  const updated = [newItem, ...current];
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  notifyStorageChange('feedback');
  return newItem;
};

export const deleteStoredFeedback = (id: string): void => {
  const current = getStoredFeedback();
  const updated = current.filter(f => f.id !== id);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  notifyStorageChange('feedback');
};

// ==========================================
// 5. NEWSLETTER SUBSCRIBERS STORAGE
// ==========================================

export interface StoredSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
}

export const getStoredSubscribers = (): StoredSubscriber[] => {
  try {
    const raw = localStorage.getItem(SUBSCRIBERS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    const initial: StoredSubscriber[] = [
      {
        id: 'sub_1',
        email: 'fahriandriansaputra123@gmail.com',
        subscribedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
        status: 'active'
      },
      {
        id: 'sub_2',
        email: 'developer.android@aeroapk.com',
        subscribedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
        status: 'active'
      }
    ];
    localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(initial));
    return initial;
  } catch (err) {
    return [];
  }
};

export const addStoredSubscriber = (email: string): { success: boolean; message: string } => {
  const current = getStoredSubscribers();
  const cleanEmail = email.trim().toLowerCase();
  if (current.some(s => s.email.toLowerCase() === cleanEmail)) {
    return { success: true, message: 'Email Anda sudah terdaftar dalam langganan newsletter AeroAPK.' };
  }
  const newSub: StoredSubscriber = {
    id: 'sub_' + Date.now(),
    email: cleanEmail,
    subscribedAt: new Date().toISOString(),
    status: 'active'
  };
  const updated = [newSub, ...current];
  localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(updated));
  notifyStorageChange('subscribers');
  return { success: true, message: 'Terima kasih telah berlangganan rilis terbaru AeroAPK!' };
};

export const deleteStoredSubscriber = (id: string): void => {
  const current = getStoredSubscribers();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(SUBSCRIBERS_KEY, JSON.stringify(updated));
  notifyStorageChange('subscribers');
};

// ==========================================
// 6. IMPORT HISTORY STORAGE
// ==========================================

export const getStoredImportHistory = (): ImportJob[] => {
  try {
    const raw = localStorage.getItem(IMPORT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const addStoredImportJob = (job: ImportJob): void => {
  try {
    const current = getStoredImportHistory();
    const updated = [job, ...current].slice(0, 50); // Keep last 50 jobs
    localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(updated));
    notifyStorageChange('import_history');
  } catch (err) {
    console.error('Error saving import job:', err);
  }
};

// ==========================================
// 7. ANALYTICS EVENTS STORAGE
// ==========================================

export const trackStoredEvent = (
  type: AnalyticsEventType,
  applicationId?: string | null,
  searchQuery?: string | null
): void => {
  try {
    // Record analytics event
    const raw = localStorage.getItem(ANALYTICS_EVENTS_KEY);
    const events = raw ? JSON.parse(raw) : [];
    const newEvent = {
      type,
      applicationId: applicationId || null,
      searchQuery: searchQuery || null,
      createdAt: new Date().toISOString()
    };
    const updatedEvents = [newEvent, ...events].slice(0, 200);
    localStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(updatedEvents));

    // Update app metrics directly in local storage
    if (applicationId) {
      const apps = getStoredApps();
      const targetAppIndex = apps.findIndex(a => a.id === applicationId);
      if (targetAppIndex >= 0) {
        const app = { ...apps[targetAppIndex] };
        app.analytics = app.analytics || {
          views: 0,
          officialClicks: 0,
          alternativeClicks: 0,
          searchFrequency: 0
        };

        if (type === 'application_view') {
          app.analytics.views = (app.analytics.views || 0) + 1;
          app.trendingScore = (app.trendingScore || 10) + 1.0;
        } else if (type === 'official_download_click') {
          app.analytics.officialClicks = (app.analytics.officialClicks || 0) + 1;
          app.downloads = (app.downloads || 1000) + 1;
          app.trendingScore = (app.trendingScore || 10) + 3.0;
        } else if (type === 'alternative_download_click') {
          app.analytics.alternativeClicks = (app.analytics.alternativeClicks || 0) + 1;
          app.downloads = (app.downloads || 1000) + 1;
          app.trendingScore = (app.trendingScore || 10) + 2.0;
        }

        apps[targetAppIndex] = app;
        saveStoredApps(apps);
      }
    }
  } catch (err) {
    // Silent catch
  }
};

// ==========================================
// 8. LOCAL USER / ADMIN AUTH STORAGE
// ==========================================

export interface LocalUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
}

export const getStoredUser = (): LocalUser | null => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (raw) return JSON.parse(raw);
    
    // Default logged in admin profile for instant management
    const defaultAdmin: LocalUser = {
      uid: 'admin_local_01',
      displayName: 'Administrator AeroAPK',
      email: 'admin@aeroapk.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&q=80',
      role: 'admin',
      isAdmin: true
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultAdmin));
    return defaultAdmin;
  } catch {
    return null;
  }
};

export const getStoredLocalUser = getStoredUser;

export const saveStoredUser = (user: LocalUser | null): void => {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
    notifyStorageChange('user');
  } catch (err) {
    console.error('Error saving local user:', err);
  }
};

export const saveStoredLocalUser = saveStoredUser;

export const clearStoredLocalUser = (): void => {
  try {
    localStorage.removeItem(LOCAL_USER_KEY);
    notifyStorageChange('user');
  } catch (err) {
    console.error('Error clearing local user:', err);
  }
};
