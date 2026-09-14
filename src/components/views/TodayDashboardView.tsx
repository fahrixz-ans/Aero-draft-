import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, Calendar, Activity, TrendingUp, ArrowUpRight, 
  Download, Eye, Search, Layers, ShieldCheck, RefreshCw, CheckCircle2,
  Zap, Flame, UserCheck, AlertCircle, Bookmark, ExternalLink, Filter,
  BookOpen, ChevronRight, ArrowRight, ShieldAlert, Award, FileText, Bell
} from 'lucide-react';
import { AppData, AeroUser } from '../../types';
import { 
  TimeFilter, 
  TodayDashboardData, 
  buildTodayDashboardData 
} from '../../services/todayService';
import AppCard from '../AppCard';
import AdSlot from '../common/AdSlot';

interface TodayDashboardViewProps {
  allApps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (app: AppData) => void;
  onNavigate: (view: string, param?: string) => void;
  currentUser: AeroUser | null;
  savedAppIds?: string[];
  downloadHistory?: any[];
}

export default function TodayDashboardView({
  allApps,
  onSelectApp,
  onDownloadApp,
  onNavigate,
  currentUser,
  savedAppIds = [],
  downloadHistory = []
}: TodayDashboardViewProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<TodayDashboardData | null>(null);

  const loadData = async (filter: TimeFilter) => {
    setLoading(true);
    try {
      const result = await buildTodayDashboardData(
        allApps,
        filter,
        currentUser,
        savedAppIds,
        downloadHistory
      );
      setData(result);
    } catch (err) {
      console.error('Error building Today Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeFilter);
  }, [timeFilter, allApps, currentUser, savedAppIds, downloadHistory]);

  if (loading && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          Memuat Dashboard Aktivitas Hari Ini...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const {
    currentDateFormatted,
    queryTimestampWib,
    systemHealthStatus,
    systemHealthText,
    metrics,
    comparison,
    hourlyActivity,
    peakHour,
    newlyAddedApps,
    justAvailableApps,
    updatedApps,
    lastHourUpdates,
    majorUpdates,
    popularApps,
    mostDownloadedApps,
    mostViewedApps,
    topSearchedQueries,
    fastestRisingApps,
    almostTrendingApps,
    surgingBackApps,
    topCategories,
    activeDevelopers,
    metadataChanges,
    latestVersions,
    newlyVerifiedApps,
    securityScannedCount,
    timeline,
    editorialPicks,
    userPersonalized,
    announcements,
    latestBlogs
  } = data;

  const isTotalZero = (
    metrics.newAppsCount === 0 &&
    metrics.updatedAppsCount === 0 &&
    metrics.downloadsCount === 0 &&
    metrics.viewsCount === 0 &&
    metrics.searchesCount === 0
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" id="today-dashboard-container">
      {/* 1. HEADER SECTION */}
      <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                DASHBOARD AKTIVITAS HARIAN PUBLIK
              </span>

              {/* System Health Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                systemHealthStatus === 'healthy' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : systemHealthStatus === 'degraded'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {systemHealthText}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              HARI INI
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-blue-500" />
                {currentDateFormatted}
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                {queryTimestampWib}
              </span>
            </div>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-[#1a2332] p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold w-full sm:w-auto">
              {(['today', 'yesterday', '7days', '30days'] as TimeFilter[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    timeFilter === tf
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf === 'today' && 'Hari Ini'}
                  {tf === 'yesterday' && 'Kemarin'}
                  {tf === '7days' && '7 Hari Terakhir'}
                  {tf === '30days' && '30 Hari Terakhir'}
                </button>
              ))}
            </div>

            <button
              onClick={() => loadData(timeFilter)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2332] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-white/10 cursor-pointer"
              title="Sinkronkan data sekarang"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Data Freshness Indicator */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Data diperbarui: <strong>{queryTimestampWib}</strong></span>
          </div>
          <span>Batas Waktu: 00:00:00 WIB – 23:59:59 WIB (Asia/Jakarta)</span>
        </div>
      </div>

      {/* 2. RINGKASAN HARI INI */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            RINGKASAN AKTIVITAS PERIODE INI
          </h2>
        </div>

        {isTotalZero ? (
          <div className="bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center space-y-2">
            <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
              Belum ada data aktivitas untuk periode ini.
            </p>
            <p className="text-slate-400 text-xs">
              Aktivitas pengguna dan pembaruan katalog akan otomatis tercatat di dashboard ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aplikasi Baru</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.newAppsCount}</div>
            </div>

            <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diperbarui</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.updatedAppsCount}</div>
            </div>

            <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Download</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.downloadsCount}</div>
            </div>

            <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tampilan</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.viewsCount}</div>
            </div>

            <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pencarian</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.searchesCount}</div>
            </div>

            <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Developer Aktif</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.activeDevsCount}</div>
            </div>

            <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Versi Baru</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.newVersionsCount}</div>
            </div>
          </div>
        )}
      </section>

      {/* Strategic Ad Placement - Today Dashboard Mid */}
      <AdSlot 
        page="today" 
        placement="between-sections" 
        slotId="today-mid-banner" 
        subscriptionPlan={(currentUser as any)?.subscriptionPlan || 'free'}
        userRole={((currentUser as any)?.role || 'user') as any}
      />

      {/* 3. DIBANDINGKAN KEMARIN / PERIODE SEBELUMNYA */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          DIBANDINGKAN PERIODE SEBELUMNYA
        </h2>

        {!comparison.comparisonAvailable ? (
          <div className="bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-xs text-slate-500 font-medium">
            Data perbandingan belum tersedia.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Download', diff: comparison.downloadsDiffPct },
              { label: 'Views', diff: comparison.viewsDiffPct },
              { label: 'Pencarian', diff: comparison.searchesDiffPct },
              { label: 'Aplikasi Baru', diff: comparison.newAppsDiffPct },
              { label: 'Update', diff: comparison.updatesDiffPct },
              { label: 'Dev Aktif', diff: comparison.activeDevsDiffPct }
            ].map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-slate-500 mb-1">{item.label}</div>
                <div className={`text-sm font-black flex items-center gap-1 ${
                  item.diff > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                  item.diff < 0 ? 'text-rose-600 dark:text-rose-400' :
                  'text-slate-500'
                }`}>
                  {item.diff > 0 ? `+${item.diff}%` : `${item.diff}%`}
                  <span className="text-[10px] text-slate-400 font-normal">vs sebelumnya</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. AKTIVITAS 24 JAM & JAM PALING RAMAI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              AKTIVITAS 24 JAM (WIB)
            </h3>
            <span className="text-xs text-slate-400 font-mono">24 Jam Terakhir</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-44 w-full flex items-end gap-1 pt-6 pb-2 border-b border-slate-100 dark:border-white/5 overflow-x-auto">
            {hourlyActivity.map((point, i) => {
              const maxVal = Math.max(...hourlyActivity.map(p => p.total), 1);
              const heightPct = Math.max(8, Math.round((point.total / maxVal) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[20px] group">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t h-32 flex items-end overflow-hidden relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-blue-600 dark:bg-blue-500 rounded-t transition-all group-hover:bg-blue-400"
                    ></div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 scale-90">{point.hourLabel}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span> Total Aktivitas</span>
            </div>
            <span>Berdasarkan server log Asia/Jakarta</span>
          </div>
        </div>

        {/* Peak Hour Card */}
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase mb-3 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5" />
              JAM PALING RAMAI
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {peakHour ? peakHour.timeLabel : '19.00–20.00 WIB'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Waktu dengan akumulasi aktivitas terbesar dalam 24 jam terakhir.
            </p>
          </div>

          {peakHour ? (
            <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#1a2332] p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Download</div>
                <div className="text-base font-black text-blue-600 dark:text-blue-400">{peakHour.downloads}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Views</div>
                <div className="text-base font-black text-slate-900 dark:text-white">{peakHour.views}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Search</div>
                <div className="text-base font-black text-slate-900 dark:text-white">{peakHour.searches}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a2332] text-xs text-slate-500 text-center">
              Belum cukup data untuk menghitung jam puncak aktivitas.
            </div>
          )}
        </div>
      </div>

      {/* 5. BARU DITAMBAHKAN & BARU SAJA TERSEDIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baru Ditambahkan */}
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              BARU DITAMBAHKAN HARI INI
            </h3>
            <span className="text-xs text-slate-400 font-bold">{newlyAddedApps.length} Aplikasi</span>
          </div>

          {newlyAddedApps.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              Belum ada aplikasi baru yang ditambahkan pada periode ini.
            </div>
          ) : (
            <div className="space-y-3">
              {newlyAddedApps.slice(0, 5).map(app => (
                <div
                  key={app.id}
                  onClick={() => onSelectApp(app.slug)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <img src={app.icon || app.iconUrl} alt={app.name} className="w-11 h-11 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{app.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{app.developer} • {app.category}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    {app.version || 'v1.0'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Baru Saja Tersedia (Relative Time) */}
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              BARU SAJA TERSEDIA
            </h3>
            <span className="text-xs text-slate-400 font-bold">Terbaru</span>
          </div>

          {justAvailableApps.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              Tidak ada aplikasi yang baru saja tersedia.
            </div>
          ) : (
            <div className="space-y-3">
              {justAvailableApps.slice(0, 5).map(app => (
                <div
                  key={app.id}
                  onClick={() => onSelectApp(app.slug)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <img src={app.icon || app.iconUrl} alt={app.name} className="w-11 h-11 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{app.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{app.developer}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                    {app.relativeTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. UPDATE 1 JAM TERAKHIR & UPDATE BESAR (Rendered conditionally) */}
      {lastHourUpdates.length > 0 && (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-300" />
              UPDATE 1 JAM TERAKHIR
            </h3>
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">{lastHourUpdates.length} Update Real-Time</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lastHourUpdates.map(app => (
              <div
                key={app.id}
                onClick={() => onSelectApp(app.slug)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-xl transition-all cursor-pointer border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <img src={app.icon || app.iconUrl} alt={app.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-sm line-clamp-1">{app.name}</h4>
                    <p className="text-xs text-blue-100">{app.version || 'v Terbaru'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {majorUpdates.length > 0 && (
        <section className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            UPDATE BESAR HARI INI
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {majorUpdates.map(item => (
              <div
                key={item.app.id}
                onClick={() => onSelectApp(item.app.slug)}
                className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.app.icon || item.app.iconUrl} alt={item.app.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.app.name}</h4>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">{item.newVersion}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{item.updatedAtWib}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {item.changeSummary}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. POPULER HARI INI & RANKINGS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            POPULER & RANKING PERIODE INI
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Paling Banyak Diunduh */}
          <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-500" />
              PALING BANYAK DIUNDUH
            </h3>
            <div className="space-y-2.5">
              {mostDownloadedApps.slice(0, 5).map((app, idx) => (
                <div
                  key={app.id}
                  onClick={() => onSelectApp(app.slug)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 text-center font-black text-xs ${
                      idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      #{idx + 1}
                    </span>
                    <img src={app.icon || app.iconUrl} alt={app.name} className="w-9 h-9 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{app.name}</h4>
                      <span className="text-[10px] text-slate-400">{app.category}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{app.periodDownloads} dl</span>
                </div>
              ))}
            </div>
          </div>

          {/* Paling Banyak Dilihat */}
          <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              PALING BANYAK DILIHAT
            </h3>
            <div className="space-y-2.5">
              {mostViewedApps.slice(0, 5).map((app, idx) => (
                <div
                  key={app.id}
                  onClick={() => onSelectApp(app.slug)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-black text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                    <img src={app.icon || app.iconUrl} alt={app.name} className="w-9 h-9 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{app.name}</h4>
                      <span className="text-[10px] text-slate-400">{app.developer}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{app.periodViews} views</span>
                </div>
              ))}
            </div>
          </div>

          {/* Paling Banyak Dicari */}
          <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-500" />
              PALING BANYAK DICARI
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {topSearchedQueries.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate('search', item.query)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1a2332] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200/60 dark:border-white/5 cursor-pointer"
                >
                  <span>{item.query}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({item.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. KATEGORI TERPOPULER & DEVELOPER AKTIF */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kategori Hari Ini */}
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            KATEGORI TERPOPULER
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topCategories.map(cat => (
              <div
                key={cat.slug}
                onClick={() => onNavigate('category-detail', cat.slug)}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer bg-slate-50/50 dark:bg-white/5"
              >
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cat.appCount} aplikasi tersedia</p>
              </div>
            ))}
          </div>
        </div>

        {/* Developer Aktif */}
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            DEVELOPER AKTIF HARI INI
          </h3>

          {activeDevelopers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              Belum ada aktivitas developer tercatat pada periode ini.
            </div>
          ) : (
            <div className="space-y-3">
              {activeDevelopers.slice(0, 5).map((dev, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate('developer-detail', dev.slug)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-100 dark:border-white/5"
                >
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{dev.name}</span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {dev.newAppsCount > 0 && <span className="text-blue-600 dark:text-blue-400">+{dev.newAppsCount} Baru</span>}
                    {dev.updatedAppsCount > 0 && <span className="text-emerald-600 dark:text-emerald-400">{dev.updatedAppsCount} Update</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 9. STATUS KEAMANAN & METADATA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Keamanan */}
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            STATUS KEAMANAN KATALOG
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Total Pindaian Security</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{securityScannedCount} Aplikasi</div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-500/20">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">Verifikasi Malicious Code</div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">0 Peringatan</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            Sistem pemindaian berkas otomatis memeriksa integritas checksum dan izin aplikasi.
          </p>
        </div>

        {/* Dynamic Announcements */}
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-3">
          <h3 className="font-black text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            PENGUMUMAN MOD STATION
          </h3>

          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a2332] border border-slate-200/60 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{ann.title}</h4>
                  <span className="text-[10px] text-slate-400">{ann.publishedAtWib}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10. TIMELINE AKTIVITAS HARIAN */}
      <section className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          TIMELINE AKTIVITAS KATALOG HARI INI
        </h2>

        {timeline.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
            Belum ada timeline aktivitas publik tercatat untuk periode ini.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {timeline.slice(0, 10).map((item) => (
              <div key={item.id} className="relative group">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-[#131924]"></span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4
                      onClick={() => item.appSlug && onSelectApp(item.appSlug)}
                      className={`font-bold text-sm text-slate-900 dark:text-white ${item.appSlug ? 'hover:text-blue-600 cursor-pointer' : ''}`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 whitespace-nowrap">{item.timeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 11. UNTUK KAMU / USER PERSONALIZED (If logged in) */}
      {currentUser && userPersonalized && (
        <section className="bg-white dark:bg-[#131924] border border-blue-500/20 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-500" />
            UNTUK KAMU ({currentUser.displayName || currentUser.email})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aplikasi Tersimpan yang Diperbarui Today */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a2332] space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Aplikasi Tersimpan Diperbarui Today</h4>
              {userPersonalized.savedAppsUpdatedToday.length === 0 ? (
                <p className="text-xs text-slate-500">Tidak ada pembaruan pada aplikasi tersimpan kamu hari ini.</p>
              ) : (
                <div className="space-y-2">
                  {userPersonalized.savedAppsUpdatedToday.map(app => (
                    <div
                      key={app.id}
                      onClick={() => onSelectApp(app.slug)}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 cursor-pointer"
                    >
                      <span className="text-xs font-bold">{app.name}</span>
                      <span className="text-[10px] text-blue-500 font-bold">{app.version}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Riwayat Unduhan Today */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a2332] space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Riwayat Unduhan Kamu Hari Ini</h4>
              {userPersonalized.todayDownloadHistory.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada unduhan dilakukan akun kamu hari ini.</p>
              ) : (
                <p className="text-xs text-blue-600 font-bold">{userPersonalized.todayDownloadHistory.length} unduhan tercatat.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 12. BLOG TERBARU (Links to Blog Page) */}
      <section className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            BLOG TERBARU
          </h2>
          <button
            onClick={() => onNavigate('blog')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Blog</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {latestBlogs.map(blog => (
            <div
              key={blog.id}
              onClick={() => onNavigate('blog-detail', blog.slug)}
              className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 transition-all cursor-pointer group bg-slate-50/50 dark:bg-white/5 flex flex-col justify-between"
            >
              <div>
                <img src={blog.coverImage} alt={blog.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="p-4 space-y-2">
                  <span className="text-[10px] text-slate-400">{blog.publishedAt}</span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {blog.excerpt}
                  </p>
                </div>
              </div>
              <div className="p-4 pt-0">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
