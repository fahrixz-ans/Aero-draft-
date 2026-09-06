import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy, limit, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { 
  AppData, 
  UserPreferences, 
  SavedAppEntry, 
  FollowedAppEntry, 
  FollowedCategoryEntry, 
  DownloadHistoryRecord, 
  SearchHistoryRecord, 
  RecentlyViewedRecord, 
  NotificationItem 
} from '../types';

// ==========================================
// LOCAL STORAGE KEYS FOR GUEST SESSIONS
// ==========================================
const GUEST_SAVED_APPS_KEY = 'aero_guest_saved_apps';
const GUEST_FOLLOWED_APPS_KEY = 'aero_guest_followed_apps';
const GUEST_FOLLOWED_CATEGORIES_KEY = 'aero_guest_followed_categories';
const GUEST_DOWNLOAD_HISTORY_KEY = 'aero_guest_download_history';
const GUEST_SEARCH_HISTORY_KEY = 'aero_guest_search_history';
const GUEST_RECENTLY_VIEWED_KEY = 'aero_guest_recently_viewed';
const GUEST_PREFERENCES_KEY = 'aero_guest_preferences';

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'id',
  notifications: {
    appUpdates: true,
    newApps: true,
    recommendations: true,
    collections: true,
    systemAlerts: true,
    frequency: 'instant',
    pushEnabled: false
  },
  contentPreferences: [],
  privacy: {
    personalizedRecommendations: true,
    analyticsPersonalization: true,
    searchHistory: true,
    downloadHistory: true
  },
  updatedAt: new Date().toISOString()
};

// ==========================================
// USER PREFERENCES SERVICE
// ==========================================

export async function getUserPreferences(user: User | null): Promise<UserPreferences> {
  if (!user) {
    try {
      const raw = localStorage.getItem(GUEST_PREFERENCES_KEY);
      if (raw) return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Error reading guest preferences:', e);
    }
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const prefDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'preferences'));
    if (prefDoc.exists()) {
      return { ...DEFAULT_USER_PREFERENCES, ...prefDoc.data() } as UserPreferences;
    }
  } catch (err) {
    console.warn('Could not fetch user preferences from Firestore:', err);
  }

  return DEFAULT_USER_PREFERENCES;
}

export async function saveUserPreferences(user: User | null, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await getUserPreferences(user);
  const updated: UserPreferences = {
    ...current,
    ...prefs,
    updatedAt: new Date().toISOString()
  };

  if (!user) {
    localStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(updated));
    return updated;
  }

  try {
    await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), updated, { merge: true });
    // Also save locally as cache
    localStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving user preferences to Firestore:', err);
  }

  return updated;
}

// ==========================================
// SAVED APPS (BOOKMARKS) WITH GUEST MERGE
// ==========================================

export function getGuestSavedApps(): SavedAppEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_SAVED_APPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function toggleSaveApp(user: User | null, app: AppData): Promise<{ isSaved: boolean; savedList: SavedAppEntry[] }> {
  if (!user) {
    // Guest flow
    const current = getGuestSavedApps();
    const exists = current.some(e => e.appId === app.id);
    let updated: SavedAppEntry[];

    if (exists) {
      updated = current.filter(e => e.appId !== app.id);
    } else {
      updated = [
        {
          appId: app.id,
          appName: app.name,
          savedVersion: app.version,
          savedAt: new Date().toISOString()
        },
        ...current
      ];
    }
    localStorage.setItem(GUEST_SAVED_APPS_KEY, JSON.stringify(updated));
    return { isSaved: !exists, savedList: updated };
  }

  // Logged-in user Firestore flow
  const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', app.id);
  const docSnap = await getDoc(bookmarkRef);
  const isSaved = docSnap.exists();

  if (isSaved) {
    await deleteDoc(bookmarkRef);
    return { isSaved: false, savedList: [] };
  } else {
    const entry: SavedAppEntry = {
      appId: app.id,
      appName: app.name,
      savedVersion: app.version,
      savedAt: new Date().toISOString()
    };
    await setDoc(bookmarkRef, entry);
    return { isSaved: true, savedList: [entry] };
  }
}

// ==========================================
// FOLLOWED APPS SERVICE (FOR VERSION UPDATES)
// ==========================================

export function getGuestFollowedApps(): FollowedAppEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_FOLLOWED_APPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function toggleFollowApp(user: User | null, app: AppData): Promise<boolean> {
  if (!user) {
    const current = getGuestFollowedApps();
    const exists = current.some(e => e.appId === app.id);
    let updated: FollowedAppEntry[];
    if (exists) {
      updated = current.filter(e => e.appId !== app.id);
    } else {
      updated = [
        {
          appId: app.id,
          appName: app.name,
          followedVersion: app.version,
          followedAt: new Date().toISOString()
        },
        ...current
      ];
    }
    localStorage.setItem(GUEST_FOLLOWED_APPS_KEY, JSON.stringify(updated));
    return !exists;
  }

  const followRef = doc(db, 'users', user.uid, 'followed_apps', app.id);
  const docSnap = await getDoc(followRef);
  const exists = docSnap.exists();

  if (exists) {
    await deleteDoc(followRef);
    return false;
  } else {
    await setDoc(followRef, {
      appId: app.id,
      appName: app.name,
      followedVersion: app.version,
      followedAt: new Date().toISOString()
    });
    return true;
  }
}

// ==========================================
// FOLLOWED CATEGORIES SERVICE
// ==========================================

export function getGuestFollowedCategories(): FollowedCategoryEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_FOLLOWED_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function toggleFollowCategory(user: User | null, categoryName: string): Promise<boolean> {
  const catId = categoryName.toLowerCase().replace(/\s+/g, '-');
  if (!user) {
    const current = getGuestFollowedCategories();
    const exists = current.some(e => e.categoryName === categoryName);
    let updated: FollowedCategoryEntry[];
    if (exists) {
      updated = current.filter(e => e.categoryName !== categoryName);
    } else {
      updated = [
        {
          categoryId: catId,
          categoryName,
          followedAt: new Date().toISOString()
        },
        ...current
      ];
    }
    localStorage.setItem(GUEST_FOLLOWED_CATEGORIES_KEY, JSON.stringify(updated));
    return !exists;
  }

  const catRef = doc(db, 'users', user.uid, 'followed_categories', catId);
  const docSnap = await getDoc(catRef);
  const exists = docSnap.exists();

  if (exists) {
    await deleteDoc(catRef);
    return false;
  } else {
    await setDoc(catRef, {
      categoryId: catId,
      categoryName,
      followedAt: new Date().toISOString()
    });
    return true;
  }
}

// ==========================================
// GUEST-TO-USER DATA MERGE (WHEN LOGGING IN)
// ==========================================

export async function mergeGuestDataToAccount(user: User): Promise<void> {
  try {
    const guestSaved = getGuestSavedApps();
    const guestFollowedApps = getGuestFollowedApps();
    const guestFollowedCats = getGuestFollowedCategories();

    // Merge saved apps without duplicates
    if (guestSaved.length > 0) {
      for (const item of guestSaved) {
        const ref = doc(db, 'users', user.uid, 'bookmarks', item.appId);
        const exists = (await getDoc(ref)).exists();
        if (!exists) {
          await setDoc(ref, item);
        }
      }
      localStorage.removeItem(GUEST_SAVED_APPS_KEY);
    }

    // Merge followed apps
    if (guestFollowedApps.length > 0) {
      for (const item of guestFollowedApps) {
        const ref = doc(db, 'users', user.uid, 'followed_apps', item.appId);
        const exists = (await getDoc(ref)).exists();
        if (!exists) {
          await setDoc(ref, item);
        }
      }
      localStorage.removeItem(GUEST_FOLLOWED_APPS_KEY);
    }

    // Merge followed categories
    if (guestFollowedCats.length > 0) {
      for (const item of guestFollowedCats) {
        const ref = doc(db, 'users', user.uid, 'followed_categories', item.categoryId);
        const exists = (await getDoc(ref)).exists();
        if (!exists) {
          await setDoc(ref, item);
        }
      }
      localStorage.removeItem(GUEST_FOLLOWED_CATEGORIES_KEY);
    }
  } catch (err) {
    console.warn('Error merging guest data to user account:', err);
  }
}

// ==========================================
// DOWNLOAD HISTORY SERVICE
// ==========================================

export function getGuestDownloadHistory(): DownloadHistoryRecord[] {
  try {
    const raw = localStorage.getItem(GUEST_DOWNLOAD_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function recordDownloadHistory(
  user: User | null, 
  app: AppData, 
  type: 'apk' | 'official_link' = 'apk',
  status: 'started' | 'completed' | 'failed' = 'completed'
): Promise<void> {
  const record: DownloadHistoryRecord = {
    id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    appId: app.id,
    appName: app.name,
    appSlug: app.slug,
    iconUrl: app.iconUrl || app.icon,
    version: app.version,
    downloadedAt: new Date().toISOString(),
    type,
    status,
    fileSize: app.size || (app.apkSize ? `${((app.apkSize) / (1024 * 1024)).toFixed(1)} MB` : undefined)
  };

  // Always keep in local memory/storage (capped at 50)
  const current = getGuestDownloadHistory();
  const filtered = [record, ...current.filter(c => c.id !== record.id)].slice(0, 50);
  localStorage.setItem(GUEST_DOWNLOAD_HISTORY_KEY, JSON.stringify(filtered));

  // Sync to Firestore if user logged in
  if (user) {
    try {
      await setDoc(doc(db, 'users', user.uid, 'download_history', record.id), record);
    } catch (e) {
      console.warn('Could not sync download record to Firestore:', e);
    }
  }
}

export async function clearDownloadHistory(user: User | null): Promise<void> {
  localStorage.removeItem(GUEST_DOWNLOAD_HISTORY_KEY);
  if (user) {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'download_history'));
      const batch = writeBatch(db);
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error('Error clearing download history in Firestore:', e);
    }
  }
}

// ==========================================
// SEARCH HISTORY SERVICE
// ==========================================

export function getSearchHistory(): SearchHistoryRecord[] {
  try {
    const raw = localStorage.getItem(GUEST_SEARCH_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function recordSearchHistory(queryStr: string): void {
  const trimmed = queryStr.trim();
  if (!trimmed || trimmed.length < 2) return;

  const current = getSearchHistory();
  const updated = [
    { query: trimmed, searchedAt: new Date().toISOString() },
    ...current.filter(c => c.query.toLowerCase() !== trimmed.toLowerCase())
  ].slice(0, 15);

  localStorage.setItem(GUEST_SEARCH_HISTORY_KEY, JSON.stringify(updated));
}

export function clearSearchHistory(): void {
  localStorage.removeItem(GUEST_SEARCH_HISTORY_KEY);
}

// ==========================================
// RECENTLY VIEWED APPS (MAX 20)
// ==========================================

export function getRecentlyViewed(_user?: User | null): RecentlyViewedRecord[] {
  try {
    const raw = localStorage.getItem(GUEST_RECENTLY_VIEWED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function recordRecentlyViewed(app: AppData): void {
  if (!app?.id) return;
  const current = getRecentlyViewed();
  const record: RecentlyViewedRecord = {
    appId: app.id,
    appName: app.name,
    appSlug: app.slug,
    iconUrl: app.iconUrl || app.icon,
    category: app.category,
    developer: app.developerName || app.developer,
    rating: app.ratingAverage || app.rating || 0,
    viewedAt: new Date().toISOString()
  };

  const updated = [
    record,
    ...current.filter(c => c.appId !== app.id)
  ].slice(0, 20);

  localStorage.setItem(GUEST_RECENTLY_VIEWED_KEY, JSON.stringify(updated));
}

export function clearRecentlyViewed(_user?: User | null): void {
  localStorage.removeItem(GUEST_RECENTLY_VIEWED_KEY);
}

// Backward-compatible bookmark helpers
export async function saveBookmark(user: User | null, app: AppData): Promise<void> {
  await toggleSaveApp(user, app);
}

export async function removeBookmark(user: User | null, appId: string): Promise<void> {
  await toggleSaveApp(user, { id: appId } as AppData);
}

export async function getSavedApps(user: User | null): Promise<string[]> {
  if (!user) {
    return getGuestSavedApps().map(e => e.appId);
  }
  try {
    const snap = await getDocs(collection(db, 'users', user.uid, 'bookmarks'));
    return snap.docs.map(d => d.id);
  } catch (e) {
    return getGuestSavedApps().map(e => e.appId);
  }
}

// Backward-compatible follow app helpers
export async function followApp(user: User | null, app: AppData): Promise<void> {
  await toggleFollowApp(user, app);
}

export async function unfollowApp(user: User | null, appId: string): Promise<void> {
  await toggleFollowApp(user, { id: appId } as AppData);
}

export async function getFollowedApps(user: User | null): Promise<string[]> {
  if (!user) {
    return getGuestFollowedApps().map(e => e.appId);
  }
  try {
    const snap = await getDocs(collection(db, 'users', user.uid, 'followed_apps'));
    return snap.docs.map(d => d.id);
  } catch (e) {
    return getGuestFollowedApps().map(e => e.appId);
  }
}

// Backward-compatible follow category helpers
export async function followCategory(user: User | null, categoryName: string): Promise<void> {
  await toggleFollowCategory(user, categoryName);
}

export async function unfollowCategory(user: User | null, categoryName: string): Promise<void> {
  await toggleFollowCategory(user, categoryName);
}

export async function getFollowedCategories(user: User | null): Promise<string[]> {
  if (!user) {
    return getGuestFollowedCategories().map(e => e.categoryName);
  }
  try {
    const snap = await getDocs(collection(db, 'users', user.uid, 'followed_categories'));
    return snap.docs.map(d => (d.data().categoryName || d.id));
  } catch (e) {
    return getGuestFollowedCategories().map(e => e.categoryName);
  }
}

// Backward-compatible download history getter
export async function getDownloadHistory(user: User | null): Promise<DownloadHistoryRecord[]> {
  if (!user) {
    return getGuestDownloadHistory();
  }
  try {
    const snap = await getDocs(collection(db, 'users', user.uid, 'download_history'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as DownloadHistoryRecord);
    }
  } catch (e) {
    console.warn('Error fetching user download history:', e);
  }
  return getGuestDownloadHistory();
}


export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  return false;
}

export function showBrowserNotification(title: string, options?: NotificationOptions): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (e) {
      console.debug('Browser notification display failed:', e);
    }
  }
}

// ==========================================
// DATA EXPORT & ACCOUNT DELETION
// ==========================================

export async function exportUserData(user: User): Promise<Record<string, any>> {
  const exportPayload: Record<string, any> = {
    exportDate: new Date().toISOString(),
    profile: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime
    },
    preferences: await getUserPreferences(user),
    savedApps: [],
    followedApps: [],
    followedCategories: [],
    downloadHistory: [],
    searchHistory: getSearchHistory(),
    recentlyViewed: getRecentlyViewed()
  };

  try {
    // Saved apps
    const bSnap = await getDocs(collection(db, 'users', user.uid, 'bookmarks'));
    bSnap.forEach(d => exportPayload.savedApps.push(d.data()));

    // Followed apps
    const fSnap = await getDocs(collection(db, 'users', user.uid, 'followed_apps'));
    fSnap.forEach(d => exportPayload.followedApps.push(d.data()));

    // Followed categories
    const cSnap = await getDocs(collection(db, 'users', user.uid, 'followed_categories'));
    cSnap.forEach(d => exportPayload.followedCategories.push(d.data()));

    // Download history
    const dSnap = await getDocs(collection(db, 'users', user.uid, 'download_history'));
    dSnap.forEach(d => exportPayload.downloadHistory.push(d.data()));
  } catch (err) {
    console.warn('Partial export failure:', err);
  }

  return exportPayload;
}

export async function deleteUserAccountData(user: User): Promise<void> {
  const collectionsToDelete = [
    'bookmarks',
    'followed_apps',
    'followed_categories',
    'download_history',
    'notifications',
    'settings'
  ];

  for (const colName of collectionsToDelete) {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, colName));
      const batch = writeBatch(db);
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn(`Could not clear subcollection ${colName}:`, e);
    }
  }

  // Delete main user document
  try {
    await deleteDoc(doc(db, 'users', user.uid));
  } catch (e) {
    console.warn('Could not delete user root document:', e);
  }

  // Clear guest storage items as well
  localStorage.removeItem(GUEST_SAVED_APPS_KEY);
  localStorage.removeItem(GUEST_FOLLOWED_APPS_KEY);
  localStorage.removeItem(GUEST_FOLLOWED_CATEGORIES_KEY);
  localStorage.removeItem(GUEST_DOWNLOAD_HISTORY_KEY);
  localStorage.removeItem(GUEST_SEARCH_HISTORY_KEY);
  localStorage.removeItem(GUEST_RECENTLY_VIEWED_KEY);
  localStorage.removeItem(GUEST_PREFERENCES_KEY);
}
