import React, { useState } from 'react';
import {
  Smartphone,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  ShieldCheck,
  TrendingUp,
  Download,
  Eye,
  Activity,
  Award
} from 'lucide-react';
import { AppIntelligenceSummary } from '../../types/intelligence';

interface AppIntelligencePanelProps {
  id?: string;
  apps: AppIntelligenceSummary[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
}

export const AppIntelligencePanel: React.FC<AppIntelligencePanelProps> = ({
  id = 'app-intelligence-panel',
  apps,
  loading = false,
  total,
  page,
  pageSize,
  onPageChange,
  onSearchChange,
  onCategoryChange
}) => {
  const [selectedApp, setSelectedApp] = useState<AppIntelligenceSummary | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput.trim());
  };

  return (
    <div id={id} className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari aplikasi atau pengembang..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total {total} aplikasi terdaftar
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">Aplikasi & Pengembang</th>
                <th className="px-3 py-3">Kategori</th>
                <th className="px-3 py-3 text-right">Kunjungan</th>
                <th className="px-3 py-3 text-right">Unduhan</th>
                <th className="px-3 py-3 text-right">Konversi</th>
                <th className="px-3 py-3 text-center">Keamanan</th>
                <th className="px-3 py-3 text-center">Skor Tren</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 animate-pulse">
                    Memuat data intelijen aplikasi...
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Tidak ada aplikasi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr key={app.appId} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="w-9 h-9 rounded-lg object-cover border border-gray-100 dark:border-gray-800"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[160px] sm:max-w-xs">
                            {app.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {app.developerName} • v{app.latestVersion}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded font-medium">
                        {app.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {app.views.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {app.downloads.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      <span className="px-2 py-0.5 text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-md font-semibold">
                        {app.conversion}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {app.securityStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                      {app.trendingScore}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        Detail
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 rounded-md"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 rounded-md"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* App Drill-Down Modal / Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedApp.iconUrl}
                  alt={selectedApp.name}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                />
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">{selectedApp.name}</h3>
                  <p className="text-xs text-gray-400">{selectedApp.developerName} • {selectedApp.category}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Performance Radar / Indices (Section 17) */}
            <div className="p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                Indeks Performa Aplikasi (Skor 0 - 100)
              </h4>

              <div className="space-y-2.5">
                {[
                  { label: 'Discovery (Keterlihatan Pencarian)', score: selectedApp.performanceIndices.discovery, color: 'bg-blue-600' },
                  { label: 'Engagement (Interaksi Pengguna)', score: selectedApp.performanceIndices.engagement, color: 'bg-indigo-600' },
                  { label: 'Conversion (Rasio Unduhan / Kunjungan)', score: selectedApp.performanceIndices.conversion, color: 'bg-emerald-600' },
                  { label: 'Growth (Kecepatan Pertumbuhan)', score: selectedApp.performanceIndices.growth, color: 'bg-amber-600' },
                  { label: 'Reliability (Integritas & Keamanan)', score: selectedApp.performanceIndices.reliability, color: 'bg-purple-600' }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{item.score}/100</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Metrics Grid */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <span className="text-gray-400 block text-[11px]">Tayangan Pencarian</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5 block">
                    {selectedApp.searchImpressions.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <span className="text-gray-400 block text-[11px]">Klik Rekomendasi</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5 block">
                    {selectedApp.recommendationClicks.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <span className="text-gray-400 block text-[11px]">Pengunduh Unik</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5 block">
                    {selectedApp.uniqueDownloaders.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                  <span className="text-gray-400 block text-[11px]">Peringkat Tren</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5 block">
                    {selectedApp.trendingScore} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-lg text-gray-800 dark:text-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
