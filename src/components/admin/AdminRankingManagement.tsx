import React, { useState } from 'react';
import { AppData } from '../../types';
import { 
  getRankingConfig, 
  saveRankingConfig, 
  RankingConfig, 
  getPopularRankings 
} from '../../services/ranking/rankingService';
import { getTrendingRankings } from '../../services/ranking/trendingEngine';
import { getNewAndRisingApps } from '../../services/ranking/newAndRisingEngine';
import { 
  BarChart3, 
  Sliders, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Award, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { logAdminAction } from '../../services/admin/auditLogService';

interface AdminRankingManagementProps {
  apps: AppData[];
}

export default function AdminRankingManagement({ apps }: AdminRankingManagementProps) {
  const [config, setConfig] = useState<RankingConfig>(getRankingConfig());
  const [activeTab, setActiveTab] = useState<'weights' | 'popular' | 'trending' | 'newRising' | 'simulation'>('weights');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleWeightChange = (key: keyof RankingConfig['weights'], value: number) => {
    setConfig(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: value
      }
    }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      saveRankingConfig(config);
      setFeedbackMsg({ text: 'Konfigurasi Ranking & Trending Engine berhasil disimpan permanen!', type: 'success' });
      await logAdminAction({
        action: 'admin_setting_changed',
        entityType: 'system',
        entityId: 'rankingConfigs/global',
        entityName: 'Ranking & Trending Engine Config',
        metadata: { description: 'Memperbarui bobot, jendela waktu, dan parameter Ranking Engine Stage 9.4' }
      });
    } catch (err: any) {
      setFeedbackMsg({ text: 'Gagal menyimpan konfigurasi: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Precompute rankings for dashboard preview
  const popularResults = getPopularRankings(apps, 10);
  const trendingResults = getTrendingRankings(apps, config.timeWindow, 10, config.weights);
  const newRisingResults = getNewAndRisingApps(apps, 10);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
            <BarChart3 className="h-3.5 w-3.5 text-blue-200" />
            <span>STAGE 9.4 • RANKING & TRENDING ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pusat Kendali Peringkat & Tren Aplikasi
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
            Kelola bobot scoring multi-faktor, jendela waktu analisis (24j/7h/30h), validasi keamanan, pelacakan Top Movers, dan determinasi ranking deterministik AERO.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-fade-in ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-500/20'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-white/10">
        {[
          { id: 'weights', label: 'Konfigurasi Bobot & Formula', icon: Sliders },
          { id: 'popular', label: 'Pratinjau Popular Ranking', icon: Award },
          { id: 'trending', label: 'Pratinjau Trending & Top Movers', icon: TrendingUp },
          { id: 'newRising', label: 'Pratinjau New & Rising', icon: Sparkles },
          { id: 'simulation', label: 'Validator & Confidence', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Configuration & Weights */}
      {activeTab === 'weights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bobot Baseline Trending Engine (Total: 100%)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Sesuaikan persentase komponen untuk menentukan seberapa besar pengaruh setiap sinyal terhadap skor akhir aplikasi.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'downloadsWeight', label: 'Downloads Volume (35%)', desc: 'Bobot total unduhan ter-log scaling' },
                  { key: 'viewsWeight', label: 'Views & Impressions (20%)', desc: 'Kunjungan halaman & tampilan detail' },
                  { key: 'searchInterestWeight', label: 'Search Interest (15%)', desc: 'Frekuensi pencarian & klik hasil cari' },
                  { key: 'growthRateWeight', label: 'Growth Velocity (15%)', desc: 'Percepatan pertumbuhan unduhan vs periode lalu' },
                  { key: 'saveShareWeight', label: 'Community Engagement (10%)', desc: 'Tindakan simpan (bookmark) & bagikan' },
                  { key: 'freshnessWeight', label: 'Freshness & Updates (5%)', desc: 'Waktu rilis pembaruan versi terbaru' }
                ].map((item) => {
                  const currentVal = config.weights[item.key as keyof typeof config.weights];
                  return (
                    <div key={item.key} className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center justify-between text-sm font-bold text-slate-800 dark:text-slate-200">
                        <span>{item.label}</span>
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black">
                          {Math.round(currentVal * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={currentVal}
                        onChange={(e) => handleWeightChange(item.key as any, parseFloat(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Jendela Waktu & Decay</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Rolling Window</label>
                  <select
                    value={config.timeWindow}
                    onChange={(e) => setConfig({ ...config, timeWindow: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="24h">24 Jam (Short-term Trending Velocity)</option>
                    <option value="7d">7 Hari (Medium-term Popularity)</option>
                    <option value="30d">30 Hari (Long-term Stable Popularity)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Minimum Sample Threshold</label>
                  <input
                    type="number"
                    value={config.minSampleThreshold}
                    onChange={(e) => setConfig({ ...config, minSampleThreshold: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400">Minimal aktivitas agar aplikasi layak masuk daftar Trending.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-3xl p-6 border border-blue-500/20 space-y-3">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Security Gating Aktif</span>
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Aplikasi berstatus <strong className="font-bold">unpublished</strong>, <strong className="font-bold">rejected</strong>, <strong className="font-bold">quarantined</strong>, atau gagal uji keamanan otomatis disingkirkan dari seluruh hasil ranking publik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Popular Preview */}
      {activeTab === 'popular' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Top 10 Popular Rankings (Global)
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Peringkat popularitas jangka panjang berdasarkan unduhan, views, rating, dan kualitas metadata.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold">
              {popularResults.length} Aplikasi Eligible
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Aplikasi</th>
                  <th className="py-3 px-4">Kategori Utama</th>
                  <th className="py-3 px-4">Skor Normalisasi</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Alasan Utama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {popularResults.map((item) => (
                  <tr key={item.app.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                      #{item.rank}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2.5">
                      <img src={item.app.icon} alt="" className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-white/10" />
                      <div>
                        <div className="font-bold">{item.app.name}</div>
                        <div className="text-[10px] text-slate-400">{item.app.developer}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md font-bold text-slate-600 dark:text-slate-300">
                        {item.categories.primary}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-blue-600 dark:text-blue-400">
                      {item.score} pts
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        item.confidenceLevel === 'HIGH' ? 'bg-emerald-500/10 text-emerald-600' :
                        item.confidenceLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {item.confidenceLevel} ({Math.round(item.confidence * 100)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">
                      {item.reasons[0] || 'Kinerja stabil'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Trending & Top Movers */}
      {activeTab === 'trending' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Trending & Top Movers (Window: {config.timeWindow})
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Melacak aplikasi dengan percepatan lonjakan aktivitas (velocity) dan pergerakan posisi peringkat.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold">
              Top Movers Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Pergerakan</th>
                  <th className="py-3 px-4">Aplikasi</th>
                  <th className="py-3 px-4">Skor Velocity</th>
                  <th className="py-3 px-4">Sinyal Pendorong</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {trendingResults.map((item) => {
                  const isUp = item.movement.type === 'up';
                  const isNew = item.movement.type === 'new';
                  return (
                    <tr key={item.app.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                        #{item.rank}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${
                          isNew ? 'bg-purple-500/10 text-purple-600' :
                          isUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                        }`}>
                          {isNew ? <Sparkles className="h-3.5 w-3.5" /> : isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          <span>{item.movementLabel}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2.5">
                        <img src={item.app.icon} alt="" className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-white/10" />
                        <div>
                          <div className="font-bold">{item.app.name}</div>
                          <div className="text-[10px] text-slate-400">{item.app.category}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-black text-purple-600 dark:text-purple-400">
                        {item.score} pts
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {item.reasons.join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: New & Rising */}
      {activeTab === 'newRising' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                New & Rising Discovery
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Aplikasi rilisan segar dengan boost freshness dan pertumbuhan awal yang menjanjikan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {newRisingResults.map((item) => (
              <div key={item.app.id} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={item.app.icon} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-white/10" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.app.name}</h4>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md">
                      Skor: {item.score}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{item.app.description}</p>
                <div className="text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <span>Usia: {item.newnessDays} hari</span>
                  <span>Pertumbuhan +{item.growthScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Validator & Confidence */}
      {activeTab === 'simulation' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ranking Validator & Confidence Audit
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Memeriksa integritas data katalog, eligibility keamanan, dan distribusi level confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Katalog</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{apps.length}</div>
              <p className="text-xs text-slate-500">Seluruh aplikasi terdaftar dalam database.</p>
            </div>

            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/20 space-y-2">
              <span className="text-xs font-bold text-emerald-600 uppercase">Eligible for Ranking</span>
              <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                {apps.filter(a => (a.status === 'published' || !a.status)).length}
              </div>
              <p className="text-xs text-emerald-600/80">Lolos uji moderasi & security gating.</p>
            </div>

            <div className="p-5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-500/20 space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase">Confidence High Rate</span>
              <div className="text-3xl font-black text-blue-700 dark:text-blue-300">
                {Math.round((apps.filter(a => (a.downloads || 0) > 1000).length / Math.max(1, apps.length)) * 100)}%
              </div>
              <p className="text-xs text-blue-600/80">Proporsi aplikasi dengan sampel data tinggi.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
