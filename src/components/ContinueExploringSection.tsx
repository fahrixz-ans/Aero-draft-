import React from 'react';
import { Compass, Clock, Bookmark, Search, ArrowRight, Trash2 } from 'lucide-react';
import { AppData, RecentlyViewedRecord, SearchHistoryRecord } from '../types';

interface ContinueExploringSectionProps {
  recentlyViewed?: RecentlyViewedRecord[];
  savedApps?: AppData[];
  savedAppIds?: string[];
  allApps?: AppData[];
  searchHistory?: SearchHistoryRecord[];
  recentSearches?: (SearchHistoryRecord | string)[];
  onSelectApp: (slug: string) => void;
  onSelectSearchQuery?: (query: string) => void;
  onSelectSearch?: (query: string) => void;
  onClearRecentlyViewed?: () => void;
  onClearHistory?: () => void;
  onNavigateToSaved?: () => void;
}

export default function ContinueExploringSection({
  recentlyViewed = [],
  savedApps,
  savedAppIds = [],
  allApps = [],
  searchHistory,
  recentSearches = [],
  onSelectApp,
  onSelectSearchQuery,
  onSelectSearch,
  onClearRecentlyViewed,
  onClearHistory,
  onNavigateToSaved
}: ContinueExploringSectionProps) {
  const effectiveSavedApps = savedApps || allApps.filter(a => savedAppIds.includes(a.id));
  const effectiveSearchHistory: SearchHistoryRecord[] = searchHistory || recentSearches.map(s => 
    typeof s === 'string' ? { query: s, searchedAt: new Date().toISOString() } : s
  );
  const handleSelectSearch = onSelectSearchQuery || onSelectSearch || (() => {});
  const handleClear = onClearRecentlyViewed || onClearHistory || (() => {});

  // If user has no recent history or saved apps, do not render this section (per requirements)
  if (recentlyViewed.length === 0 && effectiveSavedApps.length === 0 && effectiveSearchHistory.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 pt-2" id="home-continue-exploring">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
              Lanjutkan Eksplorasi
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              Akses cepat ke aplikasi yang baru saja Anda lihat, simpan, atau cari sebelumnya.
            </p>
          </div>
        </div>

        {recentlyViewed.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
            title="Bersihkan riwayat dilihat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Riwayat</span>
          </button>
        )}
      </div>

      {/* Grid of recently viewed apps */}
      {recentlyViewed.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Terakhir Dilihat
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recentlyViewed.slice(0, 6).map((item) => (
              <div
                key={item.appId}
                onClick={() => onSelectApp(item.appSlug || item.appId)}
                className="p-3 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col items-center text-center space-y-2"
              >
                {item.iconUrl ? (
                  <img
                    src={item.iconUrl}
                    alt={item.appName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-white/10 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {item.appName.substring(0, 1)}
                  </div>
                )}

                <div className="w-full">
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                    {item.appName}
                  </h5>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches chips */}
      {effectiveSearchHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Pencarian Terakhir Anda
          </h4>
          <div className="flex flex-wrap gap-2">
            {effectiveSearchHistory.slice(0, 8).map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSearch(s.query)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>{s.query}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
