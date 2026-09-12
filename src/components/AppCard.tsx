import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, ArrowUpCircle, Check } from 'lucide-react';
import { AppData, DownloadHistoryRecord } from '../types';
import { calculateAppBadges } from '../utils/badges';
import { getAppDownloadStatus } from '../utils/downloadStatus';
import { getGuestDownloadHistory } from '../services/userService';

interface AppCardProps {
  key?: string;
  app: AppData;
  onSelect: (slug: string) => void;
  onDownload: (e: React.MouseEvent, app: AppData) => void;
  showUpdatedTime?: boolean;
  downloadHistory?: DownloadHistoryRecord[];
}

export default function AppCard({
  app,
  onSelect,
  onDownload,
  showUpdatedTime = false,
  downloadHistory
}: AppCardProps) {
  // Resolve download history
  const [localHistory, setLocalHistory] = useState<DownloadHistoryRecord[]>(() => {
    return downloadHistory && downloadHistory.length > 0 ? downloadHistory : getGuestDownloadHistory();
  });

  useEffect(() => {
    if (downloadHistory && downloadHistory.length > 0) {
      setLocalHistory(downloadHistory);
    }
  }, [downloadHistory]);

  useEffect(() => {
    const handleHistoryUpdate = () => {
      if (!downloadHistory || downloadHistory.length === 0) {
        setLocalHistory(getGuestDownloadHistory());
      }
    };
    window.addEventListener('aero:download-history-updated', handleHistoryUpdate);
    return () => window.removeEventListener('aero:download-history-updated', handleHistoryUpdate);
  }, [downloadHistory]);

  const downloadInfo = getAppDownloadStatus(app, localHistory);

  return (
    <div
      onClick={() => onSelect(app.slug)}
      id={`app-card-${app.id}`}
      className="group relative flex items-center justify-between gap-3.5 p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 cursor-pointer select-none active:scale-[0.99]"
    >
      {/* Left: App Icon + App Hierarchy Details */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* App Squircle Icon */}
        <div className="relative shrink-0">
          <img
            src={app.iconUrl || app.icon}
            alt={app.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-[14px] bg-slate-100 dark:bg-slate-800 shadow-2xs border border-black/5 dark:border-white/10 transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
          />
          {downloadInfo.hasUpdate ? (
            <span 
              title="Update tersedia"
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white dark:border-[#1c1c1e]"
            >
              <ArrowUpCircle className="w-3 h-3 stroke-[3]" />
            </span>
          ) : downloadInfo.isDownloaded ? (
            <span 
              title="Terunduh"
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-[#1c1c1e]"
            >
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          ) : null}
        </div>

        {/* Content Hierarchy: Name -> Subtitle -> Developer/Category */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {app.name}
          </h3>
          
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
            {app.description || `${app.category} App`}
          </p>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="truncate max-w-[120px]">
              {app.developerName || app.developer}
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5 font-medium text-slate-600 dark:text-slate-300">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
              {app.rating.toFixed(1)}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline truncate">
              {app.size}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Apple App Store GET / Pill Button */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        {downloadInfo.hasUpdate ? (
          <button
            onClick={(e) => onDownload(e, app)}
            id={`app-card-btn-${app.id}`}
            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
            title={`Perbarui ke v${downloadInfo.latestVersion}`}
          >
            UPDATE
          </button>
        ) : downloadInfo.isDownloaded ? (
          <button
            onClick={(e) => onDownload(e, app)}
            id={`app-card-btn-${app.id}`}
            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-blue-600 dark:text-blue-400 transition-all cursor-pointer"
            title="Unduh Ulang"
          >
            UNDUH
          </button>
        ) : (
          <button
            onClick={(e) => onDownload(e, app)}
            id={`app-card-btn-${app.id}`}
            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-white/10 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 transition-all cursor-pointer"
            title="Unduh Aplikasi"
          >
            GET
          </button>
        )}

        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
          In-App Purchases
        </span>
      </div>
    </div>
  );
}
