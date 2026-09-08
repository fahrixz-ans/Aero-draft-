import React from 'react';
import { 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  XCircle, 
  Users, 
  Zap, 
  CheckCircle2, 
  Ban, 
  ArrowDownRight, 
  Percent 
} from 'lucide-react';
import { DownloadDiagnosticBreakdown } from '../../types/intelligence';

interface DownloadIntelligencePanelProps {
  id?: string;
  downloads: DownloadDiagnosticBreakdown | null;
  loading?: boolean;
}

export const DownloadIntelligencePanel: React.FC<DownloadIntelligencePanelProps> = ({
  id = 'download-intelligence-panel',
  downloads,
  loading = false
}) => {
  if (loading || !downloads) {
    return (
      <div id={id} className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="h-6 w-52 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-50 dark:bg-gray-800/60 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number = 0) => num.toLocaleString('id-ID');

  const funnelSteps = [
    { label: 'Percobaan Unduhan (Attempts)', count: downloads.attempts, color: 'bg-blue-500', icon: Download },
    { label: 'Otorisasi Token & Security (Authorized)', count: downloads.authorized, color: 'bg-indigo-500', icon: ShieldCheck },
    { label: 'Transfer Dimulai R2 (Started)', count: downloads.started, color: 'bg-cyan-500', icon: Zap },
    { label: 'Selesai Berhasil (Completed)', count: downloads.completed, color: 'bg-emerald-500', icon: CheckCircle2 }
  ];

  return (
    <div id={id} className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Intelijen Distribusi & Unduhan (Download Diagnostics)
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Diagnostik verifikasi integritas APK Cloudflare R2, pembagian tahapan otorisasi, dan deteksi kegagalan
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Tingkat Penyelesaian</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {downloads.completionRate}%
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Rasio unduhan selesai terhadap percobaan
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Pengunduh Unik</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {formatNumber(downloads.uniqueDownloaders)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Entitas browser/sesi terverifikasi
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Tingkat Kegagalan (Failure)</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            {downloads.failureRate}%
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {formatNumber(downloads.failed)} transfer gagal atau terputus
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Ditolak / Blokir (Denied)</span>
            <Ban className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {downloads.deniedRate}%
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {formatNumber(downloads.denied)} ditolak rate limit / unverified
          </p>
        </div>
      </div>

      {/* Funnel Progress Breakdown */}
      <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Aliran Pemenuhan Unduhan (Download Execution Funnel)
        </h3>

        <div className="space-y-3">
          {funnelSteps.map((step, idx) => {
            const percentageOfTotal = downloads.attempts > 0 
              ? Number(((step.count / downloads.attempts) * 100).toFixed(1)) 
              : 0;
            const Icon = step.icon;

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                    {step.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {formatNumber(step.count)}
                    </span>
                    <span className="text-[11px] text-gray-400 w-12 text-right">
                      ({percentageOfTotal}%)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${step.color} transition-all duration-500`}
                    style={{ width: `${percentageOfTotal}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
