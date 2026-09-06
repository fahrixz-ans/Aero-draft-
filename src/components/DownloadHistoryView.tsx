import React, { useState } from 'react';
import { History, Download, Trash2, ArrowLeft, ExternalLink, ShieldCheck, Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { DownloadHistoryRecord, AppData } from '../types';

interface DownloadHistoryViewProps {
  history?: DownloadHistoryRecord[];
  downloadHistory?: DownloadHistoryRecord[];
  allApps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
  onDownloadAgain?: (e: React.MouseEvent, app: AppData) => void;
  onClearHistory: () => void;
  onBackHome?: () => void;
}

export default function DownloadHistoryView({
  history,
  downloadHistory,
  allApps,
  onSelectApp,
  onDownloadApp,
  onDownloadAgain,
  onClearHistory,
  onBackHome
}: DownloadHistoryViewProps) {
  const records = downloadHistory || history || [];
  const handleDownload = onDownloadAgain || onDownloadApp || (() => {});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'apk' | 'official_link'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredHistory = records.filter(item => {
    const matchesSearch = item.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.version.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="download-history-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <History className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Riwayat Unduhan</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar berkas APK dan tautan resmi aplikasi yang pernah Anda unduh di platform Aero.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200 dark:border-red-900/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Riwayat</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari dalam riwayat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Semua ({history.length})
            </button>
            <button
              onClick={() => setFilterType('apk')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'apk'
                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Berkas APK ({history.filter(h => h.type === 'apk').length})
            </button>
            <button
              onClick={() => setFilterType('official_link')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'official_link'
                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm font-extrabold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Tautan Resmi ({history.filter(h => h.type === 'official_link').length})
            </button>
          </div>
        </div>
      )}

      {/* Main List */}
      {filteredHistory.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto px-4 bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
            {searchQuery ? 'Tidak ada riwayat yang cocok.' : 'Belum ada riwayat unduhan.'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {searchQuery
              ? 'Coba gunakan kata kunci pencarian nama aplikasi yang lain.'
              : 'Ketika Anda mengunduh paket APK atau mengunjungi situs resmi aplikasi, riwayat Anda akan tercatat di sini secara privat.'}
          </p>
          {onBackHome && (
            <button
              onClick={onBackHome}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Jelajahi Aplikasi Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const matchedApp = allApps.find(a => a.id === item.appId || a.slug === item.appSlug);
            const dateStr = new Date(item.downloadedAt).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item.id}
                className="p-4 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  {item.iconUrl ? (
                    <img
                      src={item.iconUrl}
                      alt={item.appName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-black text-base shrink-0">
                      {item.appName.substring(0, 1)}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        onClick={() => onSelectApp(item.appSlug || item.appId)}
                        className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      >
                        {item.appName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                        v{item.version}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.type === 'apk'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.type === 'apk' ? 'APK Langsung' : 'Tautan Resmi'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                      </span>
                      {item.fileSize && <span>• Ukuran: {item.fileSize}</span>}
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.status === 'completed' ? 'Selesai' : 'Dimulai'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onSelectApp(item.appSlug || item.appId)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Detail Aplikasi
                  </button>

                  {matchedApp && (
                    <button
                      onClick={(e) => onDownloadApp(e, matchedApp)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Lagi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Bersihkan Semua Riwayat Unduhan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Tindakan ini akan menghapus seluruh catatan aktivitas unduhan aplikasi secara permanen dari perangkat dan database akun Anda.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Ya, Bersihkan Riwayat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
