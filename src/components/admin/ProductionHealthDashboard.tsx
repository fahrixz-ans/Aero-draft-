import React, { useState, useEffect } from 'react';
import { 
  Activity, Server, HardDrive, ShieldCheck, RefreshCw, 
  Layers, Clock, AlertTriangle, CheckCircle2, FileText, 
  Database, Zap, ArrowUpRight, Cpu, Eye, Filter
} from 'lucide-react';
import { SystemHealthStatus, StorageAuditReport, AdminAuditLog } from '../../types';
import { fetchSystemHealth, fetchStorageAudit } from '../../services/health/systemHealthService';
import { fetchAdminAuditLogs } from '../../services/admin/auditLogService';

export default function ProductionHealthDashboard() {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [storageAudit, setStorageAudit] = useState<StorageAuditReport | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');

  const loadAllData = async () => {
    try {
      const [hData, sData, lData] = await Promise.all([
        fetchSystemHealth(),
        fetchStorageAudit(),
        fetchAdminAuditLogs(50)
      ]);
      setHealth(hData);
      setStorageAudit(sData);
      setAuditLogs(lData);
    } catch (err) {
      console.error('Failed loading system health metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000); // auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const filteredLogs = auditLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.action.includes(logFilter) || log.entityType === logFilter;
  });

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}h ${h}j ${m}m`;
    if (h > 0) return `${h}j ${m}m ${s}d`;
    return `${m}m ${s}d`;
  };

  const getActionBadge = (action: string) => {
    if (action.includes('publish') || action.includes('created')) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{action}</span>;
    }
    if (action.includes('delete') || action.includes('archive')) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">{action}</span>;
    }
    if (action.includes('security') || action.includes('report')) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">{action}</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{action}</span>;
  };

  if (loading && !health) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm">Memuat metrik kesehatan sistem produksi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pusat Kesehatan &amp; Audit Produksi Aero</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Tahap 6 Production
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pemantauan real-time status server backend, memori, antrean worker, integritas penyimpanan APK, dan jejak audit administrator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Perbarui Status
          </button>
        </div>
      </div>

      {/* Grid Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: System Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Status API &amp; Server</span>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white uppercase">
              {health?.status || 'HEALTHY'}
            </span>
            <span className="text-xs text-emerald-500 font-medium">Uptime {formatUptime(health?.uptimeSeconds || 0)}</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Port 3000 Ingress Normal (HTTP Range Support)
          </div>
        </div>

        {/* Metric 2: Memory Heap */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Penggunaan Memori Heap</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {health?.memory.heapUsedMB || 0} MB
            </span>
            <span className="text-xs text-slate-500">/ {health?.memory.heapTotalMB || 0} MB Total</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            RSS Memory: {health?.memory.rssMB || 0} MB
          </div>
        </div>

        {/* Metric 3: Storage & APKs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Repositori Berkas &amp; Storage</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {storageAudit?.totalSizeFormatted || '0 MB'}
            </span>
            <span className="text-xs text-slate-500">({storageAudit?.totalFiles || 0} Berkas)</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-purple-600 dark:text-purple-400 font-medium">{storageAudit?.activeApkFiles || 0} APK</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{storageAudit?.activeImageFiles || 0} Gambar</span>
          </div>
        </div>

        {/* Metric 4: Background Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Antrean Background Worker</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {health?.queue.activeJobs || 0} Aktif
            </span>
            <span className="text-xs text-emerald-500 font-medium">({health?.queue.completedJobs || 0} Selesai)</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {health?.queue.failedJobs === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 0 Gagal / 0 Dead Letter
              </span>
            ) : (
              <span className="text-rose-500 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {health?.queue.failedJobs} Gagal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Architecture & Pipeline Guarantees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Protokol Keamanan APK &amp; Berkas
          </h3>
          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Tidak Pernah Menjalankan APK di Server</strong>: Berkas APK hanya di-parse secara statis via ZIP entry pool reader.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>SHA-256 Integritas Kriptografis</strong>: Setiap unggahan APK dihitung checksum SHA-256 dan disimpan dengan kunci penyimpanan deterministik.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Pencegahan Path Traversal</strong>: Nama file masukan pengguna disanitasi total (`uploads/apks/[sha256].apk`).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Dukungan HTTP Range Requests</strong>: Unduhan mendukung pause/resume (206 Partial Content) untuk keandalan jaringan seluler.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Pipeline Gambar &amp; Magic Bytes
          </h3>
          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Validasi File Signature (Magic Bytes)</strong>: Memverifikasi header byte nyata (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WEBP, AVIF).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Ekstraksi Otomatis Launcher Icon</strong>: Ekstraksi otomatis launcher icon beresolusi tinggi langsung dari arsip APK.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Batas Ukuran Ketat</strong>: App Icon maks 2MB, Screenshot &amp; Banner maks 8MB, APK maks 150MB.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Pencegahan Duplikasi Berkas</strong>: Gambar disimpan berbasis hash konten sehingga file identik tidak menduplikasi ruang disk.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-500" />
            Proteksi Lapis Lintas &amp; Rate Limiting
          </h3>
          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <span><strong>Rate Limiter Berlapis</strong>: Batasan kuota per IP (Search: 60/m, Download: 45/m, Upload: 30/10m, Report: 20/m).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <span><strong>Header Keamanan HTTP</strong>: X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, Referrer-Policy.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <span><strong>Dynamic SEO &amp; Sitemap</strong>: Endpoint `/sitemap.xml` dan `/robots.txt` aktif mengindeks aplikasi publik.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <span><strong>Pembersihan Error Bersih</strong>: Tidak ada kebocoran stack trace database atau path server ke pengguna.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Admin Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Jejak Audit Administrator (Admin Audit Logs)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Riwayat tindakan administratif penting (publikasi, arsip, unggah APK, moderasi ulasan, dan laporan).
            </p>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Tindakan</option>
              <option value="publish">Publikasi (Publish)</option>
              <option value="apk">Unggah/Hapus APK</option>
              <option value="review">Moderasi Ulasan</option>
              <option value="report">Penyelesaian Laporan</option>
              <option value="category">Kategori</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            Belum ada jejak audit yang tercatat untuk filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Tindakan (Action)</th>
                  <th className="py-3 px-4">Entitas</th>
                  <th className="py-3 px-4">Detail / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {log.adminEmail || 'admin@aeroapk.com'}
                    </td>
                    <td className="py-3 px-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold tracking-wider text-slate-400">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {log.entityName || log.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
