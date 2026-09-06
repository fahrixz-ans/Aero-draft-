import React, { useState, useMemo } from 'react';
import { 
  Flame, TrendingUp, Eye, Download, Search, Sparkles, RefreshCw, Star, 
  Award, ShieldCheck, Check, AlertTriangle, Activity, 
  Zap, Layers, AlertCircle, Bookmark, Share2, Filter, ArrowUpRight
} from 'lucide-react';
import { AppData, AppReport } from '../../types';
import { db } from '../../lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { 
  computeAdminIntelligence, 
  getTrendingRankings, 
  getSmartCollections, 
  getSearchIntelligenceSummary, 
  getAppsRequiringAttention,
  computeAppQualityScore,
  AdminTimeRange,
  TrendingWindow 
} from '../../services';

interface TrendingDashboardProps {
  apps: AppData[];
  reports?: AppReport[];
  onRefresh: () => void;
}

export default function TrendingDashboard({ apps, reports = [], onRefresh }: TrendingDashboardProps) {
  const [updating, setUpdating] = useState(false);
  const [boostMessage, setBoostMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'health' | 'search' | 'funnel' | 'collections'>('trending');
  const [trendingWindow, setTrendingWindow] = useState<TrendingWindow>('7d');
  const [adminTimeRange, setAdminTimeRange] = useState<AdminTimeRange>('7d');

  // Compute intelligence datasets
  const adminData = useMemo(() => computeAdminIntelligence(apps, reports, adminTimeRange), [apps, reports, adminTimeRange]);
  const trendingRankings = useMemo(() => getTrendingRankings(apps, trendingWindow), [apps, trendingWindow]);
  const smartCollections = useMemo(() => getSmartCollections(apps), [apps]);
  const searchSummary = useMemo(() => getSearchIntelligenceSummary(apps), [apps]);
  const attentionApps = useMemo(() => getAppsRequiringAttention(apps, reports), [apps, reports]);

  const handleSyncScoresToFirestore = async () => {
    setUpdating(true);
    setBoostMessage(null);
    try {
      const chunkSize = 200;
      for (let i = 0; i < trendingRankings.length; i += chunkSize) {
        const chunk = trendingRankings.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach(item => {
          const appRef = doc(db, 'applications', item.app.id);
          const quality = computeAppQualityScore(item.app);
          batch.update(appRef, {
            trendingScore: item.score,
            'analytics.trendingScore': item.score,
            'analytics.qualityScore': quality.totalScore,
            'analytics.lastCalculatedAt': new Date().toISOString()
          });
        });

        await batch.commit();
      }

      setBoostMessage('Skor Trending & Metrik Kualitas berhasil disinkronkan langsung ke Cloud Firestore!');
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setBoostMessage('Gagal sinkron skor ke Firestore: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-intelligence-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-150 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Zap className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Intelijen Rekomendasi & Analitik Performa Aero
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-0.5">
                Mesin peringkat otomatis berbasis interaksi nyata, time-decay 24h/7d/30d, audit kualitas, & corong konversi.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSyncScoresToFirestore}
          disabled={updating}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {updating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>Sinkronisasi Skor Firestore</span>
        </button>
      </div>

      {boostMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{boostMessage}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-450 dark:text-slate-400">
            <span>Rerata Kualitas</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {adminData.qualityDistribution.averageScore}/100
          </div>
          <div className="text-[10px] text-slate-450 font-semibold">
            Grade A: {adminData.qualityDistribution.gradeA} • Grade B: {adminData.qualityDistribution.gradeB}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-450 dark:text-slate-400">
            <span>Konversi Unduhan APK</span>
            <Download className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {adminData.apkConversionRate}%
          </div>
          <div className="text-[10px] text-slate-450 font-semibold">
            Selesai: {adminData.downloadCompletionRate}% ({adminData.totalDownloadsCompleted} unduh)
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-450 dark:text-slate-400">
            <span>Total Tayangan & Minat</span>
            <Eye className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {adminData.totalViews.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-450 font-semibold">
            {adminData.totalSaves} disimpan • {adminData.totalShares} dibagikan
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-450 dark:text-slate-400">
            <span>Kesehatan Katalog</span>
            <ShieldCheck className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {apps.length - attentionApps.length}/{apps.length}
          </div>
          <div className="text-[10px] text-slate-450 font-semibold">
            {attentionApps.length} aplikasi perlu perhatian/review
          </div>
        </div>
      </div>

      {/* Actionable Insights Section */}
      {adminData.actionableInsights.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 border border-blue-500/15 rounded-3xl space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Wawasan Cerdas & Rekomendasi Tindakan (Actionable Insights)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {adminData.actionableInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-3.5 bg-white dark:bg-black/20 border border-slate-150 dark:border-white/5 rounded-2xl space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    insight.type === 'opportunity' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    insight.type === 'warning' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                    insight.type === 'quality' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    {insight.type}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-850 dark:text-white">
                  {insight.title}
                </h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-150 dark:border-white/5 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('trending')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'trending'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Peringkat Trending & Momentum</span>
        </button>

        <button
          onClick={() => setActiveTab('funnel')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'funnel'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Corong Penemuan & Konversi</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'health'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Audit Kualitas & Kesehatan ({attentionApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'search'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Intelijen Pencarian</span>
        </button>

        <button
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'collections'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Koleksi Cerdas ({smartCollections.length})</span>
        </button>
      </div>

      {/* Tab 1: Trending & Momentum */}
      {activeTab === 'trending' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs font-semibold text-slate-450 dark:text-slate-400">
              Formula pembobotan dinamis: 24 Jam (2.5x), 7 Hari (1.0x), Unduhan (5.0x), Klik Resmi (3.0x), View (1.5x), Save (4.0x).
            </div>

            {/* Window selector */}
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
              {(['24h', '7d', '30d'] as TrendingWindow[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setTrendingWindow(w)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    trendingWindow === w
                      ? 'bg-white dark:bg-orange-500 text-slate-900 dark:text-white shadow-sm font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {w === '24h' ? '24 Jam' : w === '7d' ? '7 Hari' : '30 Hari'}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Spotlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendingRankings.slice(0, 3).map((item) => (
              <div
                key={item.app.id}
                className="p-5 bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.04] dark:to-white/[0.01] border border-slate-150 dark:border-white/5 rounded-3xl space-y-4 relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase">
                  <Award className="h-3.5 w-3.5" />
                  <span>#{item.rank} {item.movementLabel}</span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={item.app.iconUrl || item.app.icon}
                    alt={item.app.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 shadow-sm"
                  />
                  <div className="min-w-0 pr-20">
                    <h3 className="text-sm font-black text-slate-850 dark:text-white truncate">
                      {item.app.name}
                    </h3>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold truncate">
                      {item.app.developerName || item.app.developer}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-100/70 dark:bg-black/30 rounded-2xl flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Trending Score:
                  </span>
                  <span className="text-base font-black text-amber-500 flex items-center gap-1">
                    <Flame className="h-4 w-4 fill-amber-500" />
                    {item.score.toFixed(1)} pts
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Faktor Pendorong:</div>
                  <div className="flex flex-wrap gap-1">
                    {item.reasons.map((r, i) => (
                      <span key={i} className="text-[10px] font-semibold bg-white dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-150 dark:border-white/5 text-slate-600 dark:text-slate-300">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Full Table */}
          <div className="border border-slate-150 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-white/5">
                <thead className="bg-slate-50 dark:bg-white/[0.02]">
                  <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Posisi</th>
                    <th className="py-3 px-4">Aplikasi</th>
                    <th className="py-3 px-4 text-center">Trending Score</th>
                    <th className="py-3 px-4 text-center">Pergerakan</th>
                    <th className="py-3 px-4 text-center">Views</th>
                    <th className="py-3 px-4 text-center">Unduhan/Klik</th>
                    <th className="py-3 px-4 text-center">Saves</th>
                    <th className="py-3 px-4">Alasan Utama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-slate-700 dark:text-slate-300">
                  {trendingRankings.map((item) => (
                    <tr key={item.app.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                      <td className="py-3 px-4 font-mono font-black text-slate-400">
                        #{item.rank}
                      </td>
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={item.app.iconUrl || item.app.icon}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white truncate">
                            {item.app.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.app.developerName || item.app.developer} • <span className="font-bold text-slate-500">{item.app.category}</span>
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-black text-xs">
                          <Flame className="h-3 w-3 fill-amber-500" />
                          {item.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold ${
                          item.movementLabel.startsWith('↑') ? 'text-emerald-500' :
                          item.movementLabel.startsWith('↓') ? 'text-red-500' :
                          item.movementLabel === 'NEW' ? 'text-blue-500' : 'text-slate-400'
                        }`}>
                          {item.movementLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                        {item.app.analytics?.views || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {(item.app.analytics?.officialClicks || 0) + (item.app.analytics?.downloadsCompleted || 0)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                        {item.app.analytics?.saves || 0}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        {item.reasons.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Discovery & Conversion Funnel */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-3xl space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Corong Penemuan Pengguna (Discovery Funnel)
              </h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">
                Pelacakan alur perjalanan pengguna dari pencarian/impresi hingga keberhasilan instalasi/unduh.
              </p>
            </div>

            <div className="space-y-4">
              {adminData.funnelSteps.map((step, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 dark:text-slate-200">
                      {idx + 1}. {step.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-900 dark:text-white font-extrabold">
                        {step.count.toLocaleString()}
                      </span>
                      {idx > 0 && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {step.rateFromPrevious}% dari tahap sebelumnya
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/5 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      style={{
                        width: `${Math.max(8, Math.min(100, (step.count / (adminData.funnelSteps[0]?.count || 1)) * 100))}%`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-450">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance Breakdown */}
          <div className="p-6 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Performa Konversi Berdasarkan Kategori
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {adminData.categoryStats.map((c) => (
                <div key={c.category} className="p-3.5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl space-y-2 border border-slate-150 dark:border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{c.category}</span>
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">
                      {c.appCount} aplikasi
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>{c.views} tayangan</span>
                    <span className="text-emerald-500">{c.conversionRate}% konversi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Quality & Catalog Health */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-3">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Distribusi Kualitas Metadata
              </h3>
              <div className="space-y-2">
                {[
                  { grade: 'A', count: adminData.qualityDistribution.gradeA, label: 'Sangat Lengkap (85-100)' },
                  { grade: 'B', count: adminData.qualityDistribution.gradeB, label: 'Baik (70-84)' },
                  { grade: 'C', count: adminData.qualityDistribution.gradeC, label: 'Cukup (50-69)' },
                  { grade: 'D', count: adminData.qualityDistribution.gradeD, label: 'Perlu Optimasi (<50)' }
                ].map(({ grade, count, label }) => {
                  const percent = apps.length > 0 ? Math.round((count / apps.length) * 100) : 0;
                  return (
                    <div key={grade} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-300">Grade {grade} ({label})</span>
                        <span className="font-mono text-slate-900 dark:text-white">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            grade === 'A' ? 'bg-emerald-500' : grade === 'B' ? 'bg-blue-500' : grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-3 md:col-span-2">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Status Pemantauan Anomali & Kesehatan Aplikasi
              </h3>
              <p className="text-xs text-slate-450 font-semibold">
                Sistem memantau secara real-time rasio kegagalan unduhan, laporan tautan rusak, dan integritas berkas.
              </p>
              <div className="space-y-2">
                {attentionApps.length === 0 ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span>Semua aplikasi berada dalam status Sehat (Healthy) tanpa anomali terdeteksi.</span>
                  </div>
                ) : (
                  attentionApps.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-xl flex items-start gap-3">
                      <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${item.status === 'problem' ? 'text-red-500' : 'text-amber-500'}`} />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.appName}</div>
                        <div className="text-[11px] text-slate-450 mt-0.5">
                          {item.issues.join(' • ')}
                        </div>
                        <div className="text-[10px] text-blue-500 font-semibold mt-1">
                          Saran: {item.suggestedAction}
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        item.status === 'problem' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {item.status} ({item.healthScore}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Search Intelligence */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trending & Popular Queries */}
            <div className="p-5 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Kata Kunci Pencarian Tren
                </h3>
              </div>
              <div className="space-y-2">
                {searchSummary.trendingSearches.map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-white/[0.02] rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      "{t.query}"
                    </span>
                    <span className="text-xs font-mono font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
                      +{t.growth} lonjakan
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zero Results / Demand Gaps */}
            <div className="p-5 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Pencarian Tanpa Hasil (Peluang Katalog Baru)
                </h3>
              </div>
              <div className="space-y-2">
                {searchSummary.zeroResultQueries.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic">Semua pencarian pengguna menemukan hasil aplikasi yang relevan.</p>
                ) : (
                  searchSummary.zeroResultQueries.map((z, idx) => (
                    <div key={idx} className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        "{z.query}"
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {z.count} kali dicari
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Smart Collections */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {smartCollections.map((col) => (
              <div key={col.id} className="p-5 bg-white dark:bg-white/[0.02] border border-slate-150 dark:border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full border border-blue-500/20">
                    {col.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-450 font-semibold">
                  {col.description}
                </p>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {col.apps.length} Aplikasi Terkait:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {col.apps.map(a => (
                    <span key={a.id} className="text-[11px] font-semibold bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
