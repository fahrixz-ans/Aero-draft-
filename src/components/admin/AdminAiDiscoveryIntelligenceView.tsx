import React, { useState, useEffect } from 'react';
import { 
  Brain, Cpu, ShieldAlert, CheckCircle2, RefreshCw, 
  BarChart3, Activity, Layers, Play, Settings, 
  Compass, Sliders, Server, DollarSign, Lightbulb, 
  TrendingUp, AlertTriangle, Terminal, Sparkles
} from 'lucide-react';
import { AiFeatureFlagConfig, AIDiscoveryReport } from '../../types';

export default function AdminAiDiscoveryIntelligenceView() {
  const [report, setReport] = useState<AIDiscoveryReport | null>(null);
  const [flags, setFlags] = useState<AiFeatureFlagConfig | null>(null);
  const [rawTextReport, setRawTextReport] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'intent' | 'opportunities' | 'reports'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAiData();
  }, []);

  const fetchAiData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, reportRes] = await Promise.all([
        fetch('/api/admin/ai/health'),
        fetch('/api/admin/ai/reports?format=json')
      ]);

      if (healthRes.ok) {
        const hData = await healthRes.json();
        setFlags(hData.data.flags);
      } else {
        throw new Error('Gagal memuat status kesehatan AI & feature flags');
      }

      if (reportRes.ok) {
        const rData = await reportRes.json();
        setReport(rData.data);
      } else {
        throw new Error('Gagal memuat laporan analitik AI Discovery');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data AI Discovery Intelligence');
    } finally {
      setLoading(false);
    }
  };

  const fetchTextReport = async () => {
    try {
      const res = await fetch('/api/admin/ai/reports?format=text');
      if (res.ok) {
        const txt = await res.text();
        setRawTextReport(txt);
      }
    } catch (err) {
      console.error('Failed to fetch text AI report', err);
    }
  };

  const handleToggleFlag = async (flagName: keyof AiFeatureFlagConfig) => {
    if (!flags) return;
    const updatedFlags = { ...flags, [flagName]: !flags[flagName] };
    
    // Optimistic update
    setFlags(updatedFlags);

    try {
      const res = await fetch('/api/admin/ai/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFlags)
      });
      if (!res.ok) {
        throw new Error('Gagal menyimpan konfigurasi feature flag');
      }
    } catch (err: any) {
      console.error(err);
      // Revert on error
      setFlags(flags);
      alert(err.message || 'Gagal mengubah status fitur');
    }
  };

  const handleTriggerJob = async (jobType: string) => {
    setTriggeringJob(jobType);
    try {
      const res = await fetch('/api/admin/ai/jobs/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType })
      });
      if (res.ok) {
        alert(`AI Worker Job ${jobType} berhasil dijalankan dalam antrean.`);
        await fetchAiData();
      } else {
        const errData = await res.json();
        alert(`Gagal menjalankan job: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`Failed to trigger job ${jobType}`, err);
    } finally {
      setTriggeringJob(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Memuat kecerdasan buatan AI Discovery Intelligence Mod Station...</p>
      </div>
    );
  }

  if (error || !report || !flags) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-bold">Terjadi Gangguan</h2>
        </div>
        <p className="text-sm">{error || 'Gagal memuat status sistem AI Discovery.'}</p>
        <button 
          onClick={fetchAiData}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 animate-pulse" /> Stage 9.16 Active
              </span>
              <span className="text-xs text-slate-400">Advanced AI Discovery Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI Discovery & Search Intelligence Control Center</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Uji klasifikasi niat (intent) pencarian, simulasikan relevansi semantik, atur bobot personalisasi, kelola feature flags, serta otomatisasi AI worker jobs secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAiData}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-right">
              <div className="text-xs text-emerald-400 font-semibold uppercase">AI Status</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online & Secure
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" /> Overview & Health
        </button>
        <button
          onClick={() => setActiveTab('intent')}
          className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'intent'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" /> Search Intent Classifier
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'opportunities'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lightbulb className="w-4 h-4" /> Action Center & Opportunities
        </button>
        <button
          onClick={() => {
            setActiveTab('reports');
            fetchTextReport();
          }}
          className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" /> AI Diagnostics Report
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stats Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-semibold">AI Overall</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-2">{report.health.overall}%</span>
                <span className="text-xs text-emerald-600 font-medium mt-1">Excellent</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-semibold">Search Intent</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-2">{report.health.search}%</span>
                <span className="text-xs text-emerald-600 font-medium mt-1">Accurate</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-semibold">Recommender</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-2">{report.health.recommendation}%</span>
                <span className="text-xs text-emerald-600 font-medium mt-1">Healthy</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-semibold">Semantic</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-2">{report.health.semantic}%</span>
                <span className="text-xs text-emerald-600 font-medium mt-1">Optimal</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                <span className="text-xs text-slate-500 uppercase font-semibold">Personalized</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-2">{report.health.personalization}%</span>
                <span className="text-xs text-emerald-600 font-medium mt-1">Targeted</span>
              </div>
            </div>

            {/* Performance Metrics Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" /> Real-time Performance Budget & Telemetry
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Search p95 Latency</div>
                  <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-1">
                    {report.performance.p95Ms} ms
                    <span className="text-xs text-emerald-600 font-medium">≤ 500 ms target</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-semibold uppercase">API Error Rate</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {report.performance.errorRate}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Cache Hit Rate</div>
                  <div className="text-2xl font-bold text-slate-900 text-indigo-600">
                    {report.ai.cacheHitRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* AI Call Stats & Cost Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> AI Provider API Analytics & Cost Efficiency
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Total Requests</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{report.ai.requests}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Success Count</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{report.ai.success}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Avg Latency</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{report.ai.averageLatencyMs} ms</div>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <div className="text-xs text-indigo-700 uppercase font-semibold">Model Version</div>
                  <div className="text-sm font-bold text-indigo-950 mt-1">{report.modelVersion}</div>
                </div>
              </div>
            </div>

            {/* Queue & Worker Monitoring */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" /> Centralized Queue & Asynchronous AI Workers
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                  <div className="text-xs text-slate-500">Queued</div>
                  <div className="text-lg font-bold mt-1 text-slate-700">{report.worker.queued}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center border border-amber-100">
                  <div className="text-xs text-amber-700">Processing</div>
                  <div className="text-lg font-bold mt-1 text-amber-800">{report.worker.processing}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg text-center border border-emerald-100">
                  <div className="text-xs text-emerald-700">Completed</div>
                  <div className="text-lg font-bold mt-1 text-emerald-800">{report.worker.completed}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center border border-red-100">
                  <div className="text-xs text-red-700">Failed</div>
                  <div className="text-lg font-bold mt-1 text-red-800">{report.worker.failed}</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-lg text-center border border-rose-100">
                  <div className="text-xs text-rose-700">DLQ (Dead Letter)</div>
                  <div className="text-lg font-bold mt-1 text-rose-800">{report.worker.deadLetter}</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Feature Flags Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" /> AI Engine Feature Flags
              </h3>
              <p className="text-xs text-slate-500">
                Atur fungsionalitas AI Discovery secara parsial atau gunakan tombol darurat (Emergency Kill Switch).
              </p>

              <div className="space-y-3 pt-2">
                {Object.keys(flags).map((flagName) => {
                  const val = flags[flagName as keyof AiFeatureFlagConfig];
                  return (
                    <div key={flagName} className="flex items-center justify-between py-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{flagName}</span>
                        <span className="text-[10px] text-slate-400">Status saat ini</span>
                      </div>
                      <button
                        onClick={() => handleToggleFlag(flagName as keyof AiFeatureFlagConfig)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                          val ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            val ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Emergency Kill Switch */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold text-red-950">Emergency Kill Switch</span>
                </div>
                <p className="text-[10px] text-red-800 leading-relaxed">
                  Jika terjadi overload kuota Gemini API, kegagalan jaringan atau latency ekstrem, Anda dapat mematikan seluruh engine AI. Sistem otomatis melakukan fallback deterministic secara utuh.
                </p>
                <button
                  onClick={async () => {
                    const confirmStop = window.confirm('Apakah Anda yakin ingin mematikan semua fitur AI Discovery?');
                    if (confirmStop) {
                      const disabledFlags: Partial<AiFeatureFlagConfig> = {
                        AI_DISCOVERY_ENABLED: false,
                        AI_SEARCH_INTENT_ENABLED: false,
                        AI_QUERY_EXPANSION_ENABLED: false,
                        AI_SEMANTIC_MATCHING_ENABLED: false,
                        AI_PERSONALIZATION_ENABLED: false,
                        AI_RECOMMENDATION_ENABLED: false,
                        AI_EXPERIMENTS_ENABLED: false,
                        AI_AUTO_OPTIMIZATION_ENABLED: false
                      };
                      setFlags(disabledFlags as AiFeatureFlagConfig);
                      await fetch('/api/admin/ai/flags', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(disabledFlags)
                      });
                      alert('Semua fitur AI Discovery berhasil dinonaktifkan. Fallback aktif.');
                    }
                  }}
                  className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition"
                >
                  DEACTIVATE AI DISCOVERY ENGINE
                </button>
              </div>
            </div>

            {/* Run Worker Trigger Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-600" /> Manual Worker Actions
              </h3>
              <p className="text-xs text-slate-500">
                Luncurkan background worker job khusus untuk membersihkan index, menyusun laporan, atau melatih ulang model semantic secara manual.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  disabled={triggeringJob !== null}
                  onClick={() => handleTriggerJob('REBUILD_SEMANTIC_INDEX')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Rebuild Semantic Index
                </button>
                <button
                  disabled={triggeringJob !== null}
                  onClick={() => handleTriggerJob('GENERATE_AI_REPORT')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> Generate AI Report
                </button>
                <button
                  disabled={triggeringJob !== null}
                  onClick={() => handleTriggerJob('DETECT_DISCOVERY_OPPORTUNITY')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Detect Opportunities
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INTENT CLASSIFIER SIMULATOR */}
      {activeTab === 'intent' && (
        <IntentSimulator />
      )}

      {/* TAB CONTENT: ACTION CENTER */}
      {activeTab === 'opportunities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* AI Opportunities List */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-600" /> Real-time Discovery Opportunity Detection
              </h3>
              <p className="text-xs text-slate-500">
                Pola pencarian dengan zero-results atau konversi rendah diidentifikasi secara dinamis oleh AI untuk menyarankan kurasi sitemap / koleksi baru.
              </p>

              <div className="space-y-3 pt-2">
                {report.opportunities.map((opp, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-800">{opp}</p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Discovery Signal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Actionable Recommendations */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" /> AI Recommended Actions & Strategies
              </h3>
              <div className="space-y-3 pt-2">
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-indigo-950">{rec}</p>
                      <span className="text-[10px] text-indigo-500 uppercase font-semibold">Priority Action</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Simulation & Manual Search Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-indigo-600" /> AI Action Center
            </h3>
            <p className="text-xs text-slate-500">
              Uji anomali pencarian atau ketidakcocokan relevansi secara manual. Tindakan administratif di sini langsung meneruskan payload ke antrean audit worker.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-bold text-amber-950">High Zero-Result Query Detected</span>
              </div>
              <p className="text-[10px] text-amber-800 leading-relaxed">
                Query pencarian "edit reels" melonjak tetapi tidak memiliki kecocokan judul yang pas. AI mendeteksi ini sebagai Use Case Opportunity.
              </p>
              <button 
                onClick={() => handleTriggerJob('DETECT_DISCOVERY_OPPORTUNITY')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold rounded transition"
              >
                Trigger Opportunity Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RAW REPORT */}
      {activeTab === 'reports' && (
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Raw Text Diagnostics System Output</h3>
            </div>
            <button 
              onClick={fetchTextReport}
              className="text-xs px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:text-white hover:bg-slate-700 transition"
            >
              Refresh Report Text
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Format laporan di bawah ini dibuat otomatis untuk memenuhi kontrak audit Stage 9.16. Gunakan tombol unduh/salin untuk audit kepatuhan platform Mod Station.
          </p>

          <pre className="text-xs text-slate-300 font-mono p-4 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto max-h-[500px] leading-relaxed">
            {rawTextReport || 'Memuat raw report text...'}
          </pre>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// CHILD COMPONENT: SEARCH INTENT & SEMANTIC SIMULATOR
// -----------------------------------------------------------------------------
function IntentSimulator() {
  const [query, setQuery] = useState<string>('video editor');
  const [loading, setLoading] = useState<boolean>(false);
  const [intentResult, setIntentResult] = useState<any>(null);
  const [recommendationResult, setRecommendationResult] = useState<any>(null);

  const handleSimulate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const [intentRes, recsRes] = await Promise.all([
        fetch(`/api/discovery/intent?q=${encodeURIComponent(query)}`),
        fetch('/api/discovery/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 5 })
        })
      ]);

      if (intentRes.ok) {
        const iData = await intentRes.json();
        setIntentResult(iData.data);
      }

      if (recsRes.ok) {
        const rData = await recsRes.json();
        setRecommendationResult(rData.data);
      }
    } catch (err) {
      console.error('Failed to simulate search intent', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSimulate();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simulation Console */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" /> Simulation Console
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Uji masukan kata kunci pencarian real-time di bawah ini untuk mengukur sensitivitas klasifikasi niat (Intent Classifier) dan pemicu semantic weighting.
        </p>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-slate-700">Simulator Search Term</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: apps like whatsapp, best tools, video editor..."
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
            >
              Uji
            </button>
          </div>
        </div>

        {/* Dynamic Tips based on query */}
        <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-indigo-950">
          <div className="text-xs font-bold flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Simulation Tips
          </div>
          <p className="text-[10px] leading-relaxed">
            Coba masukkan salah satu kata kunci penentu intent:
          </p>
          <ul className="text-[10px] list-disc list-inside space-y-1 font-medium">
            <li><span className="font-bold">SIMILAR_APP</span>: "apps like capcut"</li>
            <li><span className="font-bold">RECOMMENDATION</span>: "best communication"</li>
            <li><span className="font-bold">VERSION_DISCOVERY</span>: "whatsapp latest"</li>
            <li><span className="font-bold">APP_LOOKUP</span>: "canva"</li>
          </ul>
        </div>
      </div>

      {/* Simulator Results Dashboard */}
      <div className="lg:col-span-2 space-y-6">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500">Menganalisis pencarian menggunakan AI Discovery Layer...</p>
          </div>
        ) : (
          <>
            {/* Intent Classifier Output */}
            {intentResult && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" /> Search Intent Analysis Output
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Classified Intent Type</div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-600 shrink-0" /> {intentResult.type}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Confidence Score</div>
                    <div className="text-sm font-bold text-slate-800">
                      {(intentResult.confidence * 100).toFixed(0)}% 
                      <span className="text-[10px] font-semibold text-indigo-600 ml-1.5 uppercase">
                        {intentResult.confidence >= 0.85 ? 'HIGH' : intentResult.confidence >= 0.65 ? 'MEDIUM' : 'LOW'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Semantic Recommendation Candidates Output */}
            {recommendationResult && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" /> Semantic Recommendation Candidates
                  </h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    recommendationResult.fallbackUsed 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {recommendationResult.fallbackUsed ? 'Fallback Algorithm Active' : 'AI Discovery Layer Optimal'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {recommendationResult.apps && recommendationResult.apps.length > 0 ? (
                    recommendationResult.apps.map((app: any, idx: number) => {
                      const exps = recommendationResult.explanations[app.id] || [];
                      return (
                        <div key={app.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {app.icon && (
                                <img 
                                  src={app.icon} 
                                  alt={app.name} 
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0" 
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{app.name}</h4>
                                <span className="text-[10px] text-slate-400 font-medium">Developer: {app.developer}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                              Match #{idx + 1}
                            </span>
                          </div>

                          {/* Explainability reasons */}
                          {exps.length > 0 && (
                            <div className="pl-1 flex flex-wrap gap-1.5 pt-1">
                              {exps.map((exp: string, eIdx: number) => (
                                <span key={eIdx} className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-slate-400"></span> {exp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 font-medium">Tidak ada kandidat aplikasi yang cocok dengan relevansi semantik.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
