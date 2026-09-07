import React from 'react';
import { Star, Download, ShieldCheck, CheckCircle2, ArrowDownToLine } from 'lucide-react';
import { AppItem, mapAppToAppItem } from '../../types/intelligence';
import { AppData } from '../../types';

interface AppResultItemProps {
  id?: string;
  app: AppItem | AppData;
  onSelectApp: (slug: string) => void;
  onDownload?: (e: React.MouseEvent, item: AppItem) => void;
  searchHighlight?: string;
}

export const AppResultItem: React.FC<AppResultItemProps> = ({
  id,
  app,
  onSelectApp,
  onDownload,
  searchHighlight
}) => {
  // Normalize to canonical AppItem contract
  const item: AppItem = 'primaryCategory' in app ? (app as AppItem) : mapAppToAppItem(app as AppData);
  const elementId = id || `app-result-${item.id}`;

  const formatDownloads = (num: number = 0) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} jt+`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)} rb+`;
    return `${num}`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Ukuran bervariasi';
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(e, item);
    } else {
      onSelectApp(item.slug);
    }
  };

  return (
    <article
      id={elementId}
      onClick={() => onSelectApp(item.slug)}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* App Icon */}
        <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 p-0.5 shadow-sm">
          <img
            src={item.iconUrl || '/favicon.svg'}
            alt={`Ikon ${item.name}`}
            className="w-full h-full object-cover rounded-[14px]"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.svg';
            }}
          />
          {item.securityStatus === 'VERIFIED' && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-gray-900 shadow-sm" title="Terverifikasi Aman">
              <ShieldCheck className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* App Meta */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {item.name}
            </h3>
            {item.isFeatured && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 rounded">
                Pilihan
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {item.developerName}
          </p>

          {/* Stats Bar */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {item.rating?.toFixed(1) || '4.5'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3 text-gray-400" />
              {formatDownloads(item.totalDownloads)}
            </span>
            <span>•</span>
            <span>{formatSize(item.sizeBytes)}</span>
            <span>•</span>
            <span className="text-gray-400 truncate max-w-[120px]">{item.primaryCategory}</span>
          </div>

          {/* Short Description */}
          {item.shortDescription && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1.5">
              {item.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-3 sm:mt-0 sm:pl-4 shrink-0 flex items-center justify-end">
        <button
          id={`${elementId}-btn-download`}
          type="button"
          onClick={handleDownloadClick}
          aria-label={`Dapatkan APK ${item.name}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Dapatkan</span>
        </button>
      </div>
    </article>
  );
};
