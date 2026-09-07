import React from 'react';
import { ArrowDown, Layers, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { DiscoveryFunnelData } from '../../types/intelligence';

interface DiscoveryFunnelProps {
  id?: string;
  data: DiscoveryFunnelData | null;
  loading?: boolean;
}

export const DiscoveryFunnel: React.FC<DiscoveryFunnelProps> = ({
  id = 'discovery-funnel',
  data,
  loading = false
}) => {
  if (loading || !data) {
    return (
      <div id={id} className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl animate-pulse">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/60 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const maxCount = data.steps[0]?.count || 1;

  return (
    <div id={id} className="p-5 sm:p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Corong Penemuan Aplikasi (Discovery Funnel)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Laju konversi pengguna dari tayangan awal hingga unduhan APK selesai ({data.period})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 rounded-lg">
            Konversi Akhir: {data.overallConversionRate}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {data.steps.map((step, index) => {
          const widthPercent = Math.max(8, Math.round((step.count / maxCount) * 100));
          const isFinal = index === data.steps.length - 1;

          return (
            <div key={step.step} className="relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {step.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {step.count.toLocaleString('id-ID')}
                  </span>
                  {index > 0 && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 w-16 text-right">
                      {step.conversionFromPrevious}% lolos
                    </span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-6 rounded-lg overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold text-white ${
                    isFinal
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : index === 0
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-indigo-600/90 dark:bg-indigo-500/90'
                  }`}
                  style={{ width: `${widthPercent}%` }}
                >
                  {widthPercent > 20 && `${step.count.toLocaleString('id-ID')}`}
                </div>
              </div>

              {/* Drop-off hint */}
              {step.dropoffPercentage > 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-0.5">
                  ↓ Penurunan: {step.dropoffPercentage}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
