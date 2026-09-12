import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Bookmark, History, MessageSquare, FileText, 
  ChevronRight, ArrowRight, Shield, CheckCircle2, AlertCircle, 
  Trash2, Star, Edit3, Camera, Loader2 
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { AppData, AppReview, DownloadHistoryRecord, ReportIssue, AeroUser } from '../../types';
import AppCard from '../AppCard';
import { collection, collectionGroup, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useLanguage } from '../../context/LanguageContext';

interface ProfileViewProps {
  user: AeroUser | null;
  savedApps?: AppData[];
  downloadHistory?: DownloadHistoryRecord[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onRemoveBookmark?: (appId: string) => void;
  onClearDownloadHistory?: () => void;
  onNavigate: (view: string) => void;
  onBack?: () => void;
  onUpdateUser?: (updatedUser: Partial<AeroUser>) => void;
}

type ActivityTab = 'saved' | 'downloads' | 'reviews' | 'reports';

export default function ProfileView({
  user,
  savedApps = [],
  downloadHistory = [],
  onSelectApp,
  onDownloadApp,
  onRemoveBookmark,
  onClearDownloadHistory,
  onNavigate,
  onBack,
  onUpdateUser
}: ProfileViewProps) {
  const { t, language } = useLanguage();

  // Mode: view or edit
  const [isEditing, setIsEditing] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>('saved');

  // Edit form state
  const [name, setName] = useState(user?.displayName || user?.name || '');
  const [username, setUsername] = useState(() => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '';
  });
  const [photoURL, setPhotoURL] = useState(user?.photoURL || user?.image || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Reviews and Reports loaded from Firestore for current user
  const [myReviews, setMyReviews] = useState<AppReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [myReports, setMyReports] = useState<ReportIssue[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Sync edit form with user prop
  useEffect(() => {
    if (user) {
      setName(user.displayName || user.name || '');
      setPhotoURL(user.photoURL || user.image || '');
      if (user.email) {
        setUsername(user.email.split('@')[0]);
      }
    }
  }, [user]);

  // Load reviews when authenticated
  useEffect(() => {
    if (user?.uid) {
      setLoadingReviews(true);
      const reviewsGroupQuery = query(
        collectionGroup(db, 'reviews'),
        where('userId', '==', user.uid)
      );
      getDocs(reviewsGroupQuery)
        .then((snap) => {
          const list: AppReview[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AppReview));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMyReviews(list);
        })
        .catch((e) => console.warn('Could not load user reviews:', e))
        .finally(() => setLoadingReviews(false));
    }
  }, [user?.uid]);

  // Load reports when authenticated
  useEffect(() => {
    if (user?.uid) {
      setLoadingReports(true);
      const reportsQuery = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid)
      );
      getDocs(reportsQuery)
        .then((snap) => {
          const list: ReportIssue[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ReportIssue));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMyReports(list);
        })
        .catch((e) => console.warn('Could not load user reports:', e))
        .finally(() => setLoadingReports(false));
    }
  }, [user?.uid]);

  const handleBackClick = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    if (onBack) {
      onBack();
    } else {
      onNavigate('home');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setIsSaving(true);

    try {
      if (user?.uid) {
        // Attempt update Firestore document if user exists
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            displayName: name,
            photoURL: photoURL,
            updatedAt: new Date().toISOString()
          });
        } catch (e) {
          // Fallback or ignore if permissions
        }
      }

      if (onUpdateUser) {
        onUpdateUser({
          displayName: name,
          name: name,
          photoURL: photoURL,
          image: photoURL
        });
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1200);
    } catch (err) {
      setSaveError(language === 'id' ? 'Gagal menyimpan perubahan profil.' : 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async (appId: string, reviewId: string) => {
    if (!window.confirm(language === 'id' ? 'Hapus ulasan ini?' : 'Delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'applications', appId, 'reviews', reviewId));
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const isDeveloper = user?.role === 'developer' || user?.role === 'admin' || user?.role === 'owner';
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  // ==========================================
  // STATE 1: GUEST / BELUM LOGIN
  // ==========================================
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 space-y-6 animate-fade-in" id="profile-guest-view">
        <div className="flex items-center">
          <BackButton onBack={handleBackClick} label={t('nav.home', 'Home')} showText={true} />
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 shadow-xs text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 flex items-center justify-center mx-auto">
            <UserIcon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('profile.guestTitle', 'Masuk ke Mod Station')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              {t('profile.guestSubtitle', 'Simpan aplikasi, kelola akun, dan dapatkan pengalaman yang lebih personal.')}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('auth-login')}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t('common.login', 'Masuk')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('auth-registration')}
              className="w-full h-11 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
            >
              {t('common.register', 'Daftar')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 3: EDIT PROFILE MODE
  // ==========================================
  if (isEditing) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in" id="profile-edit-view">
        <div className="flex items-center">
          <BackButton onBack={() => setIsEditing(false)} label={t('profile.title', 'Profil')} showText={true} />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('profile.editProfile', 'Edit Profil')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'id' ? 'Perbarui informasi profil akun Mod Station Anda.' : 'Update your Mod Station profile details.'}
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{language === 'id' ? 'Profil berhasil diperbarui!' : 'Profile updated successfully!'}</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center gap-3 pb-2">
            <div className="relative">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-white/10 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center border-2 border-slate-200 dark:border-white/10 shadow-xs">
                  {(name || user?.email || 'U').substring(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1 text-center">
                URL Foto Profil
              </label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-64 h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Nama */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('profile.name', 'Nama')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Email (Read Only) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('profile.email', 'Email')}
            </label>
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="w-full h-11 px-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed select-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t('profile.emailNote', 'Email tidak dapat diubah tanpa verifikasi.')}
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('profile.username', 'Username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('common.processing', 'Memproses...')}</span>
                </>
              ) : (
                <span>{t('profile.saveChanges', 'Simpan Perubahan')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // STATE 2: AUTHENTICATED USER PROFILE
  // ==========================================
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in" id="profile-main-view">
      {/* Back button */}
      <div className="flex items-center">
        <BackButton onBack={handleBackClick} label={t('nav.home', 'Home')} showText={true} />
      </div>

      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {user.photoURL || user.image ? (
            <img
              src={user.photoURL || user.image || ''}
              alt={user.displayName || 'Avatar'}
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-white/10 shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center border-2 border-slate-200 dark:border-white/10 shadow-xs">
              {(user.displayName || user.name || user.email || 'U').substring(0, 1).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {user.displayName || user.name || (language === 'id' ? 'Pengguna Mod Station' : 'Mod Station User')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.email || 'Akun Terdaftar'}
            </p>

            {/* Developer / Admin Badges & Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              {isDeveloper && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t('profile.developerVerified', 'Developer Terverifikasi')}</span>
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[11px] font-bold border border-purple-500/20">
                  <Shield className="w-3 h-3" />
                  <span>{t('profile.adminBadge', 'Admin')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('profile.editProfile', 'Edit Profil')}</span>
          </button>

          {isDeveloper && (
            <button
              type="button"
              onClick={() => onNavigate('developer-dashboard')}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl border border-blue-500/20 transition-colors cursor-pointer"
            >
              Developer Console &gt;
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-600 dark:text-purple-400 font-bold text-xs rounded-xl border border-purple-500/20 transition-colors cursor-pointer"
            >
              Owner Console &gt;
            </button>
          )}
        </div>
      </div>

      {/* Grid Stats Counters (REAL DATA ONLY) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setActiveActivityTab('saved')}
          className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 shadow-xs text-center cursor-pointer hover:border-blue-500/40 transition-colors"
        >
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {savedApps.length}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {t('profile.statsSaved', 'Tersimpan')}
          </div>
        </div>

        <div 
          onClick={() => setActiveActivityTab('downloads')}
          className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 shadow-xs text-center cursor-pointer hover:border-emerald-500/40 transition-colors"
        >
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {downloadHistory.length}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {t('profile.statsDownloads', 'Unduhan')}
          </div>
        </div>

        <div 
          onClick={() => setActiveActivityTab('reviews')}
          className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 shadow-xs text-center cursor-pointer hover:border-amber-500/40 transition-colors"
        >
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {myReviews.length}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {t('profile.statsReviews', 'Ulasan')}
          </div>
        </div>

        <div 
          onClick={() => setActiveActivityTab('reports')}
          className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 shadow-xs text-center cursor-pointer hover:border-purple-500/40 transition-colors"
        >
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {myReports.length}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {t('profile.statsReports', 'Laporan')}
          </div>
        </div>
      </div>

      {/* Section: Aktivitas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {t('profile.activity', 'Aktivitas')}
          </h2>
        </div>

        {/* Activity Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-px overflow-x-auto">
          {[
            { id: 'saved', label: `${t('profile.savedApps', 'Aplikasi tersimpan')} (${savedApps.length})` },
            { id: 'downloads', label: `${t('profile.downloadHistory', 'Riwayat unduhan')} (${downloadHistory.length})` },
            { id: 'reviews', label: `${t('profile.reviewHistory', 'Riwayat ulasan')} (${myReviews.length})` },
            { id: 'reports', label: `${t('profile.reportHistory', 'Riwayat laporan')} (${myReports.length})` },
          ].map((tab) => {
            const isActive = activeActivityTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveActivityTab(tab.id as ActivityTab)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {/* Sub-tab: Aplikasi Tersimpan */}
          {activeActivityTab === 'saved' && (
            <div>
              {savedApps.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-[#131924] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('common.emptyActivity', 'Belum ada aktivitas.')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {savedApps.map((app) => (
                    <div key={app.id} className="relative group/saved">
                      <AppCard
                        app={app}
                        onSelect={onSelectApp}
                        onDownload={onDownloadApp}
                        downloadHistory={downloadHistory}
                      />
                      {onRemoveBookmark && (
                        <button
                          type="button"
                          onClick={() => onRemoveBookmark(app.id)}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-red-500 rounded-lg shadow-xs border border-slate-200 dark:border-white/10 opacity-0 group-hover/saved:opacity-100 transition-opacity cursor-pointer"
                          title="Hapus simpanan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab: Riwayat Unduhan */}
          {activeActivityTab === 'downloads' && (
            <div>
              {downloadHistory.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-[#131924] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('common.emptyActivity', 'Belum ada aktivitas.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {downloadHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {item.appName.substring(0, 1)}
                        </div>
                        <div>
                          <h4 
                            onClick={() => onSelectApp(item.appSlug || item.appId)}
                            className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-500 cursor-pointer"
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

          {/* Sub-tab: Riwayat Ulasan */}
          {activeActivityTab === 'reviews' && (
            <div>
              {loadingReviews ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : myReviews.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-[#131924] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('common.emptyActivity', 'Belum ada aktivitas.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.appId, rev.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Hapus ulasan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab: Riwayat Laporan */}
          {activeActivityTab === 'reports' && (
            <div>
              {loadingReports ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : myReports.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-[#131924] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('common.emptyActivity', 'Belum ada aktivitas.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {rep.appName || 'Laporan Aplikasi'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          rep.status === 'resolved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/20'
                            : rep.status === 'investigating'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-500/20'
                            : rep.status === 'dismissed'
                            ? 'bg-slate-100 dark:bg-white/5 text-slate-500'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-500/20'
                        }`}>
                          {rep.status === 'resolved' ? 'Terselesaikan' : rep.status === 'investigating' ? 'Ditinjau' : rep.status === 'dismissed' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {rep.description}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {new Date(rep.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
