import React, { useState } from 'react';
import { Star, Bookmark, Share2, AlertCircle, Download, ExternalLink, Bell, Check } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppData } from '../types';
import { trackEvent, recordUserInteraction } from '../services';

interface AppDetailHeaderProps {
  app: AppData;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  onShare: () => void;
  onReport: (preselectedType?: any) => void;
}

// 1. AppIdentity Component
export function AppIdentity({ app }: { app: AppData }) {
  const developerName = app.developerName || app.developer || 'Developer tidak diketahui';
  return (
    <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4" id="app-detail-identity">
      {/* AppIcon */}
      <img
        src={app.iconUrl || app.icon}
        alt={`${app.name} Icon`}
        referrerPolicy="no-referrer"
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] border border-slate-100 dark:border-white/10 shadow-md object-cover shrink-0 select-none"
        id="app-detail-icon"
      />
      {/* Title & Developer */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none" id="app-detail-title">
          {app.name}
        </h1>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400" id="app-detail-developer">
          By {developerName}
        </p>
      </div>
    </div>
  );
}

// Helper to format downloads cleanly
function formatDownloads(count: number): string {
  if (!count || count <= 0) return 'Belum ada data unduhan';
  if (count >= 1000000000) {
    return `${(count / 1000000000).toFixed(0)}B+ unduhan`;
  }
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(0)}M+ unduhan`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K+ unduhan`;
  }
  return `${count} unduhan`;
}

// 2. AppMeta Component
export function AppMeta({ app }: { app: AppData }) {
  const hasRealRating = (app.ratingCount !== undefined && app.ratingCount > 0) || (app.ratingAverage !== undefined && app.ratingAverage > 0);
  const effectiveRating = app.ratingAverage || app.rating || 0;
  const ratingText = hasRealRating ? `★ ${effectiveRating.toFixed(1)}` : 'Belum ada rating';
  const categoryText = app.category || '';
  const downloadCountText = app.downloads ? formatDownloads(app.downloads) : 'Belum ada data unduhan';

  const parts: string[] = [];
  parts.push(ratingText);
  if (categoryText) {
    parts.push(categoryText);
  }
  if (app.downloads) {
    parts.push(downloadCountText);
  } else {
    parts.push('Belum ada data unduhan');
  }

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400" id="app-detail-meta">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <span className={part.startsWith('★') ? 'text-amber-500 font-black' : ''}>{part}</span>
          {index < parts.length - 1 && <span className="text-slate-300 dark:text-white/10 px-0.5">·</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// 3. AppActions Component
export function AppActions({
  isBookmarked,
  onToggleBookmark,
  isFollowed,
  onToggleFollow,
  onShare,
  onReport
}: {
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  onShare: () => void;
  onReport: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="grid grid-cols-4 max-w-md mx-auto sm:mx-0 w-full border-t border-b border-slate-100 dark:border-white/5 py-4 my-2 select-none gap-1" id="app-detail-actions">
      {/* Save Button */}
      <button
        onClick={onToggleBookmark}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={isBookmarked ? 'Hapus aplikasi dari simpanan' : 'Simpan aplikasi'}
        className="flex flex-col items-center justify-center gap-1.5 group cursor-pointer text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
      >
        <Bookmark className={`h-4.5 w-4.5 transition-transform group-active:scale-95 ${isBookmarked ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400' : ''}`} />
        <span className="text-[10.5px] font-black truncate max-w-full">
          {isBookmarked ? (hovered ? 'Hapus' : 'Tersimpan') : 'Simpan'}
        </span>
      </button>

      {/* Follow App for updates */}
      {onToggleFollow && (
        <button
          onClick={onToggleFollow}
          aria-label={isFollowed ? 'Berhenti mengikuti update' : 'Ikuti pembaruan aplikasi'}
          className="flex flex-col items-center justify-center gap-1.5 group cursor-pointer text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors focus:outline-none"
        >
          <Bell className={`h-4.5 w-4.5 transition-transform group-active:scale-95 ${isFollowed ? 'fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400' : ''}`} />
          <span className="text-[10.5px] font-black truncate max-w-full">
            {isFollowed ? 'Mengikuti' : 'Ikuti'}
          </span>
        </button>
      )}

      {/* Share Button */}
      <button
        onClick={onShare}
        aria-label="Bagikan tautan aplikasi"
        className="flex flex-col items-center justify-center gap-1.5 group cursor-pointer text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
      >
        <Share2 className="h-4.5 w-4.5 transition-transform group-active:scale-95" />
        <span className="text-[10.5px] font-black truncate max-w-full">Bagikan</span>
      </button>

      {/* Report Button */}
      <button
        onClick={onReport}
        aria-label="Laporkan kendala aplikasi"
        className="flex flex-col items-center justify-center gap-1.5 group cursor-pointer text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
      >
        <AlertCircle className="h-4.5 w-4.5 transition-transform group-active:scale-95" />
        <span className="text-[10.5px] font-black truncate max-w-full">Laporkan</span>
      </button>
    </div>
  );
}

// 4. PrimaryAction Component
export function PrimaryAction({ 
  app,
  onReportProblem
}: { 
  app: AppData;
  onReportProblem?: (type: string) => void;
}) {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState<boolean>(false);

  const isHostedApk = app.sourceType === 'apk' || (!app.sourceType && !!app.downloadUrl && !app.officialDownloadUrl);
  const primaryUrl = isHostedApk
    ? (app.apkFileUrl || app.downloadUrl)
    : (app.officialUrl || app.officialDownloadUrl || app.downloadUrl);

  const handleActionClick = () => {
    if (!isHostedApk) {
      if (primaryUrl) {
        trackEvent('official_link_click', { appId: app.id, versionId: app.version });
        recordUserInteraction('view', app);
        window.open(primaryUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // Hosted APK workflow
    setDownloadStatus('loading');
    setShowFeedbackPrompt(false);

    trackEvent('download_started', { appId: app.id, versionId: app.version });
    recordUserInteraction('download', app);

    if (app.id) {
      try {
        const appRef = doc(db, 'applications', app.id);
        updateDoc(appRef, { downloads: increment(1) }).catch(e => console.warn('Download increment error:', e));
      } catch (countErr) {
        console.warn('Could not increment downloads in Firestore:', countErr);
      }
    }

    setTimeout(() => {
      try {
        if (!primaryUrl) {
          throw new Error('No download URL available');
        }
        const link = document.createElement('a');
        link.href = primaryUrl;
        link.setAttribute('download', `${app.slug}-v${app.version}-aeroapk.apk`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        trackEvent('download_completed', { appId: app.id, versionId: app.version });
        setDownloadStatus('idle');
        setTimeout(() => {
          setShowFeedbackPrompt(true);
        }, 2000);
      } catch (err) {
        console.error('Download trigger failed:', err);
        trackEvent('download_failed', { appId: app.id, versionId: app.version, metadata: { error: 'trigger_failed' } });
        setDownloadStatus('error');
      }
    }, 1200);
  };

  return (
    <div className="space-y-2 w-full max-w-sm sm:max-w-md" id="app-detail-primary-action-container">
      {isHostedApk ? (
        <div className="space-y-2">
          {downloadStatus === 'error' ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-center space-y-2.5">
              <p className="text-xs font-bold text-red-700 dark:text-red-300">
                Download gagal. Coba lagi atau laporkan kendala.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleActionClick}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={() => onReportProblem && onReportProblem('download_problem')}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Laporkan Kendala
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleActionClick}
              disabled={downloadStatus === 'loading'}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-white font-extrabold text-sm rounded-xl transition-all select-none shadow-sm cursor-pointer ${
                downloadStatus === 'loading'
                  ? 'bg-blue-600/60 dark:bg-blue-600/40 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'
              }`}
              aria-label="Unduh berkas APK aplikasi"
            >
              {downloadStatus === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyiapkan Berkas APK...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 stroke-[2.5]" />
                  <span>Unduh APK ({app.size || '35 MB'})</span>
                </>
              )}
            </button>
          )}

          {/* Secondary Action: Direct website button */}
          {app.officialUrl && (
            <a
              href={app.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent('official_link_click', { appId: app.id, versionId: app.version });
                recordUserInteraction('view', app);
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all select-none text-center cursor-pointer"
            >
              <span>Kunjungi Situs Resmi Developer</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent('official_link_click', { appId: app.id, versionId: app.version });
              recordUserInteraction('view', app);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-sm select-none active:scale-[0.98] text-center cursor-pointer"
            aria-label="Buka situs rilis resmi aplikasi"
          >
            <span>Buka Situs Rilis Resmi</span>
            <ExternalLink className="h-4 w-4 stroke-[2.5]" />
          </a>
        </div>
      )}
    </div>
  );
}

// Full Header Assembly
export default function AppDetailHeader({
  app,
  isBookmarked,
  onToggleBookmark,
  isFollowed,
  onToggleFollow,
  onShare,
  onReport
}: AppDetailHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5" id="app-detail-header-block">
      <div className="flex flex-col items-center sm:items-start gap-4 w-full">
        <AppIdentity app={app} />
        <AppMeta app={app} />
        <AppActions
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
          isFollowed={isFollowed}
          onToggleFollow={onToggleFollow}
          onShare={onShare}
          onReport={() => onReport('general_issue')}
        />
        <PrimaryAction app={app} onReportProblem={onReport} />
      </div>
    </div>
  );
}
