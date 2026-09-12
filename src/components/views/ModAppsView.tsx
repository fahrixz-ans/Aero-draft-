import React, { useState } from 'react';
import { AppData } from '../../types';
import AppCard from '../AppCard';

interface ModAppsViewProps {
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
}

export default function ModAppsView({
  apps,
  onSelectApp,
  onDownloadApp
}: ModAppsViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'premium' | 'no-ads' | 'unlimited'>('all');

  const modApps = apps.filter(app => app.isMod || app.id === 'capcut' || app.id === 'spotify' || app.id === 'whatsapp' || app.id === 'instagram' || app.id === 'tiktok');

  const handleDownload = (e: React.MouseEvent, app: AppData) => {
    if (onDownloadApp) {
      onDownloadApp(e, app);
    } else {
      onSelectApp(app.slug || app.id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8" id="mod-apps-view-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Koleksi Mod APK
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Aplikasi dengan fitur tambahan dan performa optimal terverifikasi aman.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'premium', label: 'Premium' },
            { id: 'no-ads', label: 'Bebas Iklan' },
            { id: 'unlimited', label: 'Unlocked' }
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

      {/* Grid */}
      {modApps.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#1c1c1e] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Tidak ada aplikasi modifikasi ditemukan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modApps.map((app) => (
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
