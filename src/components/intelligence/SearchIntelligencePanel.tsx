import React from 'react';
import {
  Search,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Filter,
  Layers
} from 'lucide-react';
import { SearchQueryInsight, SearchFunnelData } from '../../types/intelligence';

interface SearchIntelligencePanelProps {
  id?: string;
  topQueries: SearchQueryInsight[];
  zeroResultQueries: SearchQueryInsight[];
  funnel: SearchFunnelData | null;
  overallCtr: number;
  loading?: boolean;
}

export const SearchIntelligencePanel: React.FC<SearchIntelligencePanelProps> = ({
  id = 'search-intelligence-panel',
  topQueries,
  zeroResultQueries,
  funnel,
  overallCtr,
  loading = false
}) => {
  return (
    <div id={id} className="space-y-6">
      {/* 1. SEARCH FUNNEL & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel Card */}
        <div className="lg:col-span-8 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Corong Konversi Pencarian (Search Funnel)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Aliran pengguna dari memasukkan kueri hingga unduhan APK berhasil
              </p>
            </div>
            {funnel && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg">
                Konversi: {funnel.overallConversionRate}%
              </span>
            )}
          </div>

          {funnel ? (
            <div className="space-y-3">
              {funnel.steps.map((step, idx) => {
                const max = funnel.steps[0].count || 1;
                const width = Math.max(8, Math.round((step.count / max) * 100));
                return (
                  <div key={step.step}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{step.label}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {step.count.toLocaleString('id-ID')}
                        {idx > 0 && ` (${step.conversionFromPrevious}%)`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-5 rounded-md overflow-hidden flex">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-md transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">Memuat data corong pencarian...</div>
          )}
        </div>

        {/* Stats card */}
        <div className="lg:col-span-4 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" />
              Metrik Efektivitas Pencarian
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Rasio klik dan tingkat keberhasilan kueri
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl flex justify-between items-center">
                <span className="text-gray-500">Rata-rata CTR Hasil</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{overallCtr}%</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl flex justify-between items-center">
                <span className="text-gray-500">Rasio Kueri Tanpa Hasil</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">5.4%</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl flex justify-between items-center">
                <span className="text-gray-500">Pencarian ke Unduhan</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">36.8%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
            Pencarian terindeks dengan tokenisasi fonetik dan sinonim lokal bahasa Indonesia.
          </div>
        </div>
      </div>

      {/* 2. TOP SEARCH QUERIES TABLE */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Kata Kunci Paling Populer (Top Queries)
          </h3>
          <span className="text-xs text-gray-400">Diperbarui setiap 15 menit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">Kata Kunci</th>
                <th className="px-3 py-3 text-right">Volume</th>
                <th className="px-3 py-3 text-right">Tayangan</th>
                <th className="px-3 py-3 text-right">Klik</th>
                <th className="px-3 py-3 text-right">CTR</th>
                <th className="px-3 py-3 text-right">Unduhan</th>
                <th className="px-3 py-3 text-right">Pertumbuhan</th>
                <th className="px-4 py-3">Kategori Terkait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {topQueries.map((q) => (
                <tr key={q.query} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                    "{q.query}"
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{q.count.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-3 text-right text-gray-500">{q.impressions.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-3 text-right font-medium text-blue-600 dark:text-blue-400">
                    {q.clicks.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{q.ctr}%</td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {q.downloads.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{q.growthRate}%
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
                      {q.categoryAffinity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ZERO RESULT QUERIES & ACTIONABLE SUGGESTIONS */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Pencarian Tanpa Hasil (Zero-Result Queries)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Peluang penambahan katalog atau pembuatan alias kata kunci agar pengguna menemukan hasil yang dicari
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {zeroResultQueries.map((zq) => (
            <div key={zq.query} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    "{zq.query}"
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded">
                    {zq.count.toLocaleString('id-ID')} dicari
                  </span>
                  <span className="text-xs text-gray-400">
                    Kategori: {zq.categoryAffinity}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Saran Tindakan: {zq.suggestedAction}</span>
                </div>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shrink-0 self-start sm:self-center"
              >
                Buat Alias / Tagar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
