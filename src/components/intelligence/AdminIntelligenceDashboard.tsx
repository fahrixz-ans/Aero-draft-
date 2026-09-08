import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Search,
  Sparkles,
  Award,
  AlertTriangle,
  Server,
  RefreshCw,
  ShieldAlert,
  Calendar,
  Smartphone,
  CheckCircle2,
  Clock,
  Users,
  Download,
  ShieldCheck,
  FileText
} from 'lucide-react';

import {
  IntelligenceOverviewMetrics,
  DiscoveryFunnelData,
  SearchFunnelData,
  AppIntelligenceSummary,
  SearchQueryInsight,
  RecommendationShelfInsight,
  RankingMovementSignal,
  IntelligenceAction,
  OperationalHealthIndicator,
  IntelligenceDataQuality,
  EmergencyControlsState,
  DataFreshness,
  ActionStatus,
  DeveloperIntelligenceSummary,
  DownloadDiagnosticBreakdown,
  VersionIntelligenceItem,
  SecurityScanInsight,
  IntelligenceAnomaly,
  IntelligenceAuditEntry
} from '../../types/intelligence';

import { AppData } from '../../types';
import { ClientIntelligenceService } from '../../services/intelligence/intelligenceService';

import { IntelligenceOverview } from './IntelligenceOverview';
import { AppIntelligencePanel } from './AppIntelligencePanel';
import { SearchIntelligencePanel } from './SearchIntelligencePanel';
import { RecommendationIntelligencePanel } from './RecommendationIntelligencePanel';
import { RankingIntelligencePanel } from './RankingIntelligencePanel';
import { OperationalIntelligence } from './OperationalIntelligence';
import { IntelligenceActionCenter } from './IntelligenceActionCenter';
import { EmergencyControlsModal } from './EmergencyControlsModal';
import { DeveloperIntelligencePanel } from './DeveloperIntelligencePanel';
import { DownloadIntelligencePanel } from './DownloadIntelligencePanel';
import { SecurityIntelligencePanel } from './SecurityIntelligencePanel';
import { VersionIntelligencePanel } from './VersionIntelligencePanel';
import { IntelligenceAnomalies } from './IntelligenceAnomalies';
import { IntelligenceAuditLog } from './IntelligenceAuditLog';

interface AdminIntelligenceDashboardProps {
  id?: string;
  initialApps?: AppData[];
}

type TabType = 
  | 'overview' 
  | 'apps' 
  | 'developers'
  | 'search' 
  | 'recommendations' 
  | 'ranking' 
  | 'downloads'
  | 'versions'
  | 'security'
  | 'anomalies'
  | 'actions' 
  | 'audit'
  | 'operations';

export const AdminIntelligenceDashboard: React.FC<AdminIntelligenceDashboardProps> = ({
  id = 'admin-intelligence-dashboard',
  initialApps = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState<string>('7D');
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // States
  const [metrics, setMetrics] = useState<IntelligenceOverviewMetrics | null>(null);
  const [freshness, setFreshness] = useState<DataFreshness>({ status: 'FRESH' });
  const [discoveryFunnel, setDiscoveryFunnel] = useState<DiscoveryFunnelData | null>(null);
  const [searchFunnel, setSearchFunnel] = useState<SearchFunnelData | null>(null);
  const [apps, setApps] = useState<AppIntelligenceSummary[]>([]);
  const [appsTotal, setAppsTotal] = useState<number>(0);
  const [appsPage, setAppsPage] = useState<number>(1);
  const [appsSearch, setAppsSearch] = useState<string>('');
  const [developers, setDevelopers] = useState<DeveloperIntelligenceSummary[]>([]);
  const [topQueries, setTopQueries] = useState<SearchQueryInsight[]>([]);
  const [zeroQueries, setZeroQueries] = useState<SearchQueryInsight[]>([]);
  const [searchCtr, setSearchCtr] = useState<number>(68.2);
  const [shelves, setShelves] = useState<RecommendationShelfInsight[]>([]);
  const [shelvesCtr, setShelvesCtr] = useState<number>(28.5);
  const [feedbackStatus, setFeedbackStatus] = useState<'HEALTHY' | 'EVALUATING' | 'RECALIBRATING'>('HEALTHY');
  const [leaderboard, setLeaderboard] = useState<RankingMovementSignal[]>([]);
  const [downloads, setDownloads] = useState<DownloadDiagnosticBreakdown | null>(null);
  const [versions, setVersions] = useState<VersionIntelligenceItem[]>([]);
  const [security, setSecurity] = useState<SecurityScanInsight | null>(null);
  const [anomalies, setAnomalies] = useState<IntelligenceAnomaly[]>([]);
  const [auditLogs, setAuditLogs] = useState<IntelligenceAuditEntry[]>([]);
  const [actions, setActions] = useState<IntelligenceAction[]>([]);
  const [health, setHealth] = useState<OperationalHealthIndicator[]>([]);
  const [dataQuality, setDataQuality] = useState<IntelligenceDataQuality[]>([]);
  const [emergencyControls, setEmergencyControls] = useState<EmergencyControlsState>({
    disableRecommendations: false,
    disableDeveloperUpload: false,
    disableAnalyticsAggregation: false,
    emergencyMaintenanceMode: false
  });
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const loadData = async (targetPeriod: string = period) => {
    try {
      setIsRefreshing(true);

      // Concurrent data fetching
      const [
        overviewRes,
        discoveryRes,
        searchFunnelRes,
        appsRes,
        devsRes,
        searchRes,
        recsRes,
        rankingRes,
        downloadsRes,
        versionsRes,
        securityRes,
        anomaliesRes,
        auditRes,
        actionsRes,
        operationsRes,
        emergencyRes
      ] = await Promise.all([
        ClientIntelligenceService.getOverview(targetPeriod, initialApps),
        ClientIntelligenceService.getDiscoveryFunnel(targetPeriod),
        ClientIntelligenceService.getSearchFunnel(targetPeriod),
        ClientIntelligenceService.getApps({ page: appsPage, limit: 20, search: appsSearch }),
        ClientIntelligenceService.getDevelopers(),
        ClientIntelligenceService.getSearch(),
        ClientIntelligenceService.getRecommendations(),
        ClientIntelligenceService.getRanking(),
        ClientIntelligenceService.getDownloads(),
        ClientIntelligenceService.getVersions(),
        ClientIntelligenceService.getSecurity(),
        ClientIntelligenceService.getAnomalies(),
        ClientIntelligenceService.getAuditLogs(),
        ClientIntelligenceService.getActions(),
        ClientIntelligenceService.getOperations(),
        ClientIntelligenceService.getEmergencyControls()
      ]);

      setMetrics(overviewRes.metrics);
      setFreshness(overviewRes.freshness);
      setDiscoveryFunnel(discoveryRes);
      setSearchFunnel(searchFunnelRes);
      setApps(appsRes.items);
      setAppsTotal(appsRes.total);
      setDevelopers(devsRes);
      setTopQueries(searchRes.topQueries);
      setZeroQueries(searchRes.zeroResultQueries);
      setSearchCtr(searchRes.overallCtr);
      setShelves(recsRes.shelves);
      setShelvesCtr(recsRes.overallCtr);
      setFeedbackStatus(recsRes.feedbackLoopStatus);
      setLeaderboard(rankingRes.leaderboard);
      setDownloads(downloadsRes);
      setVersions(versionsRes);
      setSecurity(securityRes);
      setAnomalies(anomaliesRes);
      setAuditLogs(auditRes);
      setActions(actionsRes);
      setHealth(operationsRes.health);
      setDataQuality(operationsRes.dataQuality);
      setEmergencyControls(emergencyRes);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleActionStatusChange = async (actionId: string, status: ActionStatus, note?: string) => {
    await ClientIntelligenceService.updateActionStatus(actionId, status, note);
    // Refresh actions
    const freshActions = await ClientIntelligenceService.getActions();
    setActions(freshActions);
  };

  const handleEmergencyUpdate = async (updates: Partial<EmergencyControlsState>, reason: string): Promise<boolean> => {
    const res = await ClientIntelligenceService.updateEmergencyControls(updates, reason);
    if (res) {
      setEmergencyControls(res);
      return true;
    }
    return false;
  };

  const tabs: { id: TabType; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Ringkasan', icon: Activity },
    { id: 'apps', label: 'Aplikasi', icon: Smartphone, count: appsTotal || undefined },
    { id: 'developers', label: 'Pengembang', icon: Users, count: developers.length || undefined },
    { id: 'search', label: 'Pencarian', icon: Search },
    { id: 'recommendations', label: 'Rekomendasi', icon: Sparkles },
    { id: 'ranking', label: 'Peringkat', icon: Award },
    { id: 'downloads', label: 'Unduhan', icon: Download },
    { id: 'versions', label: 'Versi', icon: Layers, count: versions.length || undefined },
    { id: 'security', label: 'Keamanan', icon: ShieldCheck },
    { id: 'anomalies', label: 'Anomali', icon: AlertTriangle, count: anomalies.filter(a => a.status === 'OPEN').length || undefined },
    { id: 'actions', label: 'Pusat Aksi', icon: CheckCircle2, count: actions.filter(a => a.status === 'OPEN').length || undefined },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
    { id: 'operations', label: 'Operasional', icon: Server }
  ];

  return (
    <div id={id} className="space-y-6">
      {/* 1. TOP BAR: TITLE, FILTERS, EMERGENCY CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Observabilitas & Intelijen Aero
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-md uppercase">
              Stage 9.10
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pusat pemantauan analitik terpadu, corong penemuan, dan kesehatan operasional
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="flex items-center bg-gray-50 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700/80 text-xs">
            {[
              { id: 'Today', label: 'Hari Ini' },
              { id: '24H', label: '24 Jam' },
              { id: '7D', label: '7 Hari' },
              { id: '30D', label: '30 Hari' },
              { id: '90D', label: '90 Hari' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1 font-medium rounded-lg transition-colors ${
                  period === p.id
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadData(period)}
            disabled={isRefreshing}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Emergency Controls Button */}
          <button
            type="button"
            onClick={() => setIsEmergencyModalOpen(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
              emergencyControls.disableRecommendations || emergencyControls.disableDeveloperUpload
                ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 animate-pulse'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-gray-700/80 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>Kontrol Darurat</span>
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE TAB CONTENT */}
      {activeTab === 'overview' && (
        <IntelligenceOverview
          metrics={metrics}
          funnel={discoveryFunnel}
          actions={actions}
          onActionStatusChange={handleActionStatusChange}
          loading={loading}
        />
      )}

      {activeTab === 'apps' && (
        <AppIntelligencePanel
          apps={apps}
          total={appsTotal}
          page={appsPage}
          pageSize={20}
          onPageChange={setAppsPage}
          onSearchChange={setAppsSearch}
          onCategoryChange={() => {}}
          loading={loading}
        />
      )}

      {activeTab === 'developers' && (
        <DeveloperIntelligencePanel
          developers={developers}
          loading={loading}
        />
      )}

      {activeTab === 'search' && (
        <SearchIntelligencePanel
          topQueries={topQueries}
          zeroResultQueries={zeroQueries}
          funnel={searchFunnel}
          overallCtr={searchCtr}
          loading={loading}
        />
      )}

      {activeTab === 'recommendations' && (
        <RecommendationIntelligencePanel
          shelves={shelves}
          overallCtr={shelvesCtr}
          feedbackLoopStatus={feedbackStatus}
          loading={loading}
        />
      )}

      {activeTab === 'ranking' && (
        <RankingIntelligencePanel
          leaderboard={leaderboard}
          freshness={freshness}
          loading={loading}
        />
      )}

      {activeTab === 'downloads' && (
        <DownloadIntelligencePanel
          downloads={downloads}
          loading={loading}
        />
      )}

      {activeTab === 'versions' && (
        <VersionIntelligencePanel
          versions={versions}
          loading={loading}
        />
      )}

      {activeTab === 'security' && (
        <SecurityIntelligencePanel
          security={security}
          loading={loading}
        />
      )}

      {activeTab === 'anomalies' && (
        <IntelligenceAnomalies
          anomalies={anomalies}
          loading={loading}
        />
      )}

      {activeTab === 'actions' && (
        <IntelligenceActionCenter
          actions={actions}
          onStatusChange={handleActionStatusChange}
          loading={loading}
        />
      )}

      {activeTab === 'audit' && (
        <IntelligenceAuditLog
          logs={auditLogs}
          loading={loading}
        />
      )}

      {activeTab === 'operations' && (
        <OperationalIntelligence
          health={health}
          dataQuality={dataQuality}
          loading={loading}
        />
      )}

      {/* Emergency Controls Modal */}
      <EmergencyControlsModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        controls={emergencyControls}
        onUpdate={handleEmergencyUpdate}
      />
    </div>
  );
};
