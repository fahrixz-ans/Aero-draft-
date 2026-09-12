import React from 'react';
import { Star, Bookmark, Share2, AlertCircle, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { AppData } from '../types';
import { developerToSlug } from '../utils/developerUtils';
import { categoryToSlug } from '../utils/categoryUtils';

interface AppDetailHeaderProps {
  app: AppData;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  onShare: () => void;
  onReport: (preselectedType?: any) => void;
  onTriggerDownload?: () => void;
  onNavigateDeveloper?: (slug: string) => void;
  onNavigateCategory?: (slug: string) => void;
}

function formatDownloads(count: number): string {
  if (!count || count <= 0) return '0';
  if (count >= 1000000000) {
    return `${(count / 1000000000).toFixed(0)} M+`;
  }
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(0)} jt+`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)} rb+`;
  }
  return `${count}`;
}

export default function AppDetailHeader({
  app,
  isBookmarked,
  onToggleBookmark,
  onShare,
  onReport,
  onTriggerDownload,
  onNavigateDeveloper,
  onNavigateCategory
}: AppDetailHeaderProps) {
  const developerName = app.developerName || app.developer || 'Developer';
  const devSlug = developerToSlug(developerName);
  const categoryName = app.category || 'Aplikasi';
  const catSlug = categoryToSlug(categoryName);

  const effectiveRating = (app.ratingAverage || app.rating || 0).toFixed(1);
  const reviewCount = app.ratingCount || 0;
  const appSize = app.size || '35 MB';
  const contentRating = app.contentRating || '3+';
  const downloadCount = formatDownloads(app.downloads || 0);

  const handleDevClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateDeveloper) {
      onNavigateDeveloper(devSlug);
    } else {
      window.location.hash = `/apps/developer/${devSlug}`;
    }
  };

  const handleCatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateCategory) {
      onNavigateCategory(catSlug);
    } else {
      window.location.hash = `/apps/category/${catSlug}`;
    }
  };

  return (
    <div className="space-y-6 pb-6 border-b border-slate-200/80 dark:border-white/10" id="app-detail-header-block">
      {/* Detail Main Info: App Squircle Icon | App Name, Developer, Category, GET pill */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <img
          src={app.iconUrl || app.icon}
          alt={app.name}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-[24px] border border-black/5 dark:border-white/10 shadow-sm object-cover shrink-0 select-none bg-slate-100 dark:bg-slate-800"
          referrerPolicy="no-referrer"
        />

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {app.name}
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              {app.description ? app.description.slice(0, 100) : `${categoryName} untuk Android`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs">
            <button
              onClick={handleDevClick}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer transition-colors"
              aria-label={`Lihat developer ${developerName}`}
            >
              {developerName}
            </button>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <button
              onClick={handleCatClick}
              className="font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
              aria-label={`Kategori ${categoryName}`}
            >
              {categoryName}
            </button>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            {/* Apple App Store GET / Download pill */}
            <button
              onClick={onTriggerDownload}
              className="px-7 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              aria-label="Unduh APK aplikasi"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>GET</span>
            </button>

            {/* Simpan / Bookmark */}
            <button
              onClick={onToggleBookmark}
              className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                isBookmarked
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
              title={isBookmarked ? 'Tersimpan' : 'Simpan Aplikasi'}
              aria-label="Simpan aplikasi"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Bagikan */}
            <button
              onClick={onShare}
              className="p-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center"
              title="Bagikan Tautan Aplikasi"
              aria-label="Bagikan aplikasi"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Laporkan */}
            <button
              onClick={() => onReport('general_issue')}
              className="p-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer flex items-center justify-center"
              title="Laporkan Kendala"
              aria-label="Laporkan aplikasi"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Apple App Store Product Metrics Shelf (Rating | Age | Category | Size) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 py-3 px-2 border-y border-slate-200/80 dark:border-white/10 text-center select-none">
        {/* Metric 1: Rating */}
        <div className="flex flex-col items-center justify-center border-r border-slate-200 dark:border-white/10 pr-2">
          <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            {reviewCount > 0 ? `${reviewCount} PENILAIAN` : 'RATING'}
          </span>
          <div className="flex items-center gap-1 text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            <span>{effectiveRating}</span>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          </div>
        </div>

        {/* Metric 2: Age Rating */}
        <div className="flex flex-col items-center justify-center border-r border-slate-200 dark:border-white/10 px-2">
          <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            USIA
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {contentRating}
          </span>
        </div>

        {/* Metric 3: Category */}
        <div className="flex flex-col items-center justify-center border-r border-slate-200 dark:border-white/10 px-2">
          <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            BAGIAN
          </span>
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-full">
            {categoryName}
          </span>
        </div>

        {/* Metric 4: Size */}
        <div className="flex flex-col items-center justify-center pl-2">
          <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            UKURAN
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-full">
            {appSize}
          </span>
        </div>
      </div>
    </div>
  );
}
