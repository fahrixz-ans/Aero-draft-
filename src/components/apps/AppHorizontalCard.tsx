import React from 'react';
import { Star, Download, ShieldCheck, ArrowDownToLine } from 'lucide-react';
import { AppItem, mapAppToAppItem } from '../../types/intelligence';
import { AppData } from '../../types';

interface AppHorizontalCardProps {
  id?: string;
  app: AppItem | AppData;
  onSelectApp: (slug: string) => void;
  onDownload?: (e: React.MouseEvent, item: AppItem) => void;
}

export const AppHorizontalCard: React.FC<AppHorizontalCardProps> = ({
  id,
  app,
  onSelectApp,
  onDownload
}) => {
  const item: AppItem = 'primaryCategory' in app ? (app as AppItem) : mapAppToAppItem(app as AppData);
  const elementId = id || `app-horizontal-${item.id}`;

  const formatDownloads = (num: number = 0) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} jt+`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)} rb+`;
    return `${num}`;
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
    <div
      id={elementId}
      onClick={() => onSelectApp(item.slug)}
      className="group relative flex items-center justify-between p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-xs transition-all cursor-pointer min-w-[280px]"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
        <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 p-0.5">
          <img
            src={item.iconUrl || '/favicon.svg'}
            alt={item.name}
            className="w-full h-full object-cover rounded-[10px]"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.svg';
            }}
          />
          {item.securityStatus === 'VERIFIED' && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 border border-white dark:border-gray-900 shadow-2xs">
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.name}
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {item.developerName}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            <span className="flex items-center gap-0.5 font-medium text-gray-700 dark:text-gray-300">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {item.rating?.toFixed(1) || '4.5'}
            </span>
            <span>•</span>
            <span>{formatDownloads(item.totalDownloads)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownloadClick}
        className="shrink-0 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg transition-colors"
      >
        Dapatkan
      </button>
    </div>
  );
};
