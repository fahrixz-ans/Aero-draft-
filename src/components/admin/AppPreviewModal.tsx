import React, { useState } from 'react';
import { 
  X, ExternalLink, Download, ShieldCheck, CheckCircle2, 
  Smartphone, Calendar, HardDrive, FileText, Star, Globe, Tag
} from 'lucide-react';
import { AppData } from '../../types';

interface AppPreviewModalProps {
  app: Partial<AppData>;
  onClose: () => void;
}

export default function AppPreviewModal({ app, onClose }: AppPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'changelog'>('overview');

  const isApk = (app.sourceType || 'apk') === 'apk';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Mode Pratinjau (Preview)
            </span>
            <span className="text-xs text-slate-500">Pratinjau tampilan publik sebelum terbit</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: App Detail Simulation */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Banner if exists */}
          {app.bannerUrl && (
            <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img src={app.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Top App Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-md">
              <img
                src={app.iconUrl || app.icon || '/icon.png'}
                alt={app.name || 'App Icon'}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/icon.png'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {app.name || 'Nama Aplikasi'}
                </h1>
                {app.verifiedSource && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Terverifikasi
                  </span>
                )}
                {app.featured && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Editor's Pick
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {app.developerName || app.developer || 'Nama Pengembang'}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> {app.category || 'Utilitas'}
                </span>
                <span>•</span>
                <span>Versi {app.versionName || app.version || '1.0.0'}</span>
                <span>•</span>
                <span>{app.size || (app.apkSize ? `${(app.apkSize / 1024 / 1024).toFixed(1)} MB` : 'Ukuran bervariasi')}</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="w-full sm:w-auto">
              {isApk ? (
                <div className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 text-sm">
                  <Download className="w-4 h-4" />
                  <span>Unduh APK ({app.size || 'Aero'})</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 text-sm">
                  <Globe className="w-4 h-4" />
                  <span>Kunjungi Website Resmi</span>
                </div>
              )}
            </div>
          </div>

          {/* Screenshots Gallery */}
          {app.screenshots && app.screenshots.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tangkapan Layar (Screenshots)</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {app.screenshots.map((src, idx) => (
                  <div key={idx} className="w-36 sm:w-44 h-64 sm:h-72 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                    <img src={src} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Tentang Aplikasi Ini</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {app.description || 'Belum ada deskripsi aplikasi.'}
            </p>
          </div>

          {/* What's New / Changelog */}
          {app.whatsNew && (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-5 border border-blue-200/60 dark:border-blue-900/40">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">Yang Baru di Versi Ini</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {app.whatsNew}
              </p>
            </div>
          )}

          {/* Security & Technical Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Verifikasi Integritas SHA-256</p>
                <p className="font-mono text-[10px] text-slate-500 truncate max-w-xs">{app.sha256 || 'Menunggu verifikasi build'}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Persyaratan Sistem</p>
                <p className="text-slate-500">{app.androidVersion || 'Android 5.0 atau lebih baru'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
}
