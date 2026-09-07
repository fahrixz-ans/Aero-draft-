import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Sliders, BarChart3, Settings2, ShieldAlert, 
  RotateCcw, Save, Check, RefreshCw, Layers, Eye, 
  TrendingUp, Download, Heart, ArrowUpRight, Search, 
  AlertCircle, Pin, Trash2, Plus, HelpCircle, CheckCircle2, ChevronRight, Filter
} from 'lucide-react';
import { AppData } from '../../types';
import { 
  RecommendationConfig, 
  RecommendationPerformanceSummary, 
  ScoredApp,
  UserInterestProfile,
  RecommendationShelfConfig
} from '../../services/recommendations/recommendationTypes';
import { 
  getRecommendationConfig, 
  saveRecommendationConfig, 
  resetRecommendationConfigToDefaults 
} from '../../services/recommendations/recommendationConfig';
import { 
  getRecommendationAnalyticsSummary 
} from '../../services/recommendations/recommendationAnalytics';
import { 
  getForYouRecommendations, 
  getSimilarAppsRecommendations,
  getYouMightLikeRecommendations 
} from '../../services/recommendations/recommendationService';
import { logAdminAction } from '../../services/admin/auditLogService';

interface AdminRecommendationManagementProps {
  apps: AppData[];
}

export default function AdminRecommendationManagement({ apps }: AdminRecommendationManagementProps) {
  const [config, setConfig] = useState<RecommendationConfig | null>(null);
  const [analytics, setAnalytics] = useState<RecommendationPerformanceSummary | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'weights' | 'signals' | 'shelves' | 'rules' | 'simulator' | 'analytics'>('weights');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Simulator state
  const [simulatorAppId, setSimulatorAppId] = useState<string>(apps[0]?.id || '');
  const [simulatorCategory, setSimulatorCategory] = useState<string>('Tools');
  const [simulatedResults, setSimulatedResults] = useState<ScoredApp[]>([]);
  const [simulating, setSimulating] = useState(false);

  // Exclude App State
  const [selectedExcludeAppId, setSelectedExcludeAppId] = useState<string>('');
  
  // Pin App State
  const [pinShelfTarget, setPinShelfTarget] = useState<string>('forYou');
  const [pinAppTarget, setPinAppTarget] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const loadedConfig = await getRecommendationConfig();
      setConfig(loadedConfig);
      const loadedAnalytics = await getRecommendationAnalyticsSummary(apps, true);
      setAnalytics(loadedAnalytics);
    } catch (err: any) {
      setFeedbackMsg({ text: 'Gagal memuat konfigurasi: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await saveRecommendationConfig(config);
      setConfig(updated);
      setFeedbackMsg({ text: 'Konfigurasi Recommendation Engine berhasil disimpan permanen!', type: 'success' });
      await logAdminAction({
        action: 'admin_setting_changed',
        entityType: 'system',
        entityId: 'recommendationConfigs/global',
        entityName: 'Recommendation Engine Config',
        metadata: { description: 'Memperbarui bobot dan aturan Recommendation Engine Stage 9.3' }
      });
    } catch (err: any) {
      setFeedbackMsg({ text: 'Gagal menyimpan konfigurasi: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Kembalikan semua bobot dan konfigurasi rekomendasi ke standar default?')) return;
    setSaving(true);
    try {
      const reset = await resetRecommendationConfigToDefaults();
      setConfig(reset);
      setFeedbackMsg({ text: 'Konfigurasi rekomendasi telah direset ke default sistem.', type: 'success' });
      await logAdminAction({
        action: 'admin_setting_changed',
        entityType: 'system',
        entityId: 'recommendationConfigs/global',
        entityName: 'Recommendation Engine Config Reset',
        metadata: { description: 'Mereset konfigurasi rekomendasi ke default' }
      });
    } catch (err: any) {
      setFeedbackMsg({ text: 'Gagal mereset konfigurasi: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const runSimulation = async () => {
    if (!apps || apps.length === 0) return;
    setSimulating(true);
    try {
      const targetApp = apps.find(a => a.id === simulatorAppId) || apps[0];
      if (targetApp) {
        const results = await getSimilarAppsRecommendations(targetApp, apps, 8);
        setSimulatedResults(results);
      }
    } catch (err: any) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'simulator' && simulatedResults.length === 0 && apps.length > 0) {
      runSimulation();
    }
  }, [activeSubTab, simulatorAppId]);

  if (loading || !config) {
    return (
      <div className="py-20 text-center space-y-3 animate-pulse">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Memuat Recommendation Engine...</p>
      </div>
    );
  }

  // Calculate sum of scoring factors to guarantee calibration
  const factorSum = Math.round(
    (config.factors.similarity +
    config.factors.interest +
    config.factors.popularity +
    config.factors.freshness +
    config.factors.quality +
    config.factors.trending) * 100
  );

  return (
    <div className="space-y-6 animate-fade-in" id="admin-recommendations-root">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-indigo-950/40 p-6 rounded-3xl border border-blue-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Recommendation Engine & Personalization
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                Stage 9.3 Production Engine
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pl-1">
            Konfigurasi pembobotan deterministik, pelacakan sinyal perilaku pengguna, dan analitik konversi rak rekomendasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
            : 'bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            Tutup
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-450">Total Impresi Rekomendasi</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {analytics?.totalImpressions || 0}
          </h3>
          <p className="text-[10px] text-slate-450 mt-0.5">Tampilan kartu rekomendasi</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-450">Klik Rekomendasi</span>
          <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {analytics?.totalClicks || 0}
          </h3>
          <p className="text-[10px] text-slate-450 mt-0.5">Interaksi masuk ke halaman detail</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-450">Global CTR Rekomendasi</span>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {analytics?.overallCtr || 0}%
          </h3>
          <p className="text-[10px] text-slate-450 mt-0.5">Rasio klik per impresi</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-450">Total Konversi Unduh/Simpan</span>
          <h3 className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {analytics?.totalConversions || 0}
          </h3>
          <p className="text-[10px] text-slate-450 mt-0.5">Konversi unduh atau simpan</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-450">Status Kalibrasi Bobot</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-lg font-black ${factorSum === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {factorSum}%
            </span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              factorSum === 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
            }`}>
              {factorSum === 100 ? 'Optimal' : 'Perlu disesuaikan'}
            </span>
          </div>
          <p className="text-[10px] text-slate-450 mt-0.5">Target total bobot: 100%</p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'weights', label: 'Bobot Algoritma (Scoring Factors)', icon: Sliders },
          { id: 'signals', label: 'Sinyal Perilaku (Behavioral Weights)', icon: ActivitySignalIcon },
          { id: 'shelves', label: 'Manajemen Rak (Shelves Config)', icon: Layers },
          { id: 'rules', label: 'Blacklist & Pinned Recommendations', icon: ShieldAlert },
          { id: 'simulator', label: 'Live Simulator & Inspector', icon: Eye },
          { id: 'analytics', label: 'Analitik & Performa', icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: SCORING FACTORS */}
      {activeSubTab === 'weights' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-500" />
                <span>Bobot Faktor Penilaian Rekomendasi (Total: {factorSum}%)</span>
              </h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">
                Tentukan proporsi kontribusi setiap dimensi terhadap skor rekomendasi akhir sebuah aplikasi (0 - 100).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Factor 1: Similarity */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      1. Kesamaan Konten (Content Similarity)
                    </h4>
                    <p className="text-[11px] text-slate-450">Kecocokan kategori, tag, fitur, dan pengembang</p>
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {Math.round(config.factors.similarity * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="0.60" 
                  step="0.05"
                  value={config.factors.similarity}
                  onChange={e => setConfig({
                    ...config,
                    factors: { ...config.factors, similarity: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Factor 2: User Interest */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      2. Minat Pengguna (User Interest Profile)
                    </h4>
                    <p className="text-[11px] text-slate-450">Afinitas riwayat penelusuran, unduhan, dan kunjungan</p>
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {Math.round(config.factors.interest * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="0.60" 
                  step="0.05"
                  value={config.factors.interest}
                  onChange={e => setConfig({
                    ...config,
                    factors: { ...config.factors, interest: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Factor 3: Popularity */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      3. Popularitas (Popularity & Downloads)
                    </h4>
                    <p className="text-[11px] text-slate-450">Jumlah total unduhan dan rating publik komunitas</p>
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {Math.round(config.factors.popularity * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="0.50" 
                  step="0.05"
                  value={config.factors.popularity}
                  onChange={e => setConfig({
                    ...config,
                    factors: { ...config.factors, popularity: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Factor 4: Freshness */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      4. Kebaruan Rilis (Freshness & Updates)
                    </h4>
                    <p className="text-[11px] text-slate-450">Aplikasi baru dirilis atau diperbarui dalam 7-30 hari</p>
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {Math.round(config.factors.freshness * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="0.40" 
                  step="0.05"
                  value={config.factors.freshness}
                  onChange={e => setConfig({
                    ...config,
                    factors: { ...config.factors, freshness: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Factor 5: Quality */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      5. Mutu & Keamanan (Quality & Security)
                    </h4>
                    <p className="text-[11px] text-slate-450">Kelengkapan metadata, rating tinggi, dan lolos scan APK</p>
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {Math.round(config.factors.quality * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="0.40" 
                  step="0.05"
                  value={config.factors.quality}
                  onChange={e => setConfig({
                    ...config,
                    factors: { ...config.factors, quality: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Factor 6: Trending */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      6. Kecepatan Tren (Trending Velocity)
                    </h4>
                    <p className="text-[11px] text-slate-450">Lonjakan akses dan view count dalam periode aktif</p>
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {Math.round(config.factors.trending * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="0.40" 
                  step="0.05"
                  value={config.factors.trending}
                  onChange={e => setConfig({
                    ...config,
                    factors: { ...config.factors, trending: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Time Decay & Diversity Settings */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Half-Life Peluruhan Waktu Riwayat (Time Decay in Days)
                </label>
                <p className="text-[11px] text-slate-450">
                  Aktivitas lama akan berkurang pengaruhnya secara eksponensial setelah melewati masa hari ini.
                </p>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    min="1"
                    max="90"
                    value={config.timeDecayHalfLifeDays}
                    onChange={e => setConfig({ ...config, timeDecayHalfLifeDays: parseInt(e.target.value) || 14 })}
                    className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">Hari</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ambang Batas Kepercayaan Minimum (Confidence Threshold)
                </label>
                <p className="text-[11px] text-slate-450">
                  Skor minimum agar sebuah aplikasi lolos ke rak personalisasi tanpa beralih ke fallback.
                </p>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    min="5"
                    max="80"
                    value={config.minimumConfidenceThreshold}
                    onChange={e => setConfig({ ...config, minimumConfidenceThreshold: parseInt(e.target.value) || 15 })}
                    className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">Poin (0 - 100)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BEHAVIORAL SIGNALS */}
      {activeSubTab === 'signals' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ActivitySignalIcon className="h-4 w-4 text-blue-500" />
                <span>Bobot Sinyal Perilaku Interaksi Pengguna</span>
              </h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">
                Setiap aksi pengguna menambah skor afinitas kategori dan tag yang terkait secara bertingkat.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* View App */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Lihat Halaman Detail</span>
                <input 
                  type="number" 
                  step="0.5"
                  value={config.behaviorWeights.view}
                  onChange={e => setConfig({
                    ...config,
                    behaviorWeights: { ...config.behaviorWeights, view: parseFloat(e.target.value) || 1.0 }
                  })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Search Query */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pencarian Kata Kunci</span>
                <input 
                  type="number" 
                  step="0.5"
                  value={config.behaviorWeights.search}
                  onChange={e => setConfig({
                    ...config,
                    behaviorWeights: { ...config.behaviorWeights, search: parseFloat(e.target.value) || 2.0 }
                  })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Official Link */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Klik Tautan Situs Resmi</span>
                <input 
                  type="number" 
                  step="0.5"
                  value={config.behaviorWeights.officialClick}
                  onChange={e => setConfig({
                    ...config,
                    behaviorWeights: { ...config.behaviorWeights, officialClick: parseFloat(e.target.value) || 3.0 }
                  })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Save App */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Simpan ke Favorit</span>
                <input 
                  type="number" 
                  step="0.5"
                  value={config.behaviorWeights.save}
                  onChange={e => setConfig({
                    ...config,
                    behaviorWeights: { ...config.behaviorWeights, save: parseFloat(e.target.value) || 4.0 }
                  })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Share App */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bagikan Tautan</span>
                <input 
                  type="number" 
                  step="0.5"
                  value={config.behaviorWeights.share}
                  onChange={e => setConfig({
                    ...config,
                    behaviorWeights: { ...config.behaviorWeights, share: parseFloat(e.target.value) || 4.0 }
                  })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Download APK */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Unduh Berkas APK</span>
                <input 
                  type="number" 
                  step="0.5"
                  value={config.behaviorWeights.download}
                  onChange={e => setConfig({
                    ...config,
                    behaviorWeights: { ...config.behaviorWeights, download: parseFloat(e.target.value) || 5.0 }
                  })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Negative Feedback Penalty */}
              <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/80 dark:border-red-500/20 space-y-2">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">Penalti Umpan Balik Negatif ("Kurang Relevan")</span>
                <input 
                  type="number" 
                  step="0.5"
                  value={config.behaviorWeights.feedbackNegative}
                  onChange={e => setConfig({
                    ...config,
                    behaviorWeights: { ...config.behaviorWeights, feedbackNegative: parseFloat(e.target.value) || -5.0 }
                  })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-500/30 rounded-xl text-xs font-bold text-red-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SHELVES MANAGEMENT */}
      {activeSubTab === 'shelves' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                <span>Pengaturan Rak Rekomendasi Homepage & Detail</span>
              </h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">
                Aktifkan atau nonaktifkan rak, tentukan batas jumlah kartu, dan sesuaikan teks judul.
              </p>
            </div>

            <div className="space-y-4">
              {(Object.entries(config.shelves) as [string, RecommendationShelfConfig][]).map(([key, shelf]) => (
                <div 
                  key={key}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      checked={shelf.enabled}
                      onChange={e => setConfig({
                        ...config,
                        shelves: {
                          ...config.shelves,
                          [key]: { ...shelf, enabled: e.target.checked }
                        }
                      })}
                      className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={shelf.title}
                          onChange={e => setConfig({
                            ...config,
                            shelves: {
                              ...config.shelves,
                              [key]: { ...shelf, title: e.target.value }
                            }
                          })}
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                        />
                        <span className="text-[10px] font-mono text-slate-400">id: {key}</span>
                      </div>
                      <input 
                        type="text"
                        value={shelf.subtitle}
                        onChange={e => setConfig({
                          ...config,
                          shelves: {
                            ...config.shelves,
                            [key]: { ...shelf, subtitle: e.target.value }
                          }
                        })}
                        className="w-full md:w-96 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Batas Kartu:</span>
                    <input 
                      type="number"
                      min="4"
                      max="20"
                      value={shelf.limit}
                      onChange={e => setConfig({
                        ...config,
                        shelves: {
                          ...config.shelves,
                          [key]: { ...shelf, limit: parseInt(e.target.value) || 8 }
                        }
                      })}
                      className="w-16 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: BLACKLIST & PINNED */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6 animate-fade-in">
          {/* Blacklist / Excluded Apps */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span>Daftar Hitam Aplikasi (Excluded from Recommendations)</span>
              </h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">
                Aplikasi di daftar ini tidak akan pernah dimunculkan di rak rekomendasi mana pun.
              </p>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedExcludeAppId}
                onChange={e => setSelectedExcludeAppId(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              >
                <option value="">Pilih aplikasi untuk diblacklist...</option>
                {apps.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.category}) - id: {a.id}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (!selectedExcludeAppId) return;
                  if (!config.excludedAppIds.includes(selectedExcludeAppId)) {
                    setConfig({
                      ...config,
                      excludedAppIds: [...config.excludedAppIds, selectedExcludeAppId]
                    });
                  }
                  setSelectedExcludeAppId('');
                }}
                disabled={!selectedExcludeAppId}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Tambah ke Blacklist
              </button>
            </div>

            {config.excludedAppIds.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl">
                Belum ada aplikasi yang diblacklist dari rekomendasi.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {config.excludedAppIds.map(appId => {
                  const foundApp = apps.find(a => a.id === appId);
                  return (
                    <span 
                      key={appId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold"
                    >
                      <span>{foundApp?.name || appId}</span>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            excludedAppIds: config.excludedAppIds.filter(id => id !== appId)
                          });
                        }}
                        className="hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pinned Recommendations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Pin className="h-4 w-4 text-blue-500" />
                <span>Sematkan Rekomendasi Unggulan (Pinned Apps)</span>
              </h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">
                Aplikasi yang disematkan akan selalu muncul di posisi teratas rak yang ditentukan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={pinShelfTarget}
                onChange={e => setPinShelfTarget(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              >
                <option value="forYou">Rak: Untuk Anda (forYou)</option>
                <option value="youMightLike">Rak: Mungkin Anda Suka (youMightLike)</option>
                <option value="newAndRising">Rak: Aplikasi Naik Daun (newAndRising)</option>
                <option value="trending">Rak: Sedang Tren (trending)</option>
                <option value="editorPicks">Rak: Pilihan Editor (editorPicks)</option>
              </select>

              <select
                value={pinAppTarget}
                onChange={e => setPinAppTarget(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              >
                <option value="">Pilih aplikasi untuk disematkan...</option>
                {apps.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (!pinAppTarget) return;
                  const currentPins = config.pinnedAppIds[pinShelfTarget] || [];
                  if (!currentPins.includes(pinAppTarget)) {
                    setConfig({
                      ...config,
                      pinnedAppIds: {
                        ...config.pinnedAppIds,
                        [pinShelfTarget]: [...currentPins, pinAppTarget]
                      }
                    });
                  }
                  setPinAppTarget('');
                }}
                disabled={!pinAppTarget}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Sematkan ke Rak
              </button>
            </div>

            {/* Render Pinned Items per shelf */}
            <div className="space-y-3 pt-2">
              {(Object.entries(config.pinnedAppIds || {}) as [string, string[]][]).map(([shelfKey, pIds]) => {
                if (!pIds || pIds.length === 0) return null;
                return (
                  <div key={shelfKey} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                      Rak: {shelfKey} ({pIds.length} Pinned)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {pIds.map(id => {
                        const app = apps.find(a => a.id === id);
                        return (
                          <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold">
                            <span>{app?.name || id}</span>
                            <button
                              onClick={() => {
                                setConfig({
                                  ...config,
                                  pinnedAppIds: {
                                    ...config.pinnedAppIds,
                                    [shelfKey]: pIds.filter(x => x !== id)
                                  }
                                });
                              }}
                              className="text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: LIVE SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span>Recommendation Live Inspector & Simulator</span>
                </h3>
                <p className="text-xs text-slate-450 font-semibold mt-0.5">
                  Uji output dan inspeksi transparansi perhitungan skor untuk aplikasi tertentu secara real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={simulatorAppId}
                  onChange={e => setSimulatorAppId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                >
                  {apps.map(a => (
                    <option key={a.id} value={a.id}>Simulasikan: {a.name} ({a.category})</option>
                  ))}
                </select>

                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {simulating ? 'Menghitung...' : 'Jalankan Simulasi'}
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-white/5 font-semibold">
                <thead>
                  <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Rank / Aplikasi</th>
                    <th className="pb-3 text-center">Final Score</th>
                    <th className="pb-3 text-center">Similarity</th>
                    <th className="pb-3 text-center">Interest</th>
                    <th className="pb-3 text-center">Popularity</th>
                    <th className="pb-3 text-center">Freshness</th>
                    <th className="pb-3 text-center">Quality</th>
                    <th className="pb-3">Confidence & Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {simulatedResults.map((item, idx) => (
                    <tr key={item.app.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {item.app.iconUrl && (
                            <img src={item.app.iconUrl} alt={item.app.name} className="w-7 h-7 rounded-lg object-cover" />
                          )}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{item.app.name}</span>
                            <span className="text-[10px] text-slate-400">{item.app.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center font-black text-sm text-blue-600 dark:text-blue-400">
                        {item.score.finalScore}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.score.similarityScore}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.score.interestScore}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.score.popularityScore}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.score.freshnessScore}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.score.qualityScore}
                      </td>
                      <td className="py-3">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            item.score.confidence === 'HIGH'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : item.score.confidence === 'MEDIUM'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}>
                            {item.score.confidence} CONFIDENCE
                          </span>
                          <p className="text-[10px] text-slate-500 font-bold">{item.score.primaryReason}</p>
                          {item.score.matchingFactors.length > 0 && (
                            <p className="text-[9px] text-slate-400">{item.score.matchingFactors.join(' • ')}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: ANALYTICS & CTR */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {/* Shelf CTR Performance Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span>Efektivitas Rak Rekomendasi (CTR Breakdown)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-white/5 font-semibold">
                <thead>
                  <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Rak Rekomendasi</th>
                    <th className="pb-3 text-center">Impresi</th>
                    <th className="pb-3 text-center">Klik</th>
                    <th className="pb-3 text-center">CTR (%)</th>
                    <th className="pb-3 text-center">Konversi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(analytics?.shelfMetrics || []).map(m => (
                    <tr key={m.shelfId} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 pl-2 font-bold text-slate-800 dark:text-slate-200">{m.shelfTitle}</td>
                      <td className="py-3 text-center font-bold text-slate-600 dark:text-slate-400">{m.impressions}</td>
                      <td className="py-3 text-center font-bold text-blue-600 dark:text-blue-400">{m.clicks}</td>
                      <td className="py-3 text-center font-black text-emerald-600 dark:text-emerald-400">{m.ctr}%</td>
                      <td className="py-3 text-center font-bold text-purple-600 dark:text-purple-400">{m.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivitySignalIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
