import React from 'react';
import {
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp
} from 'lucide-react';
import { RankingMovementSignal, DataFreshness } from '../../types/intelligence';

interface RankingIntelligencePanelProps {
  id?: string;
  leaderboard: RankingMovementSignal[];
  freshness: DataFreshness;
  loading?: boolean;
}

export const RankingIntelligencePanel: React.FC<RankingIntelligencePanelProps> = ({
  id = 'ranking-intelligence-panel',
  leaderboard,
  freshness,
  loading = false
}) => {
  const renderMovement = (label: string, val: number) => {
    if (label === 'NEW') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded">
          BARU
        </span>
      );
    }
    if (val > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <ArrowUp className="w-3.5 h-3.5" />
          {val}
        </span>
      );
    }
    if (val < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 dark:text-red-400">
          <ArrowDown className="w-3.5 h-3.5" />
          {Math.abs(val)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs text-gray-400">
        <Minus className="w-3.5 h-3.5" />
      </span>
    );
  };

  return (
    <div id={id} className="space-y-4">
      {/* Header Info */}
      <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Papan Peringkat & Dinamika Ranking (Ranking Movement)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Pergerakan posisi aplikasi berdasarkan kalkulasi algoritmik multi-sinyal Aero
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
            Status: {freshness.status}
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-center w-16">Peringkat</th>
                <th className="px-3 py-3 text-center w-16">Tren</th>
                <th className="px-4 py-3">Aplikasi</th>
                <th className="px-3 py-3">Kategori</th>
                <th className="px-3 py-3 text-center">Skor Multi-Sinyal</th>
                <th className="px-3 py-3">Pertumbuhan Unduhan</th>
                <th className="px-3 py-3">Kecepatan Kunjungan</th>
                <th className="px-4 py-3 text-center">Integritas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {leaderboard.map((item) => (
                <tr key={item.appId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-gray-100 text-sm">
                    #{item.currentRank}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {renderMovement(item.movementLabel, item.movementValue)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.iconUrl}
                        alt={item.appName}
                        className="w-8 h-8 rounded-lg object-cover border border-gray-100 dark:border-gray-800"
                      />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {item.appName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                    {item.score}
                  </td>
                  <td className="px-3 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                    {item.signals.downloadGrowth}
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                    {item.signals.viewVelocity}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.signals.securityPassed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Lolos
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-500 font-semibold">Tinjau</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
