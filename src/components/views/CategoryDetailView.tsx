import React, { useState, useMemo } from 'react';
import { 
  Grid, ArrowLeft, Download, Star, Filter, 
  Layers, ArrowUpDown, Flame, Clock, Sparkles
} from 'lucide-react';
import { AppData } from '../../types';
import AppCard from '../AppCard';
import Breadcrumb from '../Breadcrumb';
import FollowSocialSection from '../FollowSocialSection';
import { slugToCategoryName, categoryToSlug } from '../../utils/categoryUtils';
import { CATEGORIES_METADATA } from './CategoriesView';

interface CategoryDetailViewProps {
  categorySlug?: string;
  categoryName?: string;
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onNavigate: (view: string, slug?: string) => void;
  onBack: () => void;
}

const ALPHABET = ['Semua', '#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export default function CategoryDetailView({
  categorySlug,
  categoryName: initialCategoryName,
  apps,
  onSelectApp,
  onDownloadApp,
  onNavigate,
  onBack
}: CategoryDetailViewProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'apps' | 'games'>('all');
  const [selectedSort, setSelectedSort] = useState<'popular' | 'latest' | 'rating' | 'downloads'>('popular');
  const [selectedLetter, setSelectedLetter] = useState('Semua');

  // Resolve category name from slug or name prop
  const categoryName = useMemo(() => {
    if (categorySlug) {
      return slugToCategoryName(categorySlug, apps);
    }
    return initialCategoryName || 'Kategori';
  }, [categorySlug, initialCategoryName, apps]);

  // Metadata description
  const categoryMeta = useMemo(() => {
    return CATEGORIES_METADATA.find(m => m.name.toLowerCase() === categoryName.toLowerCase());
  }, [categoryName]);

  // Filter apps strictly in this category
  const categoryApps = useMemo(() => {
    const slug = categoryToSlug(categoryName);
    return apps.filter(app => {
      const appCat = (app.category || '').trim();
      return categoryToSlug(appCat) === slug || appCat.toLowerCase() === categoryName.toLowerCase();
    });
  }, [apps, categoryName]);

  // Compute category statistics
  const stats = useMemo(() => {
    const totalApps = categoryApps.length;
    const totalDownloads = categoryApps.reduce((acc, a) => acc + (a.downloads || 0), 0);
    const rated = categoryApps.filter(a => (a.ratingAverage || a.rating || 0) > 0);
    const avgRating = rated.length > 0
      ? rated.reduce((acc, a) => acc + (a.ratingAverage || a.rating || 0), 0) / rated.length
      : 4.7;

    return {
      totalApps,
      totalDownloads,
      avgRating: Math.round(avgRating * 10) / 10
    };
  }, [categoryApps]);

  // Filtered and sorted apps
  const processedApps = useMemo(() => {
    let list = [...categoryApps];

    // Filter by type
    if (selectedType === 'games') {
      list = list.filter(a => a.category?.toLowerCase() === 'games' || a.category?.toLowerCase().includes('game'));
    } else if (selectedType === 'apps') {
      list = list.filter(a => a.category?.toLowerCase() !== 'games' && !a.category?.toLowerCase().includes('game'));
    }

    // Filter by alphabet
    if (selectedLetter !== 'Semua') {
      if (selectedLetter === '#') {
        list = list.filter(app => /^[0-9]/.test(app.name.trim()));
      } else {
        list = list.filter(app => app.name.trim().toUpperCase().startsWith(selectedLetter));
      }
    }

    // Sort
    list.sort((a, b) => {
      if (selectedSort === 'downloads') {
        return (b.downloads || 0) - (a.downloads || 0);
      }
      if (selectedSort === 'latest') {
        return new Date(b.updatedAt || b.releaseDate || 0).getTime() - new Date(a.updatedAt || a.releaseDate || 0).getTime();
      }
      if (selectedSort === 'rating') {
        return (b.ratingAverage || b.rating || 0) - (a.ratingAverage || a.rating || 0);
      }
      // default: popular
      const scoreA = (a.downloads || 0) + ((a.ratingAverage || a.rating || 4) * 100);
      const scoreB = (b.downloads || 0) + ((b.ratingAverage || b.rating || 4) * 100);
      return scoreB - scoreA;
    });

    return list;
  }, [categoryApps, selectedType, selectedLetter, selectedSort]);

  const formatDownloadCount = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}Miliar+`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}Jt+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}Rb+`;
    return `${num}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in" id="category-detail-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        paths={[
          { label: 'Beranda', view: 'home' },
          { label: 'Kategori', view: 'all-categories' },
          { label: categoryName }
        ]}
        onNavigate={onNavigate}
      />

      {/* Header / Category Identity Hero */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-[#131924] dark:via-[#111620] dark:to-blue-950/20 border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 shrink-0 select-none">
              <Grid className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                <Layers className="w-3 h-3" />
                Kategori Resmi
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {categoryName}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                {categoryMeta?.description || `Katalog aplikasi dan game Android terverifikasi aman untuk kategori ${categoryName}.`}
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>

        {/* Category Quick Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-200/80 dark:border-white/10 text-center">
          <div className="p-3 bg-white/80 dark:bg-white/[0.03] rounded-2xl border border-slate-150 dark:border-white/5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Aplikasi</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.totalApps}
            </p>
          </div>

          <div className="p-3 bg-white/80 dark:bg-white/[0.03] rounded-2xl border border-slate-150 dark:border-white/5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Unduhan</p>
            <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {formatDownloadCount(stats.totalDownloads)}
            </p>
          </div>

          <div className="p-3 bg-white/80 dark:bg-white/[0.03] rounded-2xl border border-slate-150 dark:border-white/5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Rata-Rata Rating</p>
            <p className="text-lg sm:text-xl font-black text-amber-500 mt-0.5 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {stats.avgRating}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Type Filter */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-white/5 self-start sm:self-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua ({categoryApps.length})
            </button>
            <button
              onClick={() => setSelectedType('apps')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'apps'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Aplikasi
            </button>
            <button
              onClick={() => setSelectedType('games')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'games'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Games
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              <option value="popular">Terpopuler</option>
              <option value="latest">Terbaru Rilis</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="downloads">Unduhan Terbanyak</option>
            </select>
          </div>
        </div>

        {/* Alphabet Filter Bar */}
        <div className="p-2 bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-x-auto scrollbar-none flex items-center gap-1 shadow-sm">
          {ALPHABET.map(letter => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedLetter === letter
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        {processedApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedApps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                onSelect={onSelectApp}
                onDownload={onDownloadApp}
                showUpdatedTime={true}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2">
            <Filter className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Tidak ada aplikasi ditemukan dengan filter yang dipilih.
            </p>
            <p className="text-xs text-slate-500">
              Coba ganti filter tipe aplikasi atau pilih abjad 'Semua'.
            </p>
            <button
              onClick={() => {
                setSelectedLetter('Semua');
                setSelectedType('all');
              }}
              className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Follow Mod Station */}
      <FollowSocialSection />
    </div>
  );
}
