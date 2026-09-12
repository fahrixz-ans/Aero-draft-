import React, { useState } from 'react';
import { Compass, Sparkles, Flame, TrendingUp, RefreshCw, Star, Layers, Filter } from 'lucide-react';
import BackButton from './navigation/BackButton';
import { AppData, DownloadHistoryRecord } from '../types';
import { CATEGORIES } from '../data/appsData';
import AppCard from './AppCard';

interface DiscoverFeedViewProps {
  apps?: AppData[];
  allApps?: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onSelectCategory?: (category: string) => void;
  onBackHome?: () => void;
  onBack?: () => void;
  onNavigate?: (view: string, slug?: string) => void;
  downloadHistory?: DownloadHistoryRecord[];
}

type DiscoverSort = 'trending' | 'popular' | 'rating' | 'newest';

export default function DiscoverFeedView({
  apps,
  allApps,
  onSelectApp,
  onDownloadApp,
  onSelectCategory,
  onBackHome,
  onBack,
  onNavigate,
  downloadHistory
}: DiscoverFeedViewProps) {
  const dataset = allApps || apps || [];
  const handleBack = onBack || onBackHome || (() => onNavigate?.('home'));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<DiscoverSort>('trending');
  const [displayCount, setDisplayCount] = useState<number>(12);

  // Filter apps
  const filteredApps = dataset.filter(app => {
    if (selectedCategory === 'all') return true;
    return app.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Sort apps
  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === 'popular') return (b.downloads || 0) - (a.downloads || 0);
    if (sortBy === 'rating') return (b.ratingAverage || b.rating || 0) - (a.ratingAverage || a.rating || 0);
    if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    // default trending
    return (b.downloads || 0) * 0.4 + (b.ratingAverage || 4) * 100 - ((a.downloads || 0) * 0.4 + (a.ratingAverage || 4) * 100);
  });

  const visibleApps = sortedApps.slice(0, displayCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="discover-feed-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          {handleBack && (
            <BackButton onBack={handleBack} label="Kembali ke Beranda" showText={true} className="mb-2" />
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Compass className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Eksplorasi & Penemuan Aplikasi</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Jelajahi seluruh arsip aplikasi Android terverifikasi dengan berbagai filter kategori dan peringkat.
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold self-start sm:self-auto">
          {[
            { id: 'trending', label: 'Tren', icon: Flame },
            { id: 'popular', label: 'Terpopuler', icon: TrendingUp },
            { id: 'rating', label: 'Rating', icon: Star },
            { id: 'newest', label: 'Terbaru', icon: RefreshCw }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSortBy(item.id as DiscoverSort)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  sortBy === item.id
                    ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories chips bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
          }`}
        >
          Semua Kategori ({apps.length})
        </button>

        {CATEGORIES.map((cat) => {
          const count = apps.filter(a => a.category.toLowerCase() === cat.toLowerCase()).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
              }`}
            >
              <span>{cat}</span>
              <span className="ml-1.5 text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Apps */}
      {visibleApps.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
          <p className="text-xs text-slate-500">Tidak ada aplikasi dalam kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {visibleApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onSelect={onSelectApp}
                onDownload={onDownloadApp}
                downloadHistory={downloadHistory}
              />
            ))}
          </div>

          {/* Load More Button */}
          {sortedApps.length > displayCount && (
            <div className="text-center pt-6">
              <button
                onClick={() => setDisplayCount(prev => prev + 12)}
                className="px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Muat Lebih Banyak ({sortedApps.length - displayCount} tersisa)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
