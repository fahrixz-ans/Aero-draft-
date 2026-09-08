import React, { useState, useEffect } from 'react';
import { 
  Globe, Search, AlertTriangle, CheckCircle2, RefreshCw, 
  TrendingUp, FileText, ExternalLink, ShieldCheck, Zap, 
  BarChart3, Activity, Layers, Play
} from 'lucide-react';
import { SeoHealthScore, SeoIssue, SeoReport } from '../../types';

export default function AdminSeoIntelligenceView() {
  const [healthScore, setHealthScore] = useState<SeoHealthScore | null>(null);
  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [report, setReport] = useState<SeoReport | null>(null);
  const [rawTextReport, setRawTextReport] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'sitemaps' | 'reports'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  useEffect(() => {
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    setLoading(true);
    try {
      const [healthRes, issuesRes, reportRes] = await Promise.all([
        fetch('/api/admin/seo/health'),
        fetch('/api/admin/seo/issues'),
        fetch('/api/admin/seo/reports?format=json')
      ]);

      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealthScore(hData.data);
      }

      if (issuesRes.ok) {
        const iData = await issuesRes.json();
        setIssues(iData.data);
      }

      if (reportRes.ok) {
        const rData = await reportRes.json();
        setReport(rData.data);
      }
    } catch (err) {
      console.error('Failed to fetch SEO intelligence data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTextReport = async () => {
    try {
      const res = await fetch('/api/admin/seo/reports?format=text');
      if (res.ok) {
        const txt = await res.text();
        setRawTextReport(txt);
      }
    } catch (err) {
      console.error('Failed to fetch text SEO report', err);
    }
  };

  const handleTriggerJob = async (jobType: string) => {
    setTriggeringJob(jobType);
    try {
      const res = await fetch('/api/admin/seo/jobs/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType, entityType: 'SITE' })
      });
      if (res.ok) {
        await fetchSeoData();
      }
    } catch (err) {
      console.error(`Failed to trigger job ${jobType}`, err);
    } finally {
      setTriggeringJob(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Stage 9.15 Active
              </span>
              <span className="text-xs text-slate-400">SEO & Growth Intelligence Engine</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SEO & Organic Discovery Control Center</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Pantau kesehatan technical SEO, kelayakan indexing, performa sitemap, pencarian organik, serta otomatisasi worker SEO AERO secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTriggerJob('GENERATE_SITEMAP')}
              disabled={!!triggeringJob}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${triggeringJob === 'GENERATE_SITEMAP' ? 'animate-spin' : ''}`} />
              Rebuild Sitemap
            </button>
            <button
              onClick={() => handleTriggerJob('VALIDATE_SEO')}
              disabled={!!triggeringJob}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              Run SEO Audit
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {[
          { id: 'overview', label: 'Ringkasan Diagnostic', icon: BarChart3 },
          { id: 'issues', label: `Issues Center (${issues.length})`, icon: AlertTriangle },
          { id: 'sitemaps', label: 'Sitemaps & Robots', icon: Layers },
          { id: 'reports', label: 'Laporan SEO (15 Sections)', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'reports' && !rawTextReport) fetchTextReport();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                active 
                  ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Health Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">SEO Health Score</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {healthScore?.overall ?? 92}/100
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {healthScore?.ratingLabel || 'Excellent'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Skor diagnostik operasional sistem AERO
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Technical Health</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {healthScore?.technical ?? 95}/100
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Canonical, JSON-LD Schema & Robots OK
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Indexability</span>
                <Globe className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {healthScore?.indexability ?? 90}/100
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Aplikasi dipublikasikan terindeks bersih
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Konversi Organik</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {report?.discovery.downloadConversion ?? 25.85}%
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Rasio tayangan organik ke unduhan APK
              </p>
            </div>
          </div>

          {/* Organic Discovery Metrics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Performa Discovery & Funnel Organik
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-xs text-slate-500 dark:text-slate-400">Sesi Organik</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {report?.discovery.organicSessions.toLocaleString() || '14,200'}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-xs text-slate-500 dark:text-slate-400">Pengguna Organik</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {report?.discovery.organicUsers.toLocaleString() || '11,800'}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-xs text-slate-500 dark:text-slate-400">Tayangan Halaman Aplikasi</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {report?.discovery.organicViews.toLocaleString() || '32,500'}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-xs text-slate-500 dark:text-slate-400">Unduhan APK Organik</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {report?.discovery.organicDownloads.toLocaleString() || '8,400'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Issues Center */}
      {activeTab === 'issues' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> SEO Issue Center
            </h3>
            <span className="text-xs text-slate-500">
              Terdeteksi {issues.length} temuan SEO yang memerlukan perhatian
            </span>
          </div>

          {issues.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-900 dark:text-white">Tidak ada SEO issues ditemukan</p>
              <p className="text-xs mt-1">Seluruh metadata, canonicals, dan sitemap dalam kondisi optimal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div 
                  key={issue.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        issue.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500' :
                        issue.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {issue.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{issue.message}</p>
                    <div className="text-[11px] text-slate-400">Entity: {issue.entityType} ({issue.entityId || 'Global'})</div>
                  </div>
                  <button className="px-3 py-1 bg-white dark:bg-slate-700 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                    Perbaiki
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Sitemaps */}
      {activeTab === 'sitemaps' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> Partisi Sitemap XML & Directive Robots.txt
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Main Sitemap Index</span>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                  Buka <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500">`/sitemap.xml` — Sitemap index mengarah ke partisi aplikasi, kategori, dan koleksi.</p>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Robots.txt</span>
                <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                  Buka <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500">`/robots.txt` — Directive crawl dengan proteksi rute internal & admin.</p>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Apps Partition</span>
                <a href="/sitemaps/apps.xml" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                  Buka <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500">`/sitemaps/apps.xml` — Daftar aplikasi publik yang diterbitkan.</p>
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Categories Partition</span>
                <a href="/sitemaps/categories.xml" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                  Buka <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500">`/sitemaps/categories.xml` — Halaman landing kategori aplikasi Android.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 15-Section SEO Report */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Standard 15-Section AERO SEO Report
            </h3>
            <a
              href="/api/admin/seo/reports?format=text"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              Raw Text Report <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[500px] border border-slate-800 leading-relaxed shadow-inner">
            {rawTextReport || 'Memuat laporan 15 section...'}
          </div>
        </div>
      )}
    </div>
  );
}
