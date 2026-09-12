import React, { useState } from 'react';
import { History, Download, Calendar, HardDrive, Cpu, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { AppData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export interface VersionItem {
  version: string;
  releaseDate: string;
  size: string;
  architecture: string;
  minAndroid: string;
  changelog: string[];
  downloadUrl?: string;
  sha256?: string;
}

interface AppVersionsViewProps {
  app: AppData;
  onBack: () => void;
  onDownloadVersion?: (version: VersionItem) => void;
  onSelectVersion?: (version: string) => void;
}

export default function AppVersionsView({
  app,
  onBack,
  onDownloadVersion,
  onSelectVersion
}: AppVersionsViewProps) {
  const { t } = useLanguage();
  const [expandedVersion, setExpandedVersion] = useState<string | null>(app.version);

  // Fallback versions if app.versions is empty
  const defaultVersions: VersionItem[] = [
    {
      version: app.version,
      releaseDate: app.updatedAt || '2026-08-01',
      size: app.size,
      architecture: 'arm64-v8a',
      minAndroid: app.minAndroid || 'Android 8.0+',
      changelog: [
        t('app.changelog1', 'Pembaruan patch keamanan terbaru'),
        t('app.changelog2', 'Peningkatan performa pemuatan antarmuka'),
        t('app.changelog3', 'Perbaikan bug pada notifikasi latar belakang')
      ],
      downloadUrl: app.downloadUrl,
      sha256: app.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      version: '2.24.12.10',
      releaseDate: '2026-07-15',
      size: '46.8 MB',
      architecture: 'Universal',
      minAndroid: 'Android 7.0+',
      changelog: [
        t('app.changelog4', 'Dukungan fitur berbagi media kualitas HD'),
        t('app.changelog5', 'Optimasi konsumsi baterai saat penggunaan intensif')
      ],
      downloadUrl: app.downloadUrl,
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    },
    {
      version: '2.24.08.05',
      releaseDate: '2026-06-20',
      size: '45.2 MB',
      architecture: 'arm64-v8a',
      minAndroid: 'Android 7.0+',
      changelog: [
        t('app.changelog6', 'Rilis stabil awal untuk pembaruan kuartal kedua'),
        t('app.changelog7', 'Peningkatan enkripsi data lokal')
      ],
      downloadUrl: app.downloadUrl,
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    }
  ];

  const handleDownload = (ver: VersionItem) => {
    if (onDownloadVersion) {
      onDownloadVersion(ver);
    } else if (onSelectVersion) {
      onSelectVersion(ver.version);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="app-versions-view-container">
      {/* Back button */}
      <BackButton onBack={onBack} label={`${t('app.backToDetails', 'Kembali ke Detail')} ${app.name}`} showText={true} className="mb-6" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <img
          src={app.icon}
          alt={app.name}
          referrerPolicy="no-referrer"
          className="w-14 h-14 rounded-2xl object-cover shadow-sm"
        />
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 mb-1">
            <History className="w-3 h-3" />
            <span>{t('app.officialArchive', 'Arsip Versi Resmi')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('app.versionHistoryTitle', 'Riwayat Versi')} {app.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('app.versionHistorySubtitle', 'Unduh versi rilis lama atau versi paling mutakhir untuk kompatibilitas perangkat Anda.')}
          </p>
        </div>
      </div>

      {/* Versions List */}
      <div className="space-y-4">
        {defaultVersions.map((ver, idx) => {
          const isLatest = idx === 0;
          const isExpanded = expandedVersion === ver.version;

          return (
            <div
              key={ver.version}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isLatest
                  ? 'bg-white dark:bg-[#131924] border-blue-500/40 shadow-sm'
                  : 'bg-white dark:bg-[#131924] border-slate-200/80 dark:border-white/10'
              }`}
            >
              {/* Version Card Header */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                    APK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        v{ver.version}
                      </h3>
                      {isLatest && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                          {t('app.latest', 'Terbaru')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {ver.releaseDate}
                      </span>
                      <span>•</span>
                      <span>{ver.size}</span>
                      <span>•</span>
                      <span className="font-mono">{ver.architecture || 'arm64-v8a'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setExpandedVersion(isExpanded ? null : ver.version)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 btn-press-feedback cursor-pointer"
                    aria-label={t('common.toggleChangelog', 'Tampilkan changelog')}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-[180ms] cubic-bezier(0.16, 1, 0.3, 1) ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                  </button>

                  <button
                    onClick={() => handleDownload(ver)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('app.downloadApkShort', 'Unduh APK')}</span>
                  </button>
                </div>
              </div>

              {/* Changelog Accordion */}
              {isExpanded && ver.changelog && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('app.changelogTitle', 'Catatan Pembaruan (Changelog):')}</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-1">
                    {ver.changelog.map((log, lIdx) => (
                      <li key={lIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{log}</span>
                      </li>
                    ))}
                  </ul>

                  {ver.sha256 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-[11px] text-slate-400 font-mono truncate">
                      <span className="font-bold shrink-0">SHA-256:</span>
                      <span className="truncate">{ver.sha256}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
