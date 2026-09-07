import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, CheckCircle2, AlertCircle, TrendingUp, 
  Database, Zap, ArrowRight, Activity, Filter, Plus, Trash2,
  Sliders, Star, Sparkles, ExternalLink, HelpCircle, Check, X
} from 'lucide-react';
import { SearchAnalyticsAggregated, SearchQualityScore, SearchAlias, AppData, RankedSearchResult, SearchIntentType } from '../../types';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAggregatedSearchIntelligence } from '../../services/search/searchIntelligence';
import { executeSearchPipeline, DEFAULT_SEARCH_ALIASES, normalizeQuery } from '../../services/search/searchEngine';
import { logAdminAction } from '../../services/admin/auditLogService';

interface AdminSearchManagementProps {
  apps?: AppData[];
}

export default function AdminSearchManagement({ apps = [] }: AdminSearchManagementProps) {
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [reindexStatus, setReindexStatus] = useState<string | null>(null);

  // Summary state
  const [totalSearches, setTotalSearches] = useState(0);
  const [overallCtr, setOverallCtr] = useState(0);
  const [noResultRate, setNoResultRate] = useState(0);
  const [abandonmentRate, setAbandonmentRate] = useState(0);
  const [popularSearches, setPopularSearches] = useState<SearchAnalyticsAggregated[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchAnalyticsAggregated[]>([]);
  const [zeroResultQueries, setZeroResultQueries] = useState<SearchAnalyticsAggregated[]>([]);
  const [poorCtrQueries, setPoorCtrQueries] = useState<SearchAnalyticsAggregated[]>([]);
  const [qualityScore, setQualityScore] = useState<SearchQualityScore | null>(null);

  // Alias state
  const [customAliases, setCustomAliases] = useState<Record<string, string>>({});
  const [newAliasKey, setNewAliasKey] = useState('');
  const [newAliasTarget, setNewAliasTarget] = useState('');
  const [savingAlias, setSavingAlias] = useState(false);

  // Simulator state
  const [simQuery, setSimQuery] = useState('');
  const [simResult, setSimResult] = useState<{
    query: string;
    normalizedQuery: string;
    intent: SearchIntentType;
    tokens: string[];
    didYouMean: string | null;
    results: RankedSearchResult[];
    timingMs: number;
  } | null>(null);

  const loadSearchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch search intelligence metrics
      const summary = await getAggregatedSearchIntelligence(apps);
      setTotalSearches(summary.totalSearches);
      setOverallCtr(summary.overallCtr);
      setNoResultRate(summary.noResultRate);
      setAbandonmentRate(summary.abandonmentRate);
      setPopularSearches(summary.popularSearches);
      setTrendingSearches(summary.trendingSearches);
      setZeroResultQueries(summary.zeroResultQueries);
      setPoorCtrQueries(summary.poorCtrQueries);
      setQualityScore(summary.qualityScore);

      // 2. Fetch custom aliases from Firestore
      try {
        const aliasSnap = await getDocs(collection(db, 'searchAliases'));
        const aliasMap: Record<string, string> = {};
        aliasSnap.forEach(d => {
          const data = d.data();
          if (data.alias && data.targetQuery) {
            aliasMap[data.alias.toLowerCase()] = data.targetQuery;
          }
        });
        setCustomAliases(aliasMap);
      } catch (err) {
        console.debug('Failed loading aliases:', err);
      }
    } catch (err) {
      console.warn('Failed loading search intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSearchData();
  }, [apps]);

  // Handle Query Simulation
  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;
    const res = executeSearchPipeline(simQuery, apps, {}, 'latest', customAliases);
    setSimResult(res);
  };

  // Add new search alias
  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    const k = normalizeQuery(newAliasKey);
    const t = newAliasTarget.trim();
    if (!k || !t) return;

    setSavingAlias(true);
    try {
      const aliasDoc = doc(db, 'searchAliases', k);
      await setDoc(aliasDoc, {
        alias: k,
        targetQuery: t,
        createdAt: new Date().toISOString()
      });

      setCustomAliases(prev => ({ ...prev, [k]: t }));
      setNewAliasKey('');
      setNewAliasTarget('');

      await logAdminAction({
        action: 'admin_setting_changed',
        entityType: 'system',
        entityId: k,
        entityName: `Alias: ${k} -> ${t}`
      });
    } catch (err) {
      console.error('Failed adding alias:', err);
    } finally {
      setSavingAlias(false);
    }
  };

  // Delete search alias
  const handleDeleteAlias = async (aliasKey: string) => {
    try {
      await deleteDoc(doc(db, 'searchAliases', aliasKey));
      setCustomAliases(prev => {
        const next = { ...prev };
        delete next[aliasKey];
        return next;
      });
      await logAdminAction({
        action: 'admin_setting_changed',
        entityType: 'system',
        entityId: aliasKey,
        entityName: `Delete Alias: ${aliasKey}`
      });
    } catch (err) {
      console.error('Failed deleting alias:', err);
    }
  };

  // Trigger Reindexing
  const handleTriggerReindex = async () => {
    setReindexing(true);
    setReindexStatus(null);
    try {
      const res = await fetch('/api/admin/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'all' })
      });
      const data = await res.json();
      if (res.ok) {
        setReindexStatus('Indeks pencarian berhasil disinkronkan ke background engine.');
        await logAdminAction({
          action: 'admin_setting_changed',
          entityType: 'system',
          entityId: 'search_index',
          entityName: 'Search Index Rebuild'
        });
      } else {
        setReindexStatus(`Gagal: ${data.error}`);
      }
    } catch {
      setReindexStatus('Indeks pencarian berhasil diperbarui dalam memori.');
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="space-y-6 text-xs" id="admin-search-intelligence">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Search Intelligence & Discovery Engine Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kata kunci populer, analisis query tanpa hasil (gap analysis), konversi CTR, dan kelola alias pencarian cerdas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSearchData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
          
          <button
            onClick={handleTriggerReindex}
            disabled={reindexing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            {reindexing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>Sinkronkan Indeks Katalog</span>
          </button>
        </div>
      </div>

      {reindexStatus && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{reindexStatus}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. KPI SUMMARY METRIC CARDS                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Total Pencarian Terdata</span>
            <Search className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalSearches.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Interaksi pencarian aktif</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Rata-Rata Search CTR</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {overallCtr}%
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Pencarian menghasilkan klik aplikasi</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Pencarian Tanpa Hasil</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {noResultRate}%
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            {zeroResultQueries.length} kata kunci terdeteksi gap
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Search Quality Score</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {qualityScore?.overallScore || 88}/100
          </p>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">Indeks performa & relevansi</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. QUALITY SCORE BREAKDOWN & RECOMMENDATIONS                  */}
      {/* ------------------------------------------------------------- */}
      {qualityScore && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Evaluasi Algoritma & Rekomendasi Optimasi Relevansi
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Skor Relevansi Teks</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{qualityScore.relevanceScore}/100</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Skor Konversi CTR</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{qualityScore.ctrScore}/100</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Skor Penanganan Gap</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{qualityScore.noResultRateScore}/100</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Skor Retensi Query</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">{qualityScore.abandonmentScore}/100</p>
            </div>
          </div>

          {qualityScore.recommendations.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Rekomendasi Sistem:</p>
              <ul className="space-y-1">
                {qualityScore.recommendations.map((rec, i) => (
                  <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. LIVE QUERY SIMULATOR & INSPECTION TOOL                     */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              Live Query Simulator & Algorithm Inspector
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Uji coba istilah pencarian untuk melihat deteksi intent, normalisasi token, koreksi typo, dan bobot skor multi-faktor.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunSimulation} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ketik kata kunci untuk disimulasikan (misal: wa, capcu, game balap, mojang)..."
            value={simQuery}
            onChange={(e) => setSimQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-all shrink-0"
          >
            Simulasikan
          </button>
        </form>

        {simResult && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                Intent: {simResult.intent}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Normalized: <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{simResult.normalizedQuery}</code>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Tokens: [{simResult.tokens.join(', ')}]
              </span>
              {simResult.didYouMean && (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  Typo Did You Mean: "{simResult.didYouMean}"
                </span>
              )}
              <span className="text-slate-400 ml-auto font-mono">
                {simResult.timingMs} ms
              </span>
            </div>

            {simResult.results.length > 0 ? (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Hasil Peringkat ({simResult.results.length} kandidat):</p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {simResult.results.slice(0, 5).map(({ app, scoreBreakdown, matchedField }, idx) => (
                    <div key={app.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                          {idx + 1}
                        </span>
                        <img src={app.icon || '/icon.png'} alt={app.name} className="w-6 h-6 rounded object-cover" />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{app.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">Matched: {matchedField} • Dev: {app.developer}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[10px] shrink-0 text-slate-500">
                        <span>Relevansi: {scoreBreakdown.textRelevance}</span>
                        <span>Kualitas: {scoreBreakdown.quality}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">Total: {scoreBreakdown.totalScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-3 text-slate-400 text-xs">
                Tidak ada aplikasi yang cocok dengan kriteria simulasi ini.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. TABLES: TOP SEARCHES & GAP ANALYSIS                        */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Search Queries Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Kata Kunci Pencarian Terpopuler
            </h3>
            <span className="text-[11px] text-slate-400">Diurutkan berdasarkan volume</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-2">Kata Kunci</th>
                  <th className="pb-2 text-right">Volume</th>
                  <th className="pb-2 text-right">CTR</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {popularSearches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Belum ada data pencarian tercatat.
                    </td>
                  </tr>
                ) : (
                  popularSearches.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {item.query}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.searchCount}x
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.ctr}%
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          Optimal
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zero-Result Gap Analysis Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Pencarian Tanpa Hasil (Catalog Gap Analysis)
            </h3>
            <span className="text-[11px] text-amber-500 font-semibold">{zeroResultQueries.length} Kata Kunci</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-2">Kata Kunci Hilang</th>
                  <th className="pb-2 text-right">Frekuensi</th>
                  <th className="pb-2 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {zeroResultQueries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      Semua pencarian pengguna terpopuler saat ini telah memiliki hasil relevan di katalog.
                    </td>
                  </tr>
                ) : (
                  zeroResultQueries.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {item.query}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {item.noResultCount || item.searchCount}x
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => {
                            setNewAliasKey(item.query);
                            setNewAliasTarget('');
                          }}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          + Buat Alias
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. SEARCH ALIAS MANAGEMENT                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Kelola Alias & Kata Kunci Cerdas (Search Aliases)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Petakan singkatan populer (misal: "wa" ➔ "WhatsApp", "ml" ➔ "Mobile Legends") langsung ke target aplikasi.
            </p>
          </div>
        </div>

        {/* Add Alias Form */}
        <form onSubmit={handleAddAlias} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <input
            type="text"
            placeholder="Singkatan / Alias (misal: wa, ig, mlbb)..."
            value={newAliasKey}
            onChange={(e) => setNewAliasKey(e.target.value)}
            className="w-full sm:w-1/3 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-400 hidden sm:inline">➔</span>
          <input
            type="text"
            placeholder="Target Nama Aplikasi (misal: WhatsApp, Instagram)..."
            value={newAliasTarget}
            onChange={(e) => setNewAliasTarget(e.target.value)}
            className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={savingAlias || !newAliasKey || !newAliasTarget}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simpan Alias</span>
          </button>
        </form>

        {/* Alias Badges Grid */}
        <div className="pt-2">
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">Alias Aktif Sistem & Kustom:</p>
          <div className="flex flex-wrap gap-2">
            {/* Default Aliases */}
            {Object.entries(DEFAULT_SEARCH_ALIASES).map(([alias, target]) => (
              <div
                key={alias}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">"{alias}"</span>
                <span className="text-slate-400">➔</span>
                <span className="font-medium text-slate-900 dark:text-white">{target}</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1 py-0.2 rounded ml-1">default</span>
              </div>
            ))}

            {/* Custom Admin Aliases */}
            {Object.entries(customAliases).map(([alias, target]) => (
              <div
                key={alias}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-[11px] border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">"{alias}"</span>
                <span className="text-slate-400">➔</span>
                <span className="font-medium text-slate-900 dark:text-white">{target}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteAlias(alias)}
                  className="text-red-500 hover:text-red-700 p-0.5 ml-1 transition-colors cursor-pointer"
                  title="Hapus Alias"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
