import React, { useState } from 'react';
import { Trophy, Star, Download, ShieldCheck } from 'lucide-react';
import { AppData } from '../../types';
import { formatDownloads } from '../../utils/badges';

interface PopularViewProps {
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
}

export default function PopularView({
  apps,
  onSelectApp,
  onDownloadApp
}: PopularViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'apps' | 'games' | 'mod'>('all');

  // Sort apps by popularity / downloads
  const filteredApps = apps.filter(app => {
    if (activeFilter === 'apps') return app.category !== 'Games' && !app.isMod;
    if (activeFilter === 'games') return app.category === 'Games';
    if (activeFilter === 'mod') return app.isMod;
    return true;
  }).sort((a, b) => (b.downloads || 0) - (a.downloads || 0));

  const handleDownload = (e: React.MouseEvent, app: AppData) => {
    e.stopPropagation();
    if (onDownloadApp) {
      onDownloadApp(e, app);
    } else {
      onSelectApp(app.slug || app.id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8" id="popular-view-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Top Charts
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Aplikasi dan game Android paling populer dan banyak diunduh minggu ini.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'apps', label: 'Aplikasi' },
            { id: 'games', label: 'Game' },
            { id: 'mod', label: 'Mod APK' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apple App Store Top Charts Numbered List */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-slate-200/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
        {filteredApps.map((app, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;

          return (
            <div
              key={app.id}
              onClick={() => onSelectApp(app.slug || app.id)}
              className="p-4 sm:p-5 flex items-center gap-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
            >
              {/* Rank Number */}
              <div className="w-8 sm:w-10 text-center font-extrabold text-lg sm:text-xl shrink-0">
                <span className={isTop3 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}>
                  {rank}
                </span>
              </div>

              {/* App Squircle Icon */}
              <img
                src={app.iconUrl || app.icon}
                alt={app.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-[16px] object-cover shadow-2xs group-hover:scale-105 transition-transform shrink-0 border border-black/5 dark:border-white/10"
              />

              {/* App Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {app.name}
                  </h3>
                  {app.isMod && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      MOD
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {app.developerName || app.developer} • {app.category}
                </p>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-500" />
                    {(app.ratingAverage || app.rating || 0).toFixed(1)}
                  </span>
                  <span>•</span>
                  <span>{formatDownloads(app.downloads || 0)} unduhan</span>
                </div>
              </div>

              {/* GET Pill Button */}
              <button
                onClick={(e) => handleDownload(e, app)}
                className="px-5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 active:scale-95 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wide transition-all cursor-pointer shrink-0"
              >
                GET
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
