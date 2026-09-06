import { SystemSettings } from '../../types';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    siteName: 'Aero APK Discovery & Distribution',
    siteDescription: 'Platform distribusi aplikasi Android modern, aman, dan berintegritas tinggi.',
    contactEmail: 'admin@aeroapk.com',
    defaultLanguage: 'id-ID',
    maintenanceMode: false
  },
  downloads: {
    rateLimitPerMinute: 45,
    requireCaptchaOnSpam: true,
    directDownloadEnabled: true,
    resumableRangeEnabled: true
  },
  trending: {
    weights: {
      downloads: 35,
      views: 20,
      searches: 15,
      growth: 15,
      saves: 10,
      freshness: 5
    },
    decayHours: 48
  },
  search: {
    fuzzyMatching: true,
    maxResults: 50,
    logZeroResultQueries: true
  },
  moderation: {
    autoFlagThreshold: 5,
    notifyAdminsOnCriticalReport: true,
    requireRejectionReason: true
  },
  storage: {
    maxApkSizeMB: 150,
    maxImageSizeMB: 10,
    autoCleanOrphanFiles: false
  }
};

export async function fetchSystemSettings(): Promise<SystemSettings> {
  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const data = await res.json();
      return { ...DEFAULT_SETTINGS, ...data };
    }
  } catch (err) {
    // Fallback to Firestore
  }

  // 2. Try Firestore fallback
  try {
    const docRef = doc(db, 'settings', 'global_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as any) };
    }
  } catch (err) {
    console.warn('Firestore settings fetch error:', err);
  }

  return DEFAULT_SETTINGS;
}

export async function saveSystemSettings(settings: SystemSettings, adminEmail?: string): Promise<{ success: boolean; error?: string }> {
  // Validate trending weights
  const { downloads, views, searches, growth, saves, freshness } = settings.trending.weights;
  const sum = (downloads || 0) + (views || 0) + (searches || 0) + (growth || 0) + (saves || 0) + (freshness || 0);
  if (Math.abs(sum - 100) > 0.1) {
    return { success: false, error: `Total bobot algoritma trending harus tepat 100% (saat ini: ${sum}%).` };
  }

  // 1. Save to server Express API
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, adminEmail })
    });
    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: errData.error || 'Gagal menyimpan pengaturan ke server.' };
    }
  } catch (err: any) {
    // non-blocking
  }

  // 2. Save to Firestore
  try {
    const docRef = doc(db, 'settings', 'global_config');
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'admin@aeroapk.com'
    });
  } catch (err: any) {
    console.warn('Failed saving settings to Firestore:', err);
  }

  return { success: true };
}
