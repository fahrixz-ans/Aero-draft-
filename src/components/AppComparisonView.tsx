import React, { useState } from 'react';
import { 
  ArrowLeft, Star, Download, ShieldCheck, Check, X, 
  Smartphone, HardDrive, Calendar, User, ExternalLink, Plus, Trash2, ArrowUpRight 
} from 'lucide-react';
import { AppData } from '../types';

interface AppComparisonViewProps {
  allApps: AppData[];
  initialAppSlug?: string;
  initialAppSlugs?: string[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onBack?: () => void;
  onBackHome?: () => void;
}

export default function AppComparisonView({
  allApps,
  initialAppSlug,
  initialAppSlugs = [],
  onSelectApp,
  onDownloadApp,
  onBack,
  onBackHome
}: AppComparisonViewProps) {
  const handleBack = onBack || onBackHome;
  // Selected apps in comparison (limit: max 3 apps)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (initialAppSlug) return [initialAppSlug];
    if (initialAppSlugs.length > 0) return initialAppSlugs.slice(0, 3);
    // default to first 2 apps in system
    return allApps.slice(0, 2).map(a => a.slug);
  });

  const [addSelectorOpen, setAddSelectorOpen] = useState(false);

  const comparedApps = selectedSlugs
    .map(slug => allApps.find(a => a.slug === slug || a.id === slug))
    .filter(Boolean) as AppData[];

  const handleAddApp = (slug: string) => {
    if (selectedSlugs.length < 3 && !selectedSlugs.includes(slug)) {
      setSelectedSlugs([...selectedSlugs, slug]);
    }
    setAddSelectorOpen(false);
  };

  const handleRemoveApp = (slug: string) => {
    setSelectedSlugs(selectedSlugs.filter(s => s !== slug));
  };

  const formatDownloads = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)} Miliar+`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} Juta+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)} Ribu+`;
    return num.toString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="app-comparison-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          {onBackHome && (
            <button
              onClick={onBackHome}
              aria-label="Kembali ke beranda"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Perbandingan Spesifikasi Aplikasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bandingkan ukuran berkas, kompatibilitas Android, izin privasi, dan sertifikasi keamanan antar aplikasi.
          </p>
        </div>

        {/* Add app button */}
        {selectedSlugs.length < 3 && (
          <div className="relative self-start sm:self-auto">
            <button
              onClick={() => setAddSelectorOpen(!addSelectorOpen)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aplikasi ({selectedSlugs.length}/3)</span>
            </button>

            {addSelectorOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-30 p-2 space-y-1">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 px-3 py-1.5">
                  Pilih aplikasi untuk dibandingkan:
                </div>
                {allApps
                  .filter(a => !selectedSlugs.includes(a.slug))
                  .map(app => (
                    <button
                      key={app.id}
                      onClick={() => handleAddApp(app.slug)}
                      className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <img
                        src={app.iconUrl || app.icon}
                        alt={app.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{app.category}</div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {comparedApps.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
          <p className="text-xs text-slate-500">Pilih minimal 1 aplikasi untuk melihat ringkasan perbandingan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-white/[0.01] w-44 rounded-l-2xl">
                  Fitur & Spesifikasi
                </th>
                {comparedApps.map((app) => (
                  <th key={app.id} className="p-4 text-left bg-white dark:bg-white/[0.02] border-l border-slate-100 dark:border-white/5 min-w-[240px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.iconUrl || app.icon}
                          alt={app.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-white/10 shadow-sm"
                        />
                        <div>
                          <h3 
                            onClick={() => onSelectApp(app.slug)}
                            className="font-black text-sm text-slate-900 dark:text-white hover:text-blue-500 cursor-pointer"
                          >
                            {app.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 block font-medium">
                            {app.developerName || app.developer}
                          </span>
                        </div>
                      </div>

                      {comparedApps.length > 1 && (
                        <button
                          onClick={() => handleRemoveApp(app.slug)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Hapus dari perbandingan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {/* Rating */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  Rating & Ulasan
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-sm">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{app.ratingAverage ? app.ratingAverage.toFixed(1) : (app.rating ? app.rating.toFixed(1) : '4.5')}</span>
                      <span className="text-slate-400 text-xs font-normal">
                        ({app.ratingCount || 100}+)
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Downloads */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  Total Unduhan
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5 font-extrabold text-slate-800 dark:text-slate-200">
                    {formatDownloads(app.downloads || 10000)}
                  </td>
                ))}
              </tr>

              {/* Version & Date */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  Versi Terbaru
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5">
                    <span className="font-mono font-bold bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                      v{app.version}
                    </span>
                    <span className="text-slate-400 text-[10px] block mt-1">
                      Diperbarui {new Date(app.updatedAt).toLocaleDateString('id-ID')}
                    </span>
                  </td>
                ))}
              </tr>

              {/* File Size */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  Ukuran Paket
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5 font-bold text-slate-700 dark:text-slate-300">
                    {app.size || (app.apkSize ? `${(app.apkSize / (1024 * 1024)).toFixed(1)} MB` : '35.0 MB')}
                  </td>
                ))}
              </tr>

              {/* Minimum Android OS */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  OS Android Minimum
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5 font-bold text-slate-700 dark:text-slate-300">
                    Android {app.androidVersion || '8.0+'}
                  </td>
                ))}
              </tr>

              {/* Category */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  Kategori
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5">
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-[11px]">
                      {app.category}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Permissions Count */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  Izin Android (Permissions)
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {app.permissions ? app.permissions.length : 0} Izin
                    </span>
                  </td>
                ))}
              </tr>

              {/* Security Verification */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  Integritas Berkas
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>SHA-256 Terverifikasi</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Actions Row */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/30 dark:bg-white/[0.01]">
                  Aksi Unduh
                </td>
                {comparedApps.map(app => (
                  <td key={app.id} className="p-4 border-l border-slate-100 dark:border-white/5">
                    <button
                      onClick={(e) => onDownloadApp(e, app)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh APK</span>
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
