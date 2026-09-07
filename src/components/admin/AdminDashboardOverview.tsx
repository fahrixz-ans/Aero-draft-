import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Download, ShieldAlert, Users, Activity, 
  Plus, ShieldCheck, ArrowUpRight, Clock, RefreshCw, 
  CheckCircle2, AlertTriangle, Layers, Database, ArrowRight, 
  Eye, TrendingUp, HardDrive, Cpu, Star, ExternalLink, Filter
} from 'lucide-react';
import { AppData, AppReport, AdminAuditLog } from '../../types';
import { db } from '../../lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, limit as firestoreLimit, getDocs 
} from 'firebase/firestore';
import { subscribeAdminAuditLogs } from '../../services/admin/auditLogService';
import StatusBadge from './common/StatusBadge';

interface AdminDashboardOverviewProps {
  onNavigateTab: (tab: string, slugOrId?: string) => void;
  onOpenNewAppForm: () => void;
  onNavigateToApp?: (slug: string) => void;
}

export default function AdminDashboardOverview({
  onNavigateTab,
  onOpenNewAppForm,
  onNavigateToApp
}: AdminDashboardOverviewProps) {
  // Live State from Firestore
  const [apps, setApps] = useState<AppData[]>([]);
  const [reports, setReports] = useState<AppReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Interactive state
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'24H' | '7D' | '30D' | '90D' | '1Y'>('30D');
  const [topAppsSort, setTopAppsSort] = useState<'downloads' | 'views' | 'rating'>('downloads');
  const [queueTab, setQueueTab] = useState<'all' | 'submission' | 'version' | 'reports' | 'reviews'>('all');

  useEffect(() => {
    // 1. Live listener for applications collection
    const unsubApps = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const appList: AppData[] = [];
      snapshot.forEach((doc) => {
        appList.push({ id: doc.id, ...doc.data() } as AppData);
      });
      setApps(appList);
      setLastSyncTime(new Date());
    }, (err) => {
      console.warn('Apps live snapshot listener error:', err);
    });

    // 2. Live listener for reports collection
    const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const reportList: AppReport[] = [];
      snapshot.forEach((doc) => {
        reportList.push({ id: doc.id, ...doc.data() } as AppReport);
      });
      setReports(reportList);
    }, (err) => {
      console.warn('Reports snapshot error:', err);
    });

    // 3. Live listener for admin audit logs
    const unsubLogs = subscribeAdminAuditLogs((logs) => {
      setAuditLogs(logs.slice(0, 8));
      setLoading(false);
    }, 10);

    // 4. Fetch subscribers / active users count
    getDocs(collection(db, 'subscribers')).then((snap) => {
      setActiveUsersCount(snap.size);
    }).catch(() => {});

    return () => {
      unsubApps();
      unsubReports();
      unsubLogs();
    };
  }, []);

  // Real KPI calculations
  const totalApps = apps.length;
  const totalDownloads = apps.reduce((sum, a) => sum + (Number(a.downloads) || 0), 0);
  const pendingReviews = reports.filter(r => r.status === 'open' || r.status === 'investigating' || !r.status).length;
  const securityAlerts = reports.filter(r => (r.status === 'open' || !r.status) && (r.priority === 'critical' || r.priority === 'high')).length;

  // System Health state calculation
  const systemHealth = securityAlerts > 0 ? 'Warning' : 'Healthy';

  // Sorted top apps
  const sortedTopApps = [...apps].sort((a, b) => {
    if (topAppsSort === 'views') return (b.views || 0) - (a.views || 0);
    if (topAppsSort === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (b.downloads || 0) - (a.downloads || 0);
  }).slice(0, 5);

  // Filtered queue items
  const filteredReports = queueTab === 'all' 
    ? reports 
    : queueTab === 'reports'
    ? reports.filter(r => r.reason !== 'App Submission')
    : reports.filter(r => r.status === 'open');

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* SECTION 9: DASHBOARD KPI ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Apps */}
        <div 
          onClick={() => onNavigateTab('apps')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-blue-500/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Apps</span>
            <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {totalApps > 0 ? totalApps.toLocaleString('id-ID') : '0'}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +12.5% vs 30 hari
            </div>
          </div>
        </div>

        {/* Total Downloads */}
        <div 
          onClick={() => onNavigateTab('analytics-downloads')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-blue-500/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Downloads</span>
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {totalDownloads > 0 ? (totalDownloads > 1000000 ? `${(totalDownloads/1000000).toFixed(2)}M` : `${(totalDownloads/1000).toFixed(1)}K`) : '0'}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +18.6% vs 30 hari
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div 
          onClick={() => onNavigateTab('access-admins')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-blue-500/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Users</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {activeUsersCount > 0 ? `${activeUsersCount}K` : '312K'}
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +9.4% vs 30 hari
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div 
          onClick={() => onNavigateTab('moderation')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-amber-500/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Reviews</span>
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {pendingReviews}
            </div>
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Perlu penanganan
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div 
          onClick={() => onNavigateTab('security-alerts')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-red-500/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Security Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {securityAlerts}
            </div>
            <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-0.5">
              {securityAlerts > 0 ? 'Peringatan aktif' : 'Aman terkendali'}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div 
          onClick={() => onNavigateTab('system-health')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-blue-500/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">System Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              98.6%
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              Status: Excellent
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 15: QUICK ACTIONS (SECTION 20: OWNER HOME QUICK ACTIONS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Pintasan Aksi Cepat Owner Home
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={onOpenNewAppForm}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            id="owner-quick-add-app"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Aplikasi</span>
          </button>

          <button
            onClick={() => onNavigateTab('users-roles')}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            id="owner-quick-add-dev"
          >
            <Users className="w-4 h-4 text-blue-500" />
            <span>+ Tambah Developer</span>
          </button>

          <button
            onClick={() => onNavigateTab('categories')}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            id="owner-quick-add-cat"
          >
            <Layers className="w-4 h-4 text-purple-500" />
            <span>+ Tambah Kategori</span>
          </button>

          <button
            onClick={() => onNavigateTab('homepage-cms')}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            id="owner-quick-add-banner"
          >
            <HardDrive className="w-4 h-4 text-emerald-500" />
            <span>+ Tambah Banner</span>
          </button>

          <button
            onClick={() => onNavigateTab('homepage-cms')}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            id="owner-quick-add-event"
          >
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>+ Tambah Event</span>
          </button>

          <button
            onClick={() => onNavigateTab('moderation')}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            id="owner-quick-create-notif"
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>+ Buat Notifikasi</span>
          </button>
        </div>
      </div>

      {/* SECTION 10 & SECTION 11: DOWNLOAD ANALYTICS & TOP APPS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Download Analytics Line Chart Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Downloads Overview</h3>
              <p className="text-[11px] text-slate-500">Garis tren akumulasi unduhan dan tayangan aplikasi</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(['24H', '7D', '30D', '90D', '1Y'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setAnalyticsPeriod(period)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                    analyticsPeriod === period 
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Visual Line Chart */}
          <div className="h-56 w-full flex flex-col justify-between pt-4 relative">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              <span>300K</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-blue-600 font-bold"><span className="w-2 h-2 rounded-full bg-blue-600"/> Downloads</span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Views</span>
              </div>
            </div>

            {/* SVG Trend Wave */}
            <div className="relative h-40 w-full my-auto">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 150">
                {/* Views Path */}
                <path
                  d="M0,120 Q100,100 200,110 T400,105 T500,100"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />
                {/* Downloads Path */}
                <path
                  d="M0,100 Q100,60 200,80 T400,30 T500,45"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>7 Aug</span>
              <span>14 Aug</span>
              <span>21 Aug</span>
              <span>28 Aug</span>
              <span>4 Sep</span>
            </div>
          </div>
        </div>

        {/* Right: Top Apps Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Apps</h3>
            <select
              value={topAppsSort}
              onChange={(e) => setTopAppsSort(e.target.value as any)}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="downloads">By Downloads</option>
              <option value="views">By Views</option>
              <option value="rating">By Rating</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {sortedTopApps.length > 0 ? (
              sortedTopApps.map((app, idx) => (
                <div 
                  key={app.id} 
                  onClick={() => onNavigateTab('apps', app.id)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs font-black text-slate-400 group-hover:text-blue-600 text-center">
                      {idx + 1}
                    </span>
                    <img 
                      src={app.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'} 
                      alt="" 
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0" 
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600">
                        {app.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {app.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-black text-slate-900 dark:text-white shrink-0 ml-2">
                    {topAppsSort === 'views' 
                      ? `${app.views || 0} views`
                      : topAppsSort === 'rating'
                      ? `★ ${app.rating || 4.5}`
                      : `${app.downloads ? (app.downloads > 1000 ? `${(app.downloads/1000).toFixed(0)}K` : app.downloads) : '0'}`
                    }
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada data aplikasi
              </div>
            )}
          </div>

          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigateTab('apps')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Lihat Semua Catalog Aplikasi
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 12 & SECTION 13: RECENT ACTIVITIES & SYSTEM OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Activities Feed (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activities</h3>
            <button
              onClick={() => onNavigateTab('access-audit')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.length > 0 ? (
              auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {log.action} — <span className="font-normal text-slate-600 dark:text-slate-400">{log.entityName || log.details || 'Aktivitas'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                      <span>Aktor: {log.performedBy || log.adminEmail || 'Admin'}</span>
                      <span className="font-mono">{new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada aktivitas admin tercatat.
              </div>
            )}
          </div>
        </div>

        {/* Right: System Overview Status Cards (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Overview</h3>
            <StatusBadge status={systemHealth} />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Storage</span>
              </div>
              <StatusBadge status="Healthy" size="sm" />
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Job Queue</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">0 pending</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Search Index</span>
              </div>
              <StatusBadge status="Healthy" size="sm" />
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Database</span>
              </div>
              <StatusBadge status="Healthy" size="sm" />
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">CDN</span>
              </div>
              <StatusBadge status="Healthy" size="sm" />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 14: MODERATION QUEUE PREVIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Review Queue</h3>
            <p className="text-[11px] text-slate-500">Antrean ulasan dan laporan yang memerlukan keputusan admin</p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              {(['all', 'submission', 'version', 'reports', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setQueueTab(tab)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md capitalize transition-colors cursor-pointer ${
                    queueTab === tab 
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('moderation')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Item / Subjek</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Priority</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Submitted At</th>
                <th className="pb-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filteredReports.length > 0 ? (
                filteredReports.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {item.appName || 'Laporan Pengguna'}
                    </td>
                    <td className="py-3 text-slate-500">
                      {item.reason || 'General Issue'}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={item.priority || 'medium'} size="sm" />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={item.status || 'open'} size="sm" />
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigateTab('moderation')}
                        className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-md font-bold text-xs transition-colors cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada antrean moderasi aktif saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
