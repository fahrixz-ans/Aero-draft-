import React, { useState } from 'react';
import { Bookmark, Trash2, Bell, Layers, Sparkles, RefreshCw, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import BackButton from './navigation/BackButton';
import { AppData, FollowedCategoryEntry, DownloadHistoryRecord } from '../types';
import AppCard from './AppCard';

interface SavedAppsViewProps {
  savedApps: AppData[];
  followedApps?: AppData[];
  followedCategories?: FollowedCategoryEntry[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onRemoveBookmark: (appId: string) => void;
  onUnfollowApp?: (appId: string) => void;
  onUnfollowCategory?: (categoryName: string) => void;
  onSelectCategory?: (categoryName: string) => void;
  onBackHome?: () => void;
  onBack?: () => void;
  downloadHistory?: DownloadHistoryRecord[];
}

type MainTab = 'saved' | 'followed_apps' | 'followed_categories';
type SavedFilter = 'all' | 'updates' | 'recent';

export default function SavedAppsView({
  savedApps,
  followedApps = [],
  followedCategories = [],
  onSelectApp,
  onDownloadApp,
  onRemoveBookmark,
  onUnfollowApp,
  onUnfollowCategory,
  onSelectCategory,
  onBackHome,
  onBack,
  downloadHistory
}: SavedAppsViewProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('saved');
  const [savedFilter, setSavedFilter] = useState<SavedFilter>('all');

  // Filter saved apps
  const filteredSavedApps = savedApps.filter(app => {
    if (savedFilter === 'updates') {
      // Apps with recent updates (or version comparison)
      return new Date(app.updatedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const updateCount = savedApps.filter(app => new Date(app.updatedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="saved-apps-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          {(onBack || onBackHome) && (
            <BackButton onBack={onBack || onBackHome} label="Kembali" showText={true} className="mb-2" />
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bookmark className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Koleksi Saya</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola aplikasi tersimpan, pantau rilis pembaruan, dan ikuti kategori favorit Anda.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Tersimpan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/20">
              {savedApps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('followed_apps')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'followed_apps'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Diikuti</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/20">
              {followedApps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('followed_categories')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'followed_categories'
                ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kategori</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/20">
              {followedCategories.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: SAVED APPS */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          {/* Sub-filter chips */}
          {savedApps.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSavedFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    savedFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  Semua ({savedApps.length})
                </button>
                <button
                  onClick={() => setSavedFilter('updates')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    savedFilter === 'updates'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Ada Pembaruan ({updateCount})</span>
                </button>
              </div>

              {updateCount > 0 && (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{updateCount} aplikasi memiliki rilis versi baru dalam 30 hari terakhir.</span>
                </div>
              )}
            </div>
          )}

          {filteredSavedApps.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto px-4 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                {savedFilter === 'updates' ? 'Belum ada pembaruan versi baru.' : 'Belum ada aplikasi tersimpan.'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {savedFilter === 'updates'
                  ? 'Semua aplikasi tersimpan Anda sudah berada pada versi terbarunya.'
                  : 'Simpan aplikasi yang ingin Anda akses lagi nanti dengan menekan tombol Simpan di halaman aplikasi.'}
              </p>
              {onBackHome && (
                <button
                  onClick={onBackHome}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Jelajahi Aplikasi Sekarang
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSavedApps.map((app) => (
                <div key={app.id} className="relative group/saved flex flex-col">
                  <AppCard
                    app={app}
                    onSelect={onSelectApp}
                    onDownload={onDownloadApp}
                    downloadHistory={downloadHistory}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBookmark(app.id);
                    }}
                    title="Hapus dari simpanan"
                    aria-label={`Hapus ${app.name} dari daftar simpanan`}
                    className="absolute top-2 right-2 z-20 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 shadow-sm border border-slate-200 dark:border-white/10 opacity-0 group-hover/saved:opacity-100 transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FOLLOWED APPS */}
      {activeTab === 'followed_apps' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aplikasi yang Anda ikuti akan memberikan notifikasi otomatis setiap kali ada pembaruan versi atau changelog baru.
          </p>

          {followedApps.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto px-4 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                Belum mengikuti aplikasi apa pun.
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Klik tombol <strong>Ikuti Aplikasi</strong> pada halaman detail aplikasi untuk menerima pemberitahuan versi rilis berikutnya secara tepat waktu.
              </p>
              {onBackHome && (
                <button
                  onClick={onBackHome}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Cari Aplikasi untuk Diikuti
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {followedApps.map((app) => (
                <div key={app.id} className="relative group/followed flex flex-col">
                  <AppCard
                    app={app}
                    onSelect={onSelectApp}
                    onDownload={onDownloadApp}
                    downloadHistory={downloadHistory}
                  />
                  {onUnfollowApp && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnfollowApp(app.id);
                      }}
                      title="Berhenti Mengikuti"
                      aria-label={`Berhenti mengikuti ${app.name}`}
                      className="absolute top-2 right-2 z-20 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 shadow-sm border border-slate-200 dark:border-white/10 opacity-0 group-hover/followed:opacity-100 transition-all duration-200 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FOLLOWED CATEGORIES */}
      {activeTab === 'followed_categories' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dapatkan rekomendasi cerdas dan pembaruan rilis dari kategori-kategori yang paling Anda sukai.
          </p>

          {followedCategories.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto px-4 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900/30">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                Belum mengikuti kategori apa pun.
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Ikuti kategori seperti <strong>Produktivitas</strong>, <strong>Media Sosial</strong>, atau <strong>Tools</strong> untuk menerima rekomendasi yang lebih relevan.
              </p>
              {onBackHome && (
                <button
                  onClick={onBackHome}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Jelajahi Kategori
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {followedCategories.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="p-5 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {cat.categoryName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Diikuti sejak {new Date(cat.followedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectCategory && (
                      <button
                        onClick={() => onSelectCategory(cat.categoryName)}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Lihat</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onUnfollowCategory && (
                      <button
                        onClick={() => onUnfollowCategory(cat.categoryName)}
                        title="Berhenti Mengikuti Kategori"
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
