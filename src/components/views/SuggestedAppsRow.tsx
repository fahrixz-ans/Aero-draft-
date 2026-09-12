import React from 'react';
import { Star, Download, Sparkles, ChevronRight } from 'lucide-react';
import { AppData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SuggestedAppsRowProps {
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
  onViewAll?: () => void;
}

export default function SuggestedAppsRow({
  apps,
  onSelectApp,
  onDownloadApp,
  onViewAll
}: SuggestedAppsRowProps) {
  const { t } = useLanguage();
  // Take top 8 apps for the shelf
  const suggestedList = apps.slice(0, 10);

  return (
    <section className="my-6" id="suggested-for-you-section">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {t('home.suggestedForYou', 'Disarankan Untuk Anda')}
          </h2>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{t('common.viewAll', 'Lihat semua')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Scroll Shelf */}
      <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar scroll-smooth">
        {suggestedList.map((app) => (
          <div
            key={app.id}
            onClick={() => onSelectApp(app.slug)}
            className="shrink-0 w-32 sm:w-36 p-3 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center select-none"
          >
            {/* App Icon */}
            <div className="relative mb-2.5">
              <img
                src={app.icon}
                alt={app.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover shadow-xs group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              {app.isMod && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-cyan-500 text-white font-black text-[9px] rounded-md shadow-xs">
                  MOD
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {app.name}
            </h3>

            {/* Category / Size */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 w-full mt-0.5 font-medium">
              {app.category} • {app.size}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{app.rating.toFixed(1)}</span>
            </div>

            {/* Direct Action Indicator */}
            <div className="mt-3 w-full pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-center">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{t('common.download', 'Unduh')}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
