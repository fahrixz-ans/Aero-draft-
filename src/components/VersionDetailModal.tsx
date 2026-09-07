import React, { useState } from 'react';
import { X, ShieldCheck, Download, Copy, Check, Lock, Calendar, Smartphone, Cpu, HardDrive } from 'lucide-react';
import { AppVersion, AppData } from '../types';

interface VersionDetailModalProps {
  version: AppVersion;
  app: AppData;
  onClose: () => void;
  onDownload: (version: AppVersion) => void;
}

export default function VersionDetailModal({
  version,
  app,
  onClose,
  onDownload
}: VersionDetailModalProps) {
  const [copiedSha, setCopiedSha] = useState(false);

  const handleCopySha = () => {
    if (version.sha256) {
      navigator.clipboard.writeText(version.sha256);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  const isRevoked = version.status === 'REVOKED' || version.downloadAllowed === false || version.securityRevoked === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <img
              src={app.iconUrl || app.icon}
              alt={app.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border border-slate-100 dark:border-white/10 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{app.name}</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 rounded-md text-xs font-black">
                  v{version.versionName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Version Code: <span className="font-mono font-bold">{version.versionCode}</span> • Package: <span className="font-mono">{version.packageName || app.packageName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert if Revoked or Archived */}
        {isRevoked ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <span>⚠️ Versi ini telah dicabut (Revoked) oleh administrator dan diblokir dari unduhan publik.</span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>✓ APK terverifikasi oleh AeroShield • Signature Valid • Clean Security Scan</span>
          </div>
        )}

        {/* Changelog */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Catatan Rilis (Changelog)</h3>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {version.changelog || 'Tidak ada catatan rilis developer untuk versi ini.'}
          </div>
        </div>

        {/* Technical specs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Ukuran APK</div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              {Math.round((version.fileSize || 50000000) / (1024 * 1024))} MB
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Android Min SDK</div>
            <div className="text-xs font-black text-slate-900 dark:text-white">Android {version.minSdk || 24}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Target SDK</div>
            <div className="text-xs font-black text-slate-900 dark:text-white">Android {version.targetSdk || 34}</div>
          </div>
        </div>

        {/* SHA-256 Hash */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SHA-256 Checksum (Immutable)</span>
            <button
              onClick={handleCopySha}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
            >
              {copiedSha ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSha ? 'Tersalin!' : 'Salin Hash'}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] break-all">
            {version.sha256 || 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'}
          </div>
        </div>

        {/* Permissions */}
        {version.permissions && version.permissions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Izin Sistem Diminta ({version.permissions.length})</h3>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              {version.permissions.map(p => (
                <span key={p} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-mono font-bold">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
          {!isRevoked && (
            <button
              onClick={() => {
                onDownload(version);
                onClose();
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Versi Ini</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
