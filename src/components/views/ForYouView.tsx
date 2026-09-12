import React from 'react';
import { Sparkles, Star, Download, LogIn, History, TrendingUp, Flame } from 'lucide-react';
import { AppData, DownloadHistoryItem } from '../../types';

interface ForYouViewProps {
  apps: AppData[];
  user: any;
  downloadHistory?: DownloadHistoryItem[];
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
  onSignIn?: () => void;
}

export default function ForYouView({
  apps,
  user,
  downloadHistory = [],
  onSelectApp,
  onDownloadApp,
  onSignIn
}: ForYouViewProps) {
  const recommendedApps = apps.slice(0, 6);
  const historyBased = apps.slice(2, 8);
  const recentlyUpdated = apps.slice(4, 10);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" id="for-you-view-container">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2 border border-blue-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Personalisasi Berbasis AI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Disarankan Untuk Anda
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Koleksi aplikasi dan game yang disesuaikan secara khusus dengan preferensi penggunaan dan unduhan Anda.
        </p>
      </div>

      {/* Guest Sign-in prompt if not authenticated */}
      {!user && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-cyan-600/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Dapatkan Rekomendasi Lebih Akurat
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Masuk ke akun Mod Station Anda untuk menyinkronkan riwayat unduhan di semua perangkat.
              </p>
            </div>
          </div>

          {onSignIn && (
            <button
              onClick={onSignIn}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Sekarang</span>
            </button>
          )}
        </div>
      )}

      {/* Section 1: Recommended Apps */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Pilihan Utama Minggu Ini
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedApps.map((app) => (
            <div
              key={app.id}
              onClick={() => onSelectApp(app.slug)}
              className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={app.icon}
                  alt={app.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {app.category} • {app.size}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span>{app.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectApp(app.slug);
                }}
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Based on Activity / Category */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Berdasarkan Minat Kategori Anda
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {historyBased.map((app) => (
            <div
              key={app.id}
              onClick={() => onSelectApp(app.slug)}
              className="p-4 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={app.icon}
                  alt={app.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {app.category} • {app.size}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span>{app.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectApp(app.slug);
                }}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
