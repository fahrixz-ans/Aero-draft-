import React, { useState } from 'react';
import { History, ShieldCheck, Download, ChevronRight, Lock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { AppVersion } from '../types';

interface VersionHistorySectionProps {
  versions: AppVersion[];
  onSelectVersion: (version: AppVersion) => void;
  onCompareVersions: () => void;
  onDownloadVersion: (version: AppVersion) => void;
}

export default function VersionHistorySection({
  versions,
  onSelectVersion,
  onCompareVersions,
  onDownloadVersion
}: VersionHistorySectionProps) {
  if (!versions || versions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Riwayat Versi (Version Archive)</span>
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada riwayat versi lain yang dipublikasikan.</p>
      </div>
    );
  }

  const latest = versions[0];
  const previousVersions = versions.slice(1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Riwayat Versi (Version Archive)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total {versions.length} versi rilis terverifikasi tersimpan dalam arsip immutable Mod Station.
          </p>
        </div>
        {versions.length >= 2 && (
          <button
            onClick={onCompareVersions}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Bandingkan Versi</span>
          </button>
        )}
      </div>

      {/* Latest Version Highlight */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
              Versi Terbaru (Latest)
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white">v{latest.versionName}</span>
            <span className="text-xs text-slate-400 font-mono">(Code: {latest.versionCode})</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
            {latest.changelog || 'Pembaruan stabilitas sistem.'}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
            <span>{Math.round((latest.fileSize || 50000000) / (1024 * 1024))} MB</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AeroShield Verified</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectVersion(latest)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Detail
          </button>
          <button
            onClick={() => onDownloadVersion(latest)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </button>
        </div>
      </div>

      {/* Previous / Older Versions List */}
      {previousVersions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Versi Sebelumnya (Previous Versions)</h4>
          <div className="space-y-2">
            {previousVersions.map((ver) => {
              const isRevoked = ver.status === 'REVOKED' || ver.downloadAllowed === false || ver.securityRevoked === true;
              const isArchived = ver.status === 'ARCHIVED';

              return (
                <div
                  key={ver.id}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">v{ver.versionName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({ver.versionCode})</span>
                      {isRevoked ? (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 rounded text-[9px] font-black uppercase">
                          Revoked
                        </span>
                      ) : isArchived ? (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 rounded text-[9px] font-black uppercase">
                          Archived
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded text-[9px] font-black uppercase">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {ver.changelog || 'Riwayat rilis versi terdahulu.'}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{Math.round((ver.fileSize || 50000000) / (1024 * 1024))} MB</span>
                      <span>•</span>
                      <span>{ver.createdAt ? new Date(ver.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : 'Arsip'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectVersion(ver)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Detail
                    </button>
                    {!isRevoked ? (
                      <button
                        onClick={() => onDownloadVersion(ver)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Unduh</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-500 px-2 py-1 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                        Tidak Tersedia
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
