import React, { useState } from 'react';
import { Clock, Star, Download, Sparkles, Filter, Calendar } from 'lucide-react';
import { AppData } from '../../types';
import AppCard from '../AppCard';

interface LatestViewProps {
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
}

export default function LatestView({
  apps,
  onSelectApp,
  onDownloadApp
}: LatestViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'apps' | 'games' | 'mod'>('all');

  const filteredApps = apps.filter(app => {
    if (activeFilter === 'apps') return app.category !== 'Games' && !app.isMod;
    if (activeFilter === 'games') return app.category === 'Games';
    if (activeFilter === 'mod') return app.isMod;
    return true;
  }).sort((a, b) => new Date(b.updatedAt || '2026-08-01').getTime() - new Date(a.updatedAt || '2026-08-01').getTime());

  const handleDownload = (e: React.MouseEvent, app: AppData) => {
    if (onDownloadApp) {
      onDownloadApp(e, app);
    } else {
      onSelectApp(app.slug || app.id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8" id="latest-view-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Rilis Terbaru
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Aplikasi dan game Android yang baru saja diperbarui atau ditambahkan ke Mod Station.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'apps', label: 'Aplikasi' },
            { id: 'games', label: 'Game' },
            { id: 'mod', label: 'Mod' }
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

      {/* Grid of Latest Apps */}
      {filteredApps.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#1c1c1e] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Tidak ada aplikasi ditemukan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onSelect={(s) => onSelectApp(s)}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
