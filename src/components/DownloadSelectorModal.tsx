import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AppData, AppVersion } from '../types';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { trackEvent, recordUserInteraction } from '../services';

interface DownloadSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppData;
  versions: AppVersion[];
  onDownloadVersion?: (version: AppVersion, serverId: string) => void;
}

interface ServerOption {
  id: string;
  name: string;
  versions: {
    version: AppVersion;
    downloadUrl: string;
    fileSize: string;
  }[];
}

export default function DownloadSelectorModal({
  isOpen,
  onClose,
  app,
  versions,
  onDownloadVersion
}: DownloadSelectorModalProps) {
  // Dynamically compute real servers that actually have files
  const serverOptions = useMemo<ServerOption[]>(() => {
    const servers: ServerOption[] = [];

    // Server 1 (Utama)
    const server1Versions: ServerOption['versions'] = [];
    versions.forEach(v => {
      const url = v.apkFileUrl || (v as any).downloadUrl || (v as any).url || app.downloadUrl || app.apkFileUrl;
      if (url) {
        server1Versions.push({
          version: v,
          downloadUrl: url,
          fileSize: typeof v.fileSize === 'number' ? `${v.fileSize} MB` : (v.fileSize || app.size || '35 MB')
        });
      }
    });

    // If versions list is empty but app has a downloadUrl
    if (server1Versions.length === 0 && (app.downloadUrl || app.apkFileUrl)) {
      server1Versions.push({
        version: {
          id: 'current',
          versionName: app.version || '1.0',
          fileSize: app.size || '35 MB',
          apkFileUrl: app.downloadUrl || app.apkFileUrl
        } as unknown as AppVersion,
        downloadUrl: (app.downloadUrl || app.apkFileUrl)!,
        fileSize: app.size || '35 MB'
      });
    }

    if (server1Versions.length > 0) {
      servers.push({
        id: 'server-1',
        name: 'Server 1',
        versions: server1Versions
      });
    }

    // Server 2 (Alternatif): Only if app has alternativeDownloadUrl or versions have server-2 urls
    const server2Versions: ServerOption['versions'] = [];
    if (app.alternativeDownloadUrl) {
      server2Versions.push({
        version: {
          id: 'server-2-current',
          versionName: app.version || '1.0',
          fileSize: app.size || '35 MB',
          apkFileUrl: app.alternativeDownloadUrl
        } as unknown as AppVersion,
        downloadUrl: app.alternativeDownloadUrl,
        fileSize: app.size || '35 MB'
      });
    }
    versions.forEach(v => {
      if ((v as any).alternativeDownloadUrl || (v as any).server === 'Server 2') {
        const altUrl = (v as any).alternativeDownloadUrl || v.apkFileUrl;
        if (altUrl) {
          server2Versions.push({
            version: v,
            downloadUrl: altUrl,
            fileSize: typeof v.fileSize === 'number' ? `${v.fileSize} MB` : (v.fileSize || app.size || '35 MB')
          });
        }
      }
    });

    if (server2Versions.length > 0) {
      servers.push({
        id: 'server-2',
        name: 'Server 2',
        versions: server2Versions
      });
    }

    // Server 3 (Cermin): Only if app has mirrorDownloadUrl or versions have server-3
    const server3Versions: ServerOption['versions'] = [];
    if ((app as any).mirrorDownloadUrl) {
      server3Versions.push({
        version: {
          id: 'server-3-current',
          versionName: app.version || '1.0',
          fileSize: app.size || '35 MB',
          apkFileUrl: (app as any).mirrorDownloadUrl
        } as unknown as AppVersion,
        downloadUrl: (app as any).mirrorDownloadUrl,
        fileSize: app.size || '35 MB'
      });
    }
    versions.forEach(v => {
      if ((v as any).server === 'Server 3' && v.apkFileUrl) {
        server3Versions.push({
          version: v,
          downloadUrl: v.apkFileUrl,
          fileSize: typeof v.fileSize === 'number' ? `${v.fileSize} MB` : (v.fileSize || app.size || '35 MB')
        });
      }
    });

    if (server3Versions.length > 0) {
      servers.push({
        id: 'server-3',
        name: 'Server 3',
        versions: server3Versions
      });
    }

    return servers;
  }, [app, versions]);

  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [downloadError, setDownloadError] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Set default server
  useEffect(() => {
    if (serverOptions.length > 0 && (!selectedServerId || !serverOptions.some(s => s.id === selectedServerId))) {
      setSelectedServerId(serverOptions[0].id);
    }
  }, [serverOptions, selectedServerId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setDownloadError('');
      setDownloadingId(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentServer = serverOptions.find(s => s.id === selectedServerId) || serverOptions[0];

  // 23. ACTUAL DOWNLOAD PROCESS
  const handleStartDownload = async (verItem: ServerOption['versions'][0]) => {
    setDownloadError('');
    setDownloadingId(verItem.version.id);

    try {
      // 1. Validasi file/version
      if (!verItem.downloadUrl) {
        setDownloadError('Berkas unduhan untuk versi ini tidak tersedia.');
        setDownloadingId(null);
        return;
      }

      // 2. Validasi server
      if (!currentServer) {
        setDownloadError('Server unduhan tidak valid atau sedang offline.');
        setDownloadingId(null);
        return;
      }

      // 3. Catat event download analytics
      try {
        trackEvent('app_download', {
          appId: app.id,
          versionId: verItem.version.id,
          metadata: {
            appName: app.name,
            version: verItem.version.versionName,
            serverId: currentServer.name
          }
        });
        recordUserInteraction('download', app);
      } catch (trackErr) {
        console.warn('Analytics non-blocking error:', trackErr);
      }

      // 4. Update statistik download di Firestore
      try {
        if (app.id) {
          const appDocRef = doc(db, 'applications', app.id);
          await updateDoc(appDocRef, {
            downloads: increment(1)
          });
        }
      } catch (dbErr) {
        console.warn('Firestore increment downloads non-blocking error:', dbErr);
      }

      // Notify parent if provided
      if (onDownloadVersion) {
        onDownloadVersion(verItem.version, currentServer.name);
      }

      // 5. Jalankan proses download file sebenarnya
      const anchor = document.createElement('a');
      anchor.href = verItem.downloadUrl;
      anchor.setAttribute('download', `${app.name}-v${verItem.version.versionName}.apk`);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => {
        setDownloadingId(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Download execution error:', err);
      setDownloadError('Gagal memulai unduhan berkas. Silakan coba kembali atau pilih server lain.');
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" id="download-selector-modal">
      <div className="relative w-full max-w-md bg-white dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header: Judul "Pilih versi", [Close X] */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-slate-900">
          <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">Pilih versi</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 btn-close-effect cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server tabs: Only servers that actually have files */}
        {serverOptions.length > 0 && (
          <div className="flex overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-white/10 shrink-0 bg-white dark:bg-[#121722]">
            {serverOptions.map((srv) => (
              <button
                key={srv.id}
                onClick={() => {
                  setSelectedServerId(srv.id);
                  setDownloadError('');
                }}
                className={`flex-1 min-w-[90px] py-3 text-xs font-extrabold transition-colors whitespace-nowrap px-4 border-b-2 cursor-pointer ${
                  selectedServerId === srv.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-900/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {srv.name}
              </button>
            ))}
          </div>
        )}

        {/* Error message banner */}
        {downloadError && (
          <div className="m-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Versions List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50 dark:bg-black/20">
          {currentServer && currentServer.versions.length > 0 ? (
            currentServer.versions.map((verItem) => (
              <div
                key={verItem.version.id}
                className="p-4 bg-white dark:bg-[#1a2235] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-4 hover:shadow-xs transition-shadow"
              >
                <img
                  src={app.iconUrl || app.icon}
                  alt={app.name}
                  className="w-12 h-12 rounded-xl border border-slate-100 dark:border-white/10 shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                    {app.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300 font-bold">
                      v{verItem.version.versionName}
                    </span>
                    <span>•</span>
                    <span>{verItem.fileSize}</span>
                  </div>
                </div>

                {/* [Unduh] button */}
                <button
                  onClick={() => handleStartDownload(verItem)}
                  disabled={downloadingId === verItem.version.id}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs shadow-blue-500/20 active:scale-95"
                >
                  {downloadingId === verItem.version.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memulai...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </>
                  )}
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                File belum tersedia
              </h3>
              <p className="text-xs text-slate-500 max-w-[220px]">
                Belum ada file APK yang tersedia untuk server ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
