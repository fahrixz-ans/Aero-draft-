import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Eye, 
  ChevronRight, 
  ExternalLink 
} from 'lucide-react';
import { DeveloperIntelligenceSummary } from '../../types/intelligence';

interface DeveloperIntelligencePanelProps {
  id?: string;
  developers: DeveloperIntelligenceSummary[];
  loading?: boolean;
}

export const DeveloperIntelligencePanel: React.FC<DeveloperIntelligencePanelProps> = ({
  id = 'developer-intelligence-panel',
  developers = [],
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredDevelopers = developers.filter(dev => {
    const matchesSearch = dev.developerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || dev.activeStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatNumber = (num: number = 0) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} jt`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)} rb`;
    return num.toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div id={id} className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
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
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Intelijen Pengembang (Developer Health & Activity)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit agregat aktivitas pengembang, kepatuhan keamanan, dan tingkat keberhasilan upload
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pengembang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Developer List Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Pengembang</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-center">Aplikasi (Pub / Draf / Tolak)</th>
                <th className="py-3.5 px-4 font-semibold text-right">Total Unduhan</th>
                <th className="py-3.5 px-4 font-semibold text-right">Total Tayangan</th>
                <th className="py-3.5 px-4 font-semibold text-center">Upload Success</th>
                <th className="py-3.5 px-4 font-semibold text-center">Insiden Keamanan</th>
                <th className="py-3.5 px-4 font-semibold text-center">Durasi Proses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredDevelopers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    Tidak ada data pengembang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredDevelopers.map((dev) => (
                  <tr 
                    key={dev.developerId}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {dev.developerName}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {dev.developerId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        dev.activeStatus === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' 
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                      }`}>
                        {dev.activeStatus === 'ACTIVE' ? 'Aktif' : 'Ditangguhkan'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400">{dev.publishedApps}</span>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span className="text-amber-600 dark:text-amber-400">{dev.pendingApps}</span>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span className="text-red-600 dark:text-red-400">{dev.rejectedApps}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-gray-800 dark:text-gray-200">
                      {formatNumber(dev.totalDownloads)}
                    </td>

                    <td className="py-3.5 px-4 text-right text-gray-600 dark:text-gray-400">
                      {formatNumber(dev.totalViews)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              dev.uploadSuccessRate >= 95 ? 'bg-emerald-500' : dev.uploadSuccessRate >= 80 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(dev.uploadSuccessRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                          {dev.uploadSuccessRate}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {dev.securityIncidentCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 0
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800/60">
                          <ShieldAlert className="w-3 h-3" /> {dev.securityIncidentCount}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center text-gray-500 dark:text-gray-400 text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {dev.avgProcessingDurationSeconds}s
                      </span>
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
