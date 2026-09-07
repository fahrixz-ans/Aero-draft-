import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Bookmark, MessageSquare, Star, Bell, Settings, 
  LogOut, ExternalLink, Trash2, ArrowRight, Loader2, CheckCircle2,
  Shield, History, Download, Layers, RefreshCw, AlertTriangle, FileText,
  Sliders, Lock, Eye, DownloadCloud, AlertCircle, Sparkles
} from 'lucide-react';
import { 
  AppData, 
  AppReview, 
  AppRating, 
  AppNotification, 
  UserPreferences,
  DownloadHistoryRecord,
  FollowedCategoryEntry,
  ReportIssue
} from '../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  collectionGroup, 
  getDocs, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import AppCard from './AppCard';
import { 
  getUserPreferences, 
  saveUserPreferences, 
  requestPushPermission,
  exportUserData,
  deleteUserAccountData,
  clearDownloadHistory,
  clearSearchHistory,
  clearRecentlyViewed,
  DEFAULT_USER_PREFERENCES
} from '../services/userService';

interface UserProfileViewProps {
  user: User | null;
  allApps: AppData[];
  savedApps: AppData[];
  followedApps?: AppData[];
  followedCategories?: FollowedCategoryEntry[] | string[];
  downloadHistory?: DownloadHistoryRecord[];
  notifications?: AppNotification[] | any[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onRemoveBookmark?: (appId: string) => void;
  onToggleBookmark?: (app: AppData | string) => void;
  onUnfollowApp?: (appId: string) => void;
  onToggleFollowApp?: (app: AppData | string) => void;
  onUnfollowCategory?: (categoryName: string) => void;
  onToggleFollowCategory?: (categoryName: string) => void;
  onClearDownloadHistory?: () => void;
  onClearRecentlyViewed?: () => void;
  onSignOut: () => void;
  onSignIn?: () => void;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onBackHome: () => void;
  initialTab?: 'overview' | 'saved' | 'history' | 'reviews' | 'reports' | 'preferences' | 'notifications' | 'privacy';
}

type TabType = 'overview' | 'saved' | 'history' | 'reviews' | 'reports' | 'preferences' | 'notifications' | 'privacy';

export default function UserProfileView({
  user,
  allApps = [],
  savedApps = [],
  followedApps = [],
  followedCategories = [],
  downloadHistory = [],
  notifications = [],
  onSelectApp,
  onDownloadApp,
  onRemoveBookmark,
  onUnfollowApp,
  onUnfollowCategory,
  onClearDownloadHistory,
  onSignOut,
  onMarkNotificationRead,
  onBackHome,
  initialTab = 'overview'
}: UserProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [myReviews, setMyReviews] = useState<AppReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [myReports, setMyReports] = useState<ReportIssue[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSavedToast, setPrefsSavedToast] = useState(false);

  // Modals & Actions
  const [exportingData, setExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load preferences
  useEffect(() => {
    getUserPreferences(user).then(setPreferences);
  }, [user]);

  // Load reviews
  useEffect(() => {
    if (activeTab === 'reviews' && user?.uid) {
      loadMyReviews();
    }
  }, [activeTab, user?.uid]);

  // Load reports
  useEffect(() => {
    if (activeTab === 'reports' && user?.uid) {
      loadMyReports();
    }
  }, [activeTab, user?.uid]);

  const loadMyReviews = async () => {
    if (!user?.uid) return;
    setLoadingReviews(true);
    try {
      const reviewsGroupQuery = query(
        collectionGroup(db, 'reviews'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(reviewsGroupQuery);
      const list: AppReview[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as AppReview);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyReviews(list);
    } catch (err) {
      console.warn('Could not load user reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadMyReports = async () => {
    if (!user?.uid) return;
    setLoadingReports(true);
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(reportsQuery);
      const list: ReportIssue[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ReportIssue);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyReports(list);
    } catch (err) {
      console.warn('Could not load user reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDeleteMyReview = async (appId: string, reviewId: string) => {
    if (!window.confirm('Hapus ulasan ini?')) return;
    try {
      await deleteDoc(doc(db, 'applications', appId, 'reviews', reviewId));
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const handleUpdatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    setSavingPrefs(true);
    try {
      const updated = await saveUserPreferences(user, newPrefs);
      setPreferences(updated);
      setPrefsSavedToast(true);
      setTimeout(() => setPrefsSavedToast(false), 3000);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleTogglePush = async () => {
    const granted = await requestPushPermission();
    handleUpdatePreferences({
      notifications: {
        ...preferences.notifications,
        pushEnabled: granted
      }
    });
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const data = await exportUserData(user);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `aero_user_data_${user.uid.substring(0, 8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Data export error:', err);
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'HAPUS AKUN SAYA') {
      alert('Ketik "HAPUS AKUN SAYA" untuk konfirmasi.');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await deleteUserAccountData(user);
      setShowDeleteModal(false);
      onSignOut();
    } catch (err) {
      console.error('Delete account error:', err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const unreadNotifCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="user-profile-view">
      {/* Account Header */}
      <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Akun Pengguna'}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-150 dark:border-white/10 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/40 font-black text-2xl">
              {(user?.displayName || user?.email || 'A').substring(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {user?.displayName || 'Pengguna Aero'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {user?.email || 'Akun Tamu (Tersimpan Lokal)'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <Bookmark className="w-3 h-3 text-blue-500" />
                {savedApps.length} Disimpan
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <Bell className="w-3 h-3 text-purple-500" />
                {followedApps.length} Diikuti
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <History className="w-3 h-3 text-emerald-500" />
                {downloadHistory.length} Riwayat Unduh
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onSignOut}
          aria-label="Keluar dari akun"
          className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/30 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors self-center sm:self-start cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 mb-8 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Ringkasan', icon: UserIcon },
          { id: 'saved', label: `Tersimpan & Diikuti (${savedApps.length + followedApps.length})`, icon: Bookmark },
          { id: 'history', label: `Riwayat Unduhan (${downloadHistory.length})`, icon: History },
          { id: 'reviews', label: 'Ulasan Saya', icon: MessageSquare },
          { id: 'reports', label: 'Laporan Saya', icon: FileText },
          { id: 'preferences', label: 'Preferensi', icon: Sliders },
          { id: 'notifications', label: 'Notifikasi', icon: Bell },
          { id: 'privacy', label: 'Privasi & Data', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-3 text-xs font-black tracking-tight border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div 
              onClick={() => setActiveTab('saved')}
              className="p-6 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl shadow-sm hover:border-blue-500/30 transition-all cursor-pointer group space-y-3"
            >
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl w-fit">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                Aplikasi Tersimpan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {savedApps.length} aplikasi tersimpan dalam daftar favorit Anda.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('history')}
              className="p-6 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl shadow-sm hover:border-blue-500/30 transition-all cursor-pointer group space-y-3"
            >
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                Riwayat Unduhan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {downloadHistory.length} berkas APK atau tautan resmi pernah diunduh.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('privacy')}
              className="p-6 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl shadow-sm hover:border-blue-500/30 transition-all cursor-pointer group space-y-3"
            >
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl w-fit">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">
                Kontrol Privasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola personalisasi data, riwayat pencarian, dan opsi export data JSON.
              </p>
            </div>
          </div>

          {/* Quick Saved preview */}
          {savedApps.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Aplikasi Tersimpan Terakhir
                </h3>
                <button
                  onClick={() => setActiveTab('saved')}
                  className="text-xs font-bold text-blue-500 hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {savedApps.slice(0, 4).map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onSelect={onSelectApp}
                    onDownload={onDownloadApp}
                    downloadHistory={downloadHistory}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED & FOLLOWED */}
      {activeTab === 'saved' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-500" />
              <span>Aplikasi Tersimpan ({savedApps.length})</span>
            </h3>
            {savedApps.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                <p className="text-xs text-slate-500">Belum ada aplikasi tersimpan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedApps.map((app) => (
                  <div key={app.id} className="relative group/saved">
                    <AppCard app={app} onSelect={onSelectApp} onDownload={onDownloadApp} downloadHistory={downloadHistory} />
                    <button
                      onClick={() => onRemoveBookmark(app.id)}
                      className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-red-500 rounded-xl shadow border border-slate-200 dark:border-white/10 opacity-0 group-hover/saved:opacity-100 transition-opacity cursor-pointer"
                      title="Hapus simpanan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Followed apps */}
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-500" />
              <span>Aplikasi Diikuti ({followedApps.length})</span>
            </h3>
            {followedApps.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                <p className="text-xs text-slate-500">Belum ada aplikasi yang Anda ikuti.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {followedApps.map((app) => (
                  <div key={app.id} className="relative group/followed">
                    <AppCard app={app} onSelect={onSelectApp} onDownload={onDownloadApp} downloadHistory={downloadHistory} />
                    {onUnfollowApp && (
                      <button
                        onClick={() => onUnfollowApp(app.id)}
                        className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-red-500 rounded-xl shadow border border-slate-200 dark:border-white/10 opacity-0 group-hover/followed:opacity-100 transition-opacity cursor-pointer"
                        title="Berhenti Mengikuti"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DOWNLOAD HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Riwayat unduhan paket APK dan tautan resmi tersimpan di akun Anda.
            </p>
            {downloadHistory.length > 0 && onClearDownloadHistory && (
              <button
                onClick={onClearDownloadHistory}
                className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
              >
                Bersihkan Riwayat
              </button>
            )}
          </div>

          {downloadHistory.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
              <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Belum ada riwayat unduhan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloadHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {item.appName.substring(0, 1)}
                    </div>
                    <div>
                      <h4 
                        onClick={() => onSelectApp(item.appSlug || item.appId)}
                        className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-blue-500 cursor-pointer"
                      >
                        {item.appName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        v{item.version} • {new Date(item.downloadedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    item.type === 'apk'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {item.type === 'apk' ? 'APK' : 'Tautan Resmi'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {loadingReviews ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : myReviews.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Anda belum menulis ulasan aplikasi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteMyReview(rev.appId, rev.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Hapus ulasan ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MY REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pantau status laporan kendala aplikasi yang telah Anda ajukan kepada tim moderator Aero.
          </p>

          {loadingReports ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : myReports.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Anda belum pernah mengajukan laporan kendala aplikasi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {rep.appName || 'Laporan Aplikasi'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        rep.status === 'resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : rep.status === 'investigating'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : rep.status === 'dismissed'
                          ? 'bg-slate-100 dark:bg-white/5 text-slate-500'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {rep.status === 'resolved' ? 'Terselesaikan' : rep.status === 'investigating' ? 'Ditinjau' : rep.status === 'dismissed' ? 'Ditolak' : 'Menunggu Review'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {rep.description}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      Dilaporkan pada {new Date(rep.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">
              Pengaturan Tampilan & Bahasa
            </h3>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Bahasa Antarmuka</h4>
                <p className="text-[11px] text-slate-400">Pilih bahasa default yang digunakan dalam platform.</p>
              </div>
              <select
                value={preferences.language}
                onChange={(e) => handleUpdatePreferences({ language: e.target.value as 'id' | 'en' })}
                className="px-3 py-1.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="id">Bahasa Indonesia (ID)</option>
                <option value="en">English (US)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: NOTIFICATIONS PREFERENCES */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Notifikasi Web Push Browser</h4>
                <p className="text-xs text-slate-400 mt-0.5">Terima pemberitahuan update langsung di browser Anda.</p>
              </div>
              <button
                onClick={handleTogglePush}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preferences.notifications.pushEnabled
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                }`}
              >
                {preferences.notifications.pushEnabled ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
                Kategori Notifikasi
              </h4>

              {/* App updates toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">Pembaruan Versi Aplikasi Diikuti</h5>
                  <p className="text-[11px] text-slate-400">Kirim notifikasi ketika aplikasi yang Anda ikuti merilis versi baru.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications.appUpdates}
                  onChange={(e) => handleUpdatePreferences({
                    notifications: { ...preferences.notifications, appUpdates: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* New apps toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">Rilisan Aplikasi Baru dalam Kategori Favorit</h5>
                  <p className="text-[11px] text-slate-400">Pemberitahuan saat ada aplikasi baru yang sesuai dengan minat Anda.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications.newApps}
                  onChange={(e) => handleUpdatePreferences({
                    notifications: { ...preferences.notifications, newApps: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Recommendations toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">Rekomendasi Mingguan</h5>
                  <p className="text-[11px] text-slate-400">Kurasi mingguan aplikasi terbaik yang sedang naik daun.</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications.recommendations}
                  onChange={(e) => handleUpdatePreferences({
                    notifications: { ...preferences.notifications, recommendations: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PRIVACY & SECURITY */}
      {activeTab === 'privacy' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">
              Kontrol Personalisasi & Jejak Data
            </h3>

            {/* Personalized Recommendations Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Rekomendasi Terpersonalisasi</h4>
                <p className="text-[11px] text-slate-400">Sesuaikan halaman beranda berdasarkan interaksi dan kategori yang Anda minati.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.privacy.personalizedRecommendations}
                onChange={(e) => handleUpdatePreferences({
                  privacy: { ...preferences.privacy, personalizedRecommendations: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Search History Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Simpan Riwayat Pencarian</h4>
                <p className="text-[11px] text-slate-400">Menyimpan kata kunci pencarian terakhir untuk mempermudah navigasi.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    clearSearchHistory();
                    alert('Riwayat pencarian berhasil dibersihkan.');
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Bersihkan
                </button>
                <input
                  type="checkbox"
                  checked={preferences.privacy.searchHistory}
                  onChange={(e) => handleUpdatePreferences({
                    privacy: { ...preferences.privacy, searchHistory: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Download History Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Catat Riwayat Unduhan</h4>
                <p className="text-[11px] text-slate-400">Menyimpan daftar paket APK yang pernah Anda unduh di akun ini.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.privacy.downloadHistory}
                onChange={(e) => handleUpdatePreferences({
                  privacy: { ...preferences.privacy, downloadHistory: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Export Data & Delete Account */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl space-y-5">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">
              Hak Akses Data & Penghapusan
            </h3>

            {/* Export data */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Unduh Salinan Data Akun (JSON)</h4>
                <p className="text-[11px] text-slate-400">Dapatkan seluruh riwayat interaksi, aplikasi tersimpan, dan ulasan Anda.</p>
              </div>
              <button
                onClick={handleExportData}
                disabled={exportingData}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{exportingData ? 'Mengekspor...' : 'Export Data'}</span>
              </button>
            </div>

            {/* Delete account */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="font-bold text-xs text-red-600 dark:text-red-400">Hapus Akun & Seluruh Data</h4>
                <p className="text-[11px] text-slate-400">Tindakan ini permanen dan akan menghapus seluruh data yang tersimpan di cloud.</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Konfirmasi Hapus Akun Permanen
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Seluruh daftar aplikasi tersimpan, riwayat unduh, preferensi, dan data profil Anda akan dihapus secara permanen dari server database Aero.
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Ketik <span className="font-mono text-red-600 font-extrabold">HAPUS AKUN SAYA</span> untuk melanjutkan:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="HAPUS AKUN SAYA"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'HAPUS AKUN SAYA' || isDeletingAccount}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-40"
              >
                {isDeletingAccount ? 'Menghapus...' : 'Konfirmasi Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Saved Toast */}
      {prefsSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>Preferensi berhasil diperbarui.</span>
        </div>
      )}
    </div>
  );
}
