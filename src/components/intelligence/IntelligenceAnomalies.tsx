import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Search, 
  Download, 
  Zap, 
  XOctagon 
} from 'lucide-react';
import { IntelligenceAnomaly } from '../../types/intelligence';

interface IntelligenceAnomaliesProps {
  id?: string;
  anomalies: IntelligenceAnomaly[];
  loading?: boolean;
}

export const IntelligenceAnomalies: React.FC<IntelligenceAnomaliesProps> = ({
  id = 'intelligence-anomalies',
  anomalies = [],
  loading = false
}) => {
  if (loading) {
    return (
      <div id={id} className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="h-6 w-52 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/60 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'DOWNLOAD_SPIKE':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case 'DOWNLOAD_DROP':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'DOWNLOAD_ERROR_SPIKE':
        return <XOctagon className="w-5 h-5 text-red-600" />;
      case 'SEARCH_SPAM':
      case 'SEARCH_ZERO_RESULTS_SURGE':
        return <Search className="w-5 h-5 text-amber-500" />;
      case 'RECOMMENDATION_CTR_DROP':
        return <ArrowDownRight className="w-5 h-5 text-amber-600" />;
      case 'VIRUSTOTAL_FAILURE_SURGE':
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div id={id} className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Sistem Deteksi Anomali Berbasis Aturan & Ambang Batas (Stage 9.10)
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Membandingkan metrik berjalan terhadap baseline historis 7 hari dengan ambang deviasi dinamis
        </p>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {anomalies.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Semua Metrik Beroperasi Dalam Ambang Batas Normal
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tidak ada deviasi drastis pada unduhan, pencarian, CTR rekomendasi, atau antrean keamanan.
              </p>
            </div>
          </div>
        ) : (
          anomalies.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0">
                  {getAnomalyIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {item.type.replace(/_/g, ' ')}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getSeverityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      {item.entityType}:{item.entityId}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {item.explanation || `Nilai saat ini (${item.currentValue}) melampaui baseline (${item.baselineValue}) dengan ambang batas batas ${item.threshold}.`}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-gray-400 mt-2">
                    <span>Metrik: <strong className="text-gray-700 dark:text-gray-300">{item.metric}</strong></span>
                    <span>Nilai Terkini: <strong className="text-gray-700 dark:text-gray-300">{item.currentValue}</strong></span>
                    <span>Baseline: <strong className="text-gray-700 dark:text-gray-300">{item.baselineValue}</strong></span>
                    <span>Terdeteksi: {new Date(item.detectedAt).toLocaleTimeString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="sm:self-center shrink-0">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  item.status === 'OPEN' 
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {item.status === 'OPEN' ? 'Terbuka (Perlu Evaluasi)' : item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
