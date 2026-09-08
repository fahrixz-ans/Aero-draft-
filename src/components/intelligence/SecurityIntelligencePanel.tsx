import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  AlertTriangle, 
  CheckCircle2, 
  FileSearch, 
  CheckCheck,
  Ban,
  Activity,
  UserX,
  Bot,
  RefreshCw,
  RotateCcw,
  ExternalLink,
  Search
} from 'lucide-react';
import { SecurityScanInsight } from '../../types/intelligence';

interface SecurityIntelligencePanelProps {
  id?: string;
  security: SecurityScanInsight | null;
  loading?: boolean;
  onRefresh?: () => void;
}

type TabType = 'scans' | 'abuse' | 'events';

export const SecurityIntelligencePanel: React.FC<SecurityIntelligencePanelProps> = ({
  id = 'security-intelligence-panel',
  security,
  loading = false,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('scans');
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleResetAbuse = async (targetType: string, targetId: string) => {
    try {
      setResettingId(`${targetType}_${targetId}`);
      const res = await fetch('/api/admin/intelligence/security/abuse-scores/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Skor ancaman untuk ${targetType} ${targetId} berhasil direset ke NORMAL.`);
        if (onRefresh) onRefresh();
      } else {
        setActionMessage(`Gagal mereset: ${data.error?.message || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      setActionMessage(`Gagal: ${err.message}`);
    } finally {
      setResettingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleUpdateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      setStatusUpdatingId(incidentId);
      const res = await fetch(`/api/admin/intelligence/security/incidents/${incidentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: `Diperbarui via panel Admin pada ${new Date().toLocaleString('id-ID')}` })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Status insiden #${incidentId} diubah menjadi ${status}.`);
        if (onRefresh) onRefresh();
      } else {
        setActionMessage(`Gagal memperbarui status: ${data.error?.message || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      setActionMessage(`Gagal: ${err.message}`);
    } finally {
      setStatusUpdatingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  if (loading || !security) {
    return (
      <div id={id} className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="h-6 w-52 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-50 dark:bg-gray-800/60 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const overview = security.overview || {
    totalEvents: 0,
    blockedCount: 0,
    rateLimitEvents: 0,
    botCount: 0,
    openIncidents: 0,
    flaggedEntitiesCount: 0
  };

  return (
    <div id={id} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Intelijen Keamanan & Proteksi Platform (Stage 9.11)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Observabilitas ancaman, proteksi bot/scraping, mitigasi rate limiting adaptif, dan audit insiden keamanan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">VirusTotal Engine:</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              security.virusTotalHealth === 'HEALTHY'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {security.virusTotalHealth}
            </span>
          </div>

          {onRefresh && (
            <button
              id="btn-refresh-security"
              onClick={onRefresh}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              title="Perbarui data keamanan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs rounded-xl flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-blue-500 font-bold ml-2">×</button>
        </div>
      )}

      {/* Overview Cards: Stage 9.11 Security Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Total Scan</span>
            <FileSearch className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1.5">
            {security.totalScanned}
          </div>
          <p className="text-[10px] text-emerald-600 mt-0.5">{security.verifiedCount} lolos verifikasi</p>
        </div>

        <div className="p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Karantina APK</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1.5">
            {security.quarantinedCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{security.revokedCount} versi dicabut</p>
        </div>

        <div className="p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Bot Dicegah</span>
            <Bot className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">
            {overview.botCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Scraper & alat uji</p>
        </div>

        <div className="p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Rate Limit Hit</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">
            {overview.rateLimitEvents}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Throttling aktif</p>
        </div>

        <div className="p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Insiden Terbuka</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1.5">
            {overview.openIncidents}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">Perlu perhatian</p>
        </div>

        <div className="p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Entitas Dibatasi</span>
            <UserX className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1.5">
            {overview.flaggedEntitiesCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{overview.blockedCount} diblokir total</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          id="tab-security-scans"
          onClick={() => setActiveTab('scans')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'scans'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Pemindaian & Insiden APK ({security.recentIncidents.length})
        </button>

        <button
          id="tab-security-abuse"
          onClick={() => setActiveTab('abuse')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'abuse'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Skor Ancaman & Pembatasan IP/User ({security.abuseScores?.length || 0})
        </button>

        <button
          id="tab-security-events"
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'events'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Audit Log Event Keamanan ({security.securityEvents?.length || 0})
        </button>
      </div>

      {/* Tab 1: APK Scans & Incidents */}
      {activeTab === 'scans' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Log Insiden Keamanan APK & Integritas Biner
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Hasil pemindaian VirusTotal, pencabutan versi berbahaya, dan tindakan karantina otomatis.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {security.recentIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                <CheckCheck className="w-6 h-6 text-emerald-500" />
                <span>Tidak ada insiden atau ancaman keamanan APK yang terdeteksi saat ini. Sistem bersih.</span>
              </div>
            ) : (
              security.recentIncidents.map((incident) => {
                const severity = incident.threatSeverity || incident.severity || 'MEDIUM';
                const status = incident.status || 'OPEN';

                return (
                  <div key={incident.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                          {incident.appName || incident.type || 'Insiden Keamanan'}
                        </span>
                        {incident.version && (
                          <span className="text-[11px] font-mono text-gray-400">
                            v{incident.version}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          severity === 'CRITICAL' || severity === 'HIGH'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        }`}>
                          {severity}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          status === 'RESOLVED' || status === 'MITIGATED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : status === 'INVESTIGATING'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {incident.threatType || incident.description || 'Deteksi potensi risiko keamanan pada berkas APK'}
                      </p>
                      {incident.detectedAt && (
                        <p className="text-[10px] text-gray-400">
                          Terdeteksi: {new Date(incident.detectedAt).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {status !== 'RESOLVED' ? (
                        <>
                          {status !== 'INVESTIGATING' && (
                            <button
                              id={`btn-investigate-${incident.id}`}
                              disabled={statusUpdatingId === incident.id}
                              onClick={() => handleUpdateIncidentStatus(incident.id, 'INVESTIGATING')}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition"
                            >
                              Investigasi
                            </button>
                          )}
                          <button
                            id={`btn-resolve-${incident.id}`}
                            disabled={statusUpdatingId === incident.id}
                            onClick={() => handleUpdateIncidentStatus(incident.id, 'RESOLVED')}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg transition"
                          >
                            Tandai Selesai
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Threat Scores & Rate Limiting Controls */}
      {activeTab === 'abuse' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Pemantauan Skor Ancaman Entitas & Pembatasan Akses
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Skor adaptif untuk IP, User ID, dan Pengembang. Entitas dengan level BLOCKED diblokir dari endpoint kritis.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-3 font-semibold">Tipe Entitas</th>
                  <th className="p-3 font-semibold">Identitas / Hash</th>
                  <th className="p-3 font-semibold">Skor Ancaman</th>
                  <th className="p-3 font-semibold">Status Akses</th>
                  <th className="p-3 font-semibold">Alasan Riwayat</th>
                  <th className="p-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(!security.abuseScores || security.abuseScores.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      <CheckCheck className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                      Tidak ada entitas yang terindikasi ancaman atau pembatasan saat ini.
                    </td>
                  </tr>
                ) : (
                  security.abuseScores.map((score) => {
                    const isBlocked = score.level === 'BLOCKED';
                    const isRestricted = score.level === 'RESTRICTED';

                    return (
                      <tr key={`${score.entityType}_${score.entityId}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="p-3 font-mono font-bold text-gray-700 dark:text-gray-300">
                          {score.entityType}
                        </td>
                        <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                          {score.entityId}
                        </td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded-full ${
                            score.score >= 50
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : score.score >= 20
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}>
                            {score.score} pts
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] ${
                            isBlocked
                              ? 'bg-red-600 text-white'
                              : isRestricted
                              ? 'bg-amber-500 text-white'
                              : score.level === 'WATCH'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {score.level}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {score.reasons?.join(', ') || 'Aktivitas mencurigakan'}
                        </td>
                        <td className="p-3">
                          <button
                            id={`btn-reset-${score.entityType}-${score.entityId}`}
                            disabled={resettingId === `${score.entityType}_${score.entityId}`}
                            onClick={() => handleResetAbuse(score.entityType, score.entityId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Security Event Stream */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Audit Aliran Peristiwa Keamanan (Immutable Security Event Stream)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Pencatatan real-time terhadap upaya bot, rate limit violation, deteksi duplikasi APK, dan potensi ancaman path traversal.
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(!security.securityEvents || security.securityEvents.length === 0) ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Tidak ada peristiwa keamanan yang tercatat baru-baru ini.
              </div>
            ) : (
              security.securityEvents.map((event) => (
                <div key={event.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                        {event.type}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        event.severity === 'CRITICAL' || event.severity === 'HIGH'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                          : event.severity === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}>
                        {event.severity}
                      </span>
                      {event.endpoint && (
                        <span className="font-mono text-gray-400 text-[10px]">
                          {event.endpoint}
                        </span>
                      )}
                    </div>
                    {event.metadata && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate max-w-xl">
                        {JSON.stringify(event.metadata)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
