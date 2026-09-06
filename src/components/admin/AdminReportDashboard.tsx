import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, ShieldAlert, CheckCircle2, Clock, XCircle, Search, 
  Filter, AlertTriangle, Trash2, ArrowUpRight, MessageSquare, 
  Send, RefreshCw, Loader2, ShieldCheck, Check
} from 'lucide-react';
import { AppReport, ReportStatus, ReportPriority, ReportType, AppData } from '../../types';
import { db } from '../../lib/firebase';
import { 
  collection, getDocs, doc, updateDoc, query, orderBy, 
  where, setDoc, addDoc 
} from 'firebase/firestore';

interface AdminReportDashboardProps {
  apps: AppData[];
  onRefreshApps?: () => void;
  onNavigateToApp?: (slug: string) => void;
}

export default function AdminReportDashboard({
  apps,
  onRefreshApps,
  onNavigateToApp
}: AdminReportDashboardProps) {
  const [reports, setReports] = useState<AppReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<AppReport | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: AppReport[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as AppReport);
      });
      setReports(list);

      // Automated Rule Check (Requirement 20):
      // If an app has >= 5 unresolved reports with High/Critical priority, auto flag healthStatus = 'problem'
      checkAndApplyAutomationRule(list);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAndApplyAutomationRule = async (allReports: AppReport[]) => {
    try {
      const countsByApp: Record<string, number> = {};
      allReports.forEach((r) => {
        if ((r.status === 'open' || r.status === 'investigating') && (r.priority === 'high' || r.priority === 'critical')) {
          countsByApp[r.appId] = (countsByApp[r.appId] || 0) + 1;
        }
      });

      for (const [appId, count] of Object.entries(countsByApp)) {
        if (count >= 5) {
          const targetApp = apps.find((a) => a.id === appId);
          if (targetApp && targetApp.healthStatus !== 'problem') {
            await updateDoc(doc(db, 'applications', appId), {
              healthStatus: 'problem',
              securityStatus: 'suspicious',
              updatedAt: new Date().toISOString()
            });
            console.warn(`Automation rule triggered: Flagged app ${appId} as problem due to ${count} critical reports.`);
          }
        }
      }
    } catch (e) {
      console.warn('Automation rule check failed:', e);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    setUpdating(true);
    try {
      const reportRef = doc(db, 'reports', reportId);
      const updateData: Partial<AppReport> = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      if (adminNoteInput.trim()) {
        updateData.adminNotes = adminNoteInput.trim();
      }

      await updateDoc(reportRef, updateData);

      // If resolving and report has a userId, send resolution notification to user
      const targetRep = reports.find((r) => r.id === reportId);
      if (newStatus === 'resolved' && targetRep?.userId) {
        const notifRef = doc(collection(db, 'users', targetRep.userId, 'notifications'));
        await setDoc(notifRef, {
          userId: targetRep.userId,
          title: 'Laporan kamu telah ditinjau',
          message: `Laporan kendala pada ${targetRep.appName} telah ditinjau dan ditindaklanjuti oleh tim Aero. Terima kasih atas bantuanmu.`,
          type: 'report_resolved',
          appId: targetRep.appId,
          appSlug: targetRep.appSlug,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      setActionSuccess(`Status laporan berhasil diubah ke [${newStatus}].`);
      setTimeout(() => setActionSuccess(''), 3000);

      await loadReports();
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus, adminNotes: adminNoteInput.trim() || selectedReport.adminNotes });
      }
    } catch (err) {
      console.error('Failed to update report status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReport) return;
    setUpdating(true);
    try {
      const reportRef = doc(db, 'reports', selectedReport.id);
      await updateDoc(reportRef, {
        adminNotes: adminNoteInput.trim(),
        updatedAt: new Date().toISOString()
      });
      setSelectedReport({ ...selectedReport, adminNotes: adminNoteInput.trim() });
      setActionSuccess('Catatan admin berhasil disimpan.');
      setTimeout(() => setActionSuccess(''), 3000);
      await loadReports();
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDangerousAppAction = async (appId: string) => {
    if (!window.confirm('Tandai aplikasi ini sebagai BERBAHAYA (Problem) dan arsipkan?')) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'applications', appId), {
        healthStatus: 'problem',
        securityStatus: 'malicious',
        status: 'archived',
        updatedAt: new Date().toISOString()
      });
      setActionSuccess('Aplikasi telah ditandai sebagai berbahaya dan diarsipkan dari katalog.');
      if (onRefreshApps) onRefreshApps();
    } catch (err) {
      console.error('Failed to flag dangerous app:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (selectedPriority !== 'all' && r.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchApp = r.appName?.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchEmail = r.userEmail?.toLowerCase().includes(q);
      if (!matchApp && !matchDesc && !matchEmail) return false;
    }
    return true;
  });

  const getPriorityBadgeClass = (p?: ReportPriority) => {
    switch (p) {
      case 'critical':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  const getStatusBadgeClass = (s: ReportStatus) => {
    switch (s) {
      case 'open':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'investigating':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'dismissed':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6" id="admin-report-dashboard">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <span>Pusat Laporan Kendala & Moderasi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pantau laporan integritas APK, kendala download, versi bermasalah, dan laporan ulasan pengguna.
          </p>
        </div>

        <button
          onClick={loadReports}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama aplikasi, isi laporan, atau email pelapor..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['all', 'open', 'investigating', 'resolved', 'dismissed'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                  selectedStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'Semua Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Prioritas:
          </span>
          {['all', 'critical', 'high', 'medium', 'low'].map((pr) => (
            <button
              key={pr}
              onClick={() => setSelectedPriority(pr)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors whitespace-nowrap ${
                selectedPriority === pr
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {pr === 'all' ? 'Semua' : pr}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Reports List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Table / List */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold">Memuat daftar laporan...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada laporan yang cocok dengan filter
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Semua berkas dan aplikasi dalam kondisi normal.
              </p>
            </div>
          ) : (
            filteredReports.map((item) => {
              const isSelected = selectedReport?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedReport(item);
                    setAdminNoteInput(item.adminNotes || '');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-3 ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/50 ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {item.appName}
                        </span>
                        {item.versionName && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                            v{item.versionName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Pelapor: {item.userEmail || 'Anonim'} · {new Date(item.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.priority && (
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${getPriorityBadgeClass(item.priority)}`}>
                          {item.priority}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      Jenis: {item.reportType || 'Kendala Umum'}
                    </span>
                    {item.adminNotes && (
                      <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Ada Catatan
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Report Action & Detail Panel */}
        <div className="lg:col-span-5">
          {selectedReport ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-6 sticky top-24">
              <div className="space-y-2 border-b border-slate-150 dark:border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Detail Laporan #{selectedReport.id.slice(0, 7)}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${getStatusBadgeClass(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedReport.appName}
                </h3>
                {selectedReport.appSlug && onNavigateToApp && (
                  <button
                    onClick={() => onNavigateToApp(selectedReport.appSlug!)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <span>Buka Halaman Aplikasi</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Report Information */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-0.5">Kategori Masalah:</label>
                  <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {selectedReport.reportType?.replace('_', ' ') || 'Umum'}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-0.5">Uraian Masalah Pengguna:</label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {selectedReport.description}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-0.5">Pelapor:</label>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedReport.userEmail || 'Anonim'} (ID: {selectedReport.userId || 'Guest'})
                  </p>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2 border-t border-slate-150 dark:border-white/10 pt-4">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  Ubah Status Laporan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'investigating')}
                    disabled={updating}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/40 transition-colors"
                  >
                    Investigating
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                    disabled={updating}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900/40 transition-colors"
                  >
                    Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                    disabled={updating}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-white/10 transition-colors"
                  >
                    Dismissed
                  </button>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2 border-t border-slate-150 dark:border-white/10 pt-4">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Catatan Admin (Opsional):
                </label>
                <textarea
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  rows={3}
                  placeholder="Tulis catatan penanganan masalah atau verifikasi keamanan..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={updating}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Simpan Catatan
                </button>
              </div>

              {/* Critical Threat Mitigation Action */}
              <div className="border-t border-slate-150 dark:border-white/10 pt-4">
                <button
                  onClick={() => handleDangerousAppAction(selectedReport.appId)}
                  disabled={updating}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-900/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Tandai Aplikasi Bermasalah / Hapus APK</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-white/10 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold">Pilih laporan untuk melihat detail dan tindakan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
