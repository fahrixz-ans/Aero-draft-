import React from 'react';
import {
  Activity,
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import { OperationalHealthIndicator, IntelligenceDataQuality } from '../../types/intelligence';

interface OperationalIntelligenceProps {
  id?: string;
  health: OperationalHealthIndicator[];
  dataQuality: IntelligenceDataQuality[];
  uptimeSeconds?: number;
  loading?: boolean;
}

export const OperationalIntelligence: React.FC<OperationalIntelligenceProps> = ({
  id = 'operational-intelligence',
  health,
  dataQuality,
  uptimeSeconds = 3600,
  loading = false
}) => {
  const getStatusBadge = (status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'DELAYED') => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
      case 'DEGRADED':
      case 'DELAYED':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
      case 'DOWN':
        return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60';
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}h ` : ''}${h}j ${m}m`;
  };

  return (
    <div id={id} className="space-y-6">
      {/* 1. HEALTH INDICATORS */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Status & Kesehatan Subsistem Operasional
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Latensi dan ketersediaan layanan pemrosesan data Aero
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400">
            Waktu Aktif Sistem: {formatUptime(uptimeSeconds)}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {health.map((item) => (
            <div key={item.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">{item.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.details}</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <div>
                  <span className="text-gray-400 text-[10px] block">Latensi</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{item.latencyMs} ms</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Error Rate</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{item.errorRatePercent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. DATA QUALITY VALIDATION */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            Validasi & Integritas Kualitas Data (Data Quality)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Pemeriksaan otomatis rekonsiliasi data, keabsahan event, dan deduplikasi
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">Metrik Integritas</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-right">Event Tidak Valid</th>
                <th className="px-3 py-3 text-right">Duplikasi Terdeteksi</th>
                <th className="px-3 py-3 text-right">Kehilangan (Missing)</th>
                <th className="px-4 py-3 text-right">Terakhir Diperiksa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataQuality.map((q) => (
                <tr key={q.metric} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                    {q.metric}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                      {q.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{q.invalidCount}</td>
                  <td className="px-3 py-3 text-right font-mono">{q.duplicateCount}</td>
                  <td className="px-3 py-3 text-right font-mono">{q.missingCount}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-[11px]">Baru saja</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
