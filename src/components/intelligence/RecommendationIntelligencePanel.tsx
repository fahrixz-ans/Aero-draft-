import React from 'react';
import {
  Sparkles,
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { RecommendationShelfInsight } from '../../types/intelligence';

interface RecommendationIntelligencePanelProps {
  id?: string;
  shelves: RecommendationShelfInsight[];
  overallCtr: number;
  feedbackLoopStatus: 'HEALTHY' | 'EVALUATING' | 'RECALIBRATING';
  loading?: boolean;
}

export const RecommendationIntelligencePanel: React.FC<RecommendationIntelligencePanelProps> = ({
  id = 'recommendation-intelligence-panel',
  shelves,
  overallCtr,
  feedbackLoopStatus,
  loading = false
}) => {
  const getHealthBadge = (health: 'OPTIMAL' | 'ACCEPTABLE' | 'LOW_PERFORMING') => {
    switch (health) {
      case 'OPTIMAL':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
      case 'ACCEPTABLE':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
      case 'LOW_PERFORMING':
        return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60';
    }
  };

  return (
    <div id={id} className="space-y-6">
      {/* Overview Card */}
      <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Efektivitas Rak Rekomendasi (Recommendation Shelves)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Performa masing-masing rak penemuan di beranda dan halaman detail aplikasi
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs">
            <span className="text-gray-500 dark:text-gray-400">Rata-rata CTR: </span>
            <span className="font-bold text-purple-700 dark:text-purple-300">{overallCtr}%</span>
          </div>

          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              Feedback Loop: {feedbackLoopStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Shelves Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shelves.map((shelf) => (
          <div
            key={shelf.shelfId}
            className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs space-y-3 hover:border-purple-200 dark:hover:border-purple-900/60 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{shelf.title}</h4>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{shelf.shelfId}</p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getHealthBadge(shelf.health)}`}>
                {shelf.health}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                <span className="text-[10px] text-gray-400 block">Tayangan</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {shelf.impressions.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                <span className="text-[10px] text-gray-400 block">Klik (CTR)</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {shelf.clicks.toLocaleString('id-ID')} ({shelf.ctr}%)
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                <span className="text-[10px] text-gray-400 block">Unduhan Berhasil</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {shelf.downloads.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                <span className="text-[10px] text-gray-400 block">Konversi Unduh</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {shelf.conversionRate}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
              <span>Rasio Cold-Start: {Math.round(shelf.coldStartRatio * 100)}%</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Aktif</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
