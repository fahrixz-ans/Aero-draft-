import React from 'react';
import {
  Smartphone,
  Download,
  Eye,
  Search,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { IntelligenceOverviewMetrics, DiscoveryFunnelData, IntelligenceAction, ActionStatus } from '../../types/intelligence';
import { DiscoveryFunnel } from './DiscoveryFunnel';
import { IntelligenceActionCenter } from './IntelligenceActionCenter';

interface IntelligenceOverviewProps {
  metrics: IntelligenceOverviewMetrics | null;
  funnel: DiscoveryFunnelData | null;
  actions: IntelligenceAction[];
  onActionStatusChange: (actionId: string, status: ActionStatus, note?: string) => Promise<void>;
  loading?: boolean;
}

export const IntelligenceOverview: React.FC<IntelligenceOverviewProps> = ({
  metrics,
  funnel,
  actions,
  onActionStatusChange,
  loading = false
}) => {
  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4" />
          ))}
        </div>
        <div className="h-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl" />
      </div>
    );
  }

  const formatNumber = (num: number = 0) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString('id-ID');
  };

  return (
    <div id="intelligence-overview" className="space-y-6">
      {/* 1. KEY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Apps Card */}
        <div className="p-4 sm:p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Aplikasi</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {metrics.totalApps}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {metrics.publishedApps} Publik
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>{metrics.pendingApps} Menunggu</span>
            <span>•</span>
            <span>{metrics.totalDevelopers} Pengembang</span>
          </div>
        </div>

        {/* Downloads Card */}
        <div className="p-4 sm:p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Unduhan</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {formatNumber(metrics.totalDownloads)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {metrics.trends.downloadsChangePercentage}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>Hari ini: {formatNumber(metrics.downloadsToday)}</span>
            <span>•</span>
            <span>7 Hari: {formatNumber(metrics.downloads7Days)}</span>
          </div>
        </div>

        {/* Total Views Card */}
        <div className="p-4 sm:p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Kunjungan (Views)</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {formatNumber(metrics.totalViews)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              {metrics.trends.viewsChangePercentage}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>Pencarian: {formatNumber(metrics.searchCount)}</span>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="p-4 sm:p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Rasio Konversi Unduh</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {metrics.downloadConversion}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              CTR Rek: {metrics.recommendationCtr}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>Kualitas Discovery: Optimal</span>
          </div>
        </div>
      </div>

      {/* 2. DISCOVERY FUNNEL & ACTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <DiscoveryFunnel id="overview-discovery-funnel" data={funnel} loading={loading} />
        </div>
        <div className="lg:col-span-5">
          <IntelligenceActionCenter
            id="overview-action-center"
            actions={actions}
            onStatusChange={onActionStatusChange}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
