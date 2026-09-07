import React, { useState, useEffect } from 'react';
import { Star, Download, ShieldCheck, Flame, Sparkles, RefreshCw, CheckCircle2, ArrowUpCircle, Check } from 'lucide-react';
import { AppData, DownloadHistoryRecord } from '../types';
import { calculateAppBadges, getRelativeTimeString } from '../utils/badges';
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
  // Helper for formatting downloads (e.g., 5B+, 100M+)
  const formatDownloads = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)}B+`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
    return num.toString();
  };

  // Resolve download history: either from props or fallback to guest history
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

  // Compute status based on user download history
  const downloadInfo = getAppDownloadStatus(app, localHistory);

  // Calculate dynamic computed badges with priority order
  const allBadges = calculateAppBadges(app);
  // Show max 2 general badges on card
  const visibleBadges = allBadges.slice(0, 2);

  // Border & glow accent classes depending on download state
  const borderClasses = downloadInfo.hasUpdate
    ? 'border-amber-400/50 dark:border-amber-500/40 hover:border-amber-500 hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.18)] dark:hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.22)]'
    : downloadInfo.isDownloaded
    ? 'border-emerald-300/60 dark:border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.14)] dark:hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.18)]'
    : 'border-slate-100 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/40 hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.08)] dark:hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.12)]';

  return (
    <div
      onClick={() => onSelect(app.slug)}
      id={`app-card-${app.id}`}
      className={`group relative p-4 bg-white dark:bg-white/[0.03] border rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer active:scale-[0.99] select-none overflow-hidden ${borderClasses}`}
    >
      {/* Dynamic decorative backdrop subtle gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-300 ${
        downloadInfo.hasUpdate
          ? 'from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:to-amber-500/[0.03] dark:group-hover:to-amber-500/[0.02]'
          : downloadInfo.isDownloaded
          ? 'from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:to-emerald-500/[0.03] dark:group-hover:to-emerald-500/[0.02]'
          : 'from-blue-50/0 via-blue-50/0 to-blue-500/0 group-hover:to-blue-500/[0.02] dark:group-hover:to-blue-500/[0.015]'
      }`} />

      {/* Top Badges Bar */}
      {(downloadInfo.isDownloaded || visibleBadges.length > 0) && (
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 mb-2.5">
          {/* Visual Download / Update Status Badge (Priority #1) */}
          {downloadInfo.hasUpdate ? (
            <span
              id={`app-card-badge-update-${app.id}`}
              title={`Pembaruan tersedia! Versi yang Anda unduh: v${downloadInfo.downloadedVersion} • Versi terbaru: v${downloadInfo.latestVersion}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-xs animate-pulse-subtle"
            >
              <ArrowUpCircle className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
              Update Tersedia
            </span>
          ) : downloadInfo.isDownloaded ? (
            <span
              id={`app-card-badge-downloaded-${app.id}`}
              title={`Aplikasi ini sudah pernah Anda unduh (v${downloadInfo.downloadedVersion})`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs"
            >
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              Terunduh
            </span>
          ) : null}

          {/* Standard app badges (verified, popular, featured, etc.) */}
          {visibleBadges.map((b) => (
            <span
              key={b.type}
              title={b.description}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${b.colorClass}`}
            >
              {b.type === 'verified' && <CheckCircle2 className="h-2.5 w-2.5" />}
              {b.type === 'popular' && <Flame className="h-2.5 w-2.5" />}
              {b.type === 'featured' && <Sparkles className="h-2.5 w-2.5" />}
              {b.type === 'updated' && <RefreshCw className="h-2.5 w-2.5" />}
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 flex items-start gap-4 mb-4">
        {/* App Icon Container */}
        <div className="relative shrink-0">
          <img
            src={app.iconUrl || app.icon}
            alt={`${app.name} Icon`}
            referrerPolicy="no-referrer"
            className="w-14 h-14 object-cover rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-105 group-hover:rotate-1 transition-all duration-300"
          />

          {/* Corner Indicator for Update or Downloaded status */}
          {downloadInfo.hasUpdate ? (
            <div
              title={`Update tersedia: v${downloadInfo.downloadedVersion} ➔ v${downloadInfo.latestVersion}`}
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-white items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                <ArrowUpCircle className="h-2.5 w-2.5 stroke-[3]" />
              </span>
            </div>
          ) : downloadInfo.isDownloaded ? (
            <div
              title={`Aplikasi pernah diunduh (v${downloadInfo.downloadedVersion})`}
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 rounded-full bg-emerald-600 text-white items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs"
            >
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
          ) : null}

          {/* Safe/Verified badge overlay */}
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 border border-blue-100 dark:border-blue-950/80 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
          </div>
        </div>
 
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-slate-850 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate leading-snug">
            {app.name}
          </h3>
          
          <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
            {app.developerName || app.developer}
          </p>

          {/* Details row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 rounded-md border border-slate-100/50 dark:border-slate-800">
              {app.category}
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              • {app.version}
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              • {app.size}
            </span>
          </div>

          {/* Dynamic status note based on user download history */}
          {downloadInfo.hasUpdate ? (
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1 leading-tight">
              <ArrowUpCircle className="h-3 w-3 shrink-0 stroke-[2.5]" />
              <span>v{downloadInfo.downloadedVersion} ➔ v{downloadInfo.latestVersion} tersedia</span>
            </p>
          ) : downloadInfo.isDownloaded ? (
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 leading-tight">
              <CheckCircle2 className="h-3 w-3 shrink-0 stroke-[2.5]" />
              <span>Pernah diunduh (v{downloadInfo.downloadedVersion})</span>
            </p>
          ) : showUpdatedTime ? (
            <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1.5 flex items-center gap-1">
              <RefreshCw className="h-3 w-3 shrink-0" />
              Diperbarui {getRelativeTimeString(app.updatedAt)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Footer statistics and Action */}
      <div className="relative z-10 mt-auto pt-3 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
        {/* Ratings and Stats */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center text-amber-500 font-bold text-xs gap-0.5">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>{app.rating.toFixed(1)}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {formatDownloads(app.downloads)} dwnld
          </span>
        </div>

        {/* Action Button tailored to download status */}
        {downloadInfo.hasUpdate ? (
          <button
            onClick={(e) => onDownload(e, app)}
            id={`app-card-btn-${app.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white dark:hover:text-white border border-amber-500/30 transition-all duration-200 shadow-xs font-bold text-xs cursor-pointer"
            title={`Perbarui Aplikasi ke v${downloadInfo.latestVersion} (versi Anda: v${downloadInfo.downloadedVersion})`}
          >
            <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Update</span>
          </button>
        ) : downloadInfo.isDownloaded ? (
          <button
            onClick={(e) => onDownload(e, app)}
            id={`app-card-btn-${app.id}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white dark:hover:text-white border border-emerald-500/25 transition-all duration-200 shadow-xs font-semibold text-xs cursor-pointer"
            title={`Sudah terunduh (v${downloadInfo.downloadedVersion}) • Klik untuk mengunduh ulang`}
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Unduh Ulang</span>
          </button>
        ) : (
          <button
            onClick={(e) => onDownload(e, app)}
            id={`app-card-btn-${app.id}`}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 transition-all duration-200 shadow-sm cursor-pointer"
            title="Unduh APK Langsung"
          >
            <Download className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
}

