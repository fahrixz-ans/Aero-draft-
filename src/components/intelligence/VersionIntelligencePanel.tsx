import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Ban, 
  Archive, 
  Download, 
  Eye, 
  Calendar,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import { VersionIntelligenceItem } from '../../types/intelligence';

interface VersionIntelligencePanelProps {
  id?: string;
  versions: VersionIntelligenceItem[];
  loading?: boolean;
}

export const VersionIntelligencePanel: React.FC<VersionIntelligencePanelProps> = ({
  id = 'version-intelligence-panel',
  versions = [],
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredVersions = versions.filter(v => {
    const matchesSearch = v.appName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.versionName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return 'Ukuran bervariasi';
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatNumber = (num: number = 0) => num.toLocaleString('id-ID');

  if (loading) {
    return (
      <div id={id} className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 w-full bg-gray-50 dark:bg-gray-800/60 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id={id} className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Intelijen Versi & Siklus Rilis (Stage 9.8)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Observabilitas status versi aktif, arsip rilis terdahulu, pencabutan darurat (revocation), dan adopsi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari aplikasi atau versi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif (Published)</option>
            <option value="ARCHIVED">Diarsipkan (Archived)</option>
            <option value="REVOKED">Dicabut (Revoked)</option>
          </select>
        </div>
      </div>

      {/* Versions Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Aplikasi & Versi</th>
                <th className="py-3.5 px-4 font-semibold text-center">Tipe Rilis</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status Siklus</th>
                <th className="py-3.5 px-4 font-semibold text-center">Keamanan</th>
                <th className="py-3.5 px-4 font-semibold text-right">Ukuran APK</th>
                <th className="py-3.5 px-4 font-semibold text-right">Unduhan Versi</th>
                <th className="py-3.5 px-4 font-semibold text-right">Tayangan Versi</th>
                <th className="py-3.5 px-4 font-semibold text-center">Tanggal Rilis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredVersions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    Tidak ada versi yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredVersions.map((v) => (
                  <tr key={v.versionId} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {v.appName}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                        v{v.versionName} (Build {v.versionCode})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {v.isLatest ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                          Terbaru
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          Terdahulu
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : v.status === 'ARCHIVED'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60'
                      }`}>
                        {v.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                        {v.status === 'ARCHIVED' && <Archive className="w-3 h-3" />}
                        {v.status === 'REVOKED' && <Ban className="w-3 h-3" />}
                        {v.status === 'ACTIVE' ? 'Aktif' : v.status === 'ARCHIVED' ? 'Arsip' : 'Dicabut'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        v.securityStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : v.securityStatus === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        {v.securityStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-gray-700 dark:text-gray-300">
                      {formatSize(v.sizeBytes)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatNumber(v.downloads)}
                    </td>

                    <td className="py-3.5 px-4 text-right text-gray-500 dark:text-gray-400">
                      {formatNumber(v.views)}
                    </td>

                    <td className="py-3.5 px-4 text-center text-gray-400 text-[11px]">
                      {new Date(v.releasedAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
