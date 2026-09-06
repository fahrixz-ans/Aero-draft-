import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, MessageSquare, CheckCircle2, 
  XCircle, Filter, Search, Clock, Eye, Trash2, ArrowRight,
  ShieldCheck, RefreshCw, AlertCircle, FileText, Smartphone,
  Check, X, ChevronRight, User, Sparkles, ExternalLink
} from 'lucide-react';
import { AppData, AppReport, ReportStatus, ReviewReport, AdminAuditLog } from '../../types';
import { db, auth } from '../../lib/firebase';
import { 
  collection, getDocs, doc, updateDoc, query, orderBy, 
  onSnapshot, deleteDoc, setDoc 
} from 'firebase/firestore';
import { logAdminAction } from '../../services/admin/auditLogService';

interface ModerationItem {
  id: string;
  type: 'report' | 'review' | 'security_warning';
  title: string;
  subtitle: string;
  targetId: string;
  targetName: string;
  targetSlug?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'dismissed';
  details: string;
  reportedBy?: string;
  reportedEmail?: string;
  createdAt: string;
  metadata?: Record<string, any>;
  rawObject?: any;
}

interface AdminModerationHubProps {
  apps: AppData[];
  onNavigateToApp?: (slug: string) => void;
  onRefreshApps?: () => void;
}

export default function AdminModerationHub({
  apps,
  onNavigateToApp,
  onRefreshApps
}: AdminModerationHubProps) {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'reviews' | 'security'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  useEffect(() => {
    loadAllModerationItems();
  }, [apps]);

  const loadAllModerationItems = async () => {
    setLoading(true);
    const aggregated: ModerationItem[] = [];

    try {
      // 1. Fetch user reports from 'reports' collection
      try {
        const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')));
        reportsSnap.forEach((docSnap) => {
          const r = docSnap.data() as AppReport;
          const relatedApp = apps.find(a => a.id === r.appId);
          aggregated.push({
            id: docSnap.id,
            type: 'report',
            title: `Laporan: ${r.type || 'Kendala Aplikasi'}`,
            subtitle: `Aplikasi: ${r.appName || relatedApp?.name || r.appId}`,
            targetId: r.appId,
            targetName: r.appName || relatedApp?.name || r.appId,
            targetSlug: relatedApp?.slug,
            severity: r.priority === 'critical' ? 'critical' : r.priority === 'high' ? 'high' : r.priority === 'medium' ? 'medium' : 'low',
            status: r.status === 'resolved' ? 'resolved' : r.status === 'dismissed' ? 'dismissed' : 'pending',
            details: r.description || r.adminNotes || 'Tidak ada keterangan tambahan.',
            reportedBy: r.userEmail || 'Pengguna Publik',
            reportedEmail: r.userEmail,
            createdAt: r.createdAt || new Date().toISOString(),
            metadata: { ...r },
            rawObject: r
          });
        });
      } catch (e) {
        console.warn('Reports collection fetch failed:', e);
      }

      // 2. Fetch feedback from 'feedback' collection
      try {
        const feedbackSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
        feedbackSnap.forEach((docSnap) => {
          const fb = docSnap.data() as any;
          // Avoid duplicate IDs
          if (!aggregated.some(item => item.id === docSnap.id)) {
            const relatedApp = apps.find(a => a.id === fb.applicationId);
            aggregated.push({
              id: docSnap.id,
              type: 'report',
              title: `Feedback: ${fb.type || 'Laporan Pengguna'}`,
              subtitle: `Aplikasi: ${fb.applicationName || relatedApp?.name || 'Aero App'}`,
              targetId: fb.applicationId || 'general',
              targetName: fb.applicationName || relatedApp?.name || 'Aplikasi Umum',
              targetSlug: relatedApp?.slug,
              severity: fb.type === 'Keamanan' || fb.type === 'Bug Kritis' ? 'high' : 'medium',
              status: fb.status === 'resolved' ? 'resolved' : fb.status === 'dismissed' ? 'dismissed' : 'pending',
              details: fb.message || 'Tidak ada pesan.',
              reportedBy: fb.email || 'Pengguna Web',
              reportedEmail: fb.email,
              createdAt: fb.createdAt || new Date().toISOString(),
              metadata: { ...fb },
              rawObject: fb
            });
          }
        });
      } catch (e) {
        console.warn('Feedback collection fetch failed:', e);
      }

      // 3. Scan applications for Security Warnings (Sensitive Permissions, Hash Mismatch, Problem status)
      apps.forEach((app) => {
        const sensitivePerms = (app.permissions || []).filter((p: string) => 
          p.includes('SYSTEM_ALERT_WINDOW') || 
          p.includes('REQUEST_INSTALL_PACKAGES') || 
          p.includes('BIND_ACCESSIBILITY_SERVICE') ||
          p.includes('RECORD_AUDIO') ||
          p.includes('READ_SMS')
        );

        if (sensitivePerms.length > 0 || app.healthStatus === 'problem' || app.healthStatus === 'warning') {
          aggregated.push({
            id: `sec-warn-${app.id}`,
            type: 'security_warning',
            title: `Peringatan Keamanan: Izin Sensitif & Integritas`,
            subtitle: `Aplikasi: ${app.name} (${app.version || 'v1.0'})`,
            targetId: app.id,
            targetName: app.name,
            targetSlug: app.slug,
            severity: app.healthStatus === 'problem' ? 'critical' : 'high',
            status: app.healthStatus === 'healthy' && app.verifiedSource ? 'resolved' : 'pending',
            details: `Aplikasi meminta ${sensitivePerms.length} izin tingkat tinggi: [${sensitivePerms.join(', ')}]. Terverifikasi: ${app.verifiedSource ? 'Ya' : 'Belum'}, Health: ${app.healthStatus || 'unknown'}.`,
            reportedBy: 'Sistem Deteksi Statis APK',
            createdAt: app.updatedAt || app.releaseDate || new Date().toISOString(),
            metadata: { permissions: sensitivePerms, sha256: app.signingCertificate?.sha256 || 'N/A' },
            rawObject: app
          });
        }
      });

      // 4. Sample Flagged Reviews check
      try {
        const reviewReportsSnap = await getDocs(query(collection(db, 'reviewReports'), orderBy('createdAt', 'desc')));
        reviewReportsSnap.forEach((docSnap) => {
          const rr = docSnap.data() as ReviewReport;
          aggregated.push({
            id: docSnap.id,
            type: 'review',
            title: `Ulasan Ditandai: ${rr.reasonLabel || rr.reason}`,
            subtitle: `Aplikasi: ${rr.appName || rr.appId}`,
            targetId: rr.reviewId,
            targetName: rr.appName || rr.appId,
            severity: rr.reason === 'rule_violation' || rr.reason === 'misleading' ? 'high' : 'medium',
            status: rr.status === 'resolved' ? 'resolved' : rr.status === 'dismissed' ? 'dismissed' : 'pending',
            details: rr.details || `Ulasan dilaporkan karena ${rr.reasonLabel || rr.reason}.`,
            reportedBy: rr.reportedByUserEmail || 'Komunitas',
            reportedEmail: rr.reportedByUserEmail,
            createdAt: rr.createdAt || new Date().toISOString(),
            metadata: { ...rr },
            rawObject: rr
          });
        });
      } catch (e) {
        // Non-blocking
      }

      // Sort newest first
      aggregated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(aggregated);
    } catch (err) {
      console.error('Error fetching moderation items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (item: ModerationItem) => {
    setActionLoading(true);
    setActionSuccess('');
    try {
      if (item.type === 'report') {
        const docRef = doc(db, 'reports', item.id);
        await updateDoc(docRef, {
          status: 'resolved',
          adminNotes: adminNote.trim() || 'Diselesaikan oleh moderator.',
          updatedAt: new Date().toISOString()
        });
      } else if (item.type === 'security_warning') {
        // Mark app security verified
        const appRef = doc(db, 'applications', item.targetId);
        await updateDoc(appRef, {
          securityStatus: 'verified',
          healthStatus: 'healthy',
          updatedAt: new Date().toISOString()
        });
        if (onRefreshApps) onRefreshApps();
      } else if (item.type === 'review') {
        const docRef = doc(db, 'reviewReports', item.id);
        await updateDoc(docRef, {
          status: 'resolved',
          updatedAt: new Date().toISOString()
        });
      }

      // Log to admin_audit_logs
      await logAdminAction({
        action: 'report_resolved',
        entityType: item.type === 'security_warning' ? 'security' : item.type === 'review' ? 'review' : 'report',
        entityId: item.targetId,
        entityName: item.targetName,
        metadata: {
          itemId: item.id,
          resolutionNote: adminNote.trim(),
          type: item.type
        }
      });

      // Update local state
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'resolved' } : i));
      if (selectedItem?.id === item.id) {
        setSelectedItem(prev => prev ? { ...prev, status: 'resolved' } : null);
      }

      setActionSuccess('Item moderasi berhasil diselesaikan.');
      setAdminNote('');
    } catch (err) {
      console.error('Error resolving item:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (item: ModerationItem) => {
    setActionLoading(true);
    setActionSuccess('');
    try {
      if (item.type === 'report') {
        const docRef = doc(db, 'reports', item.id);
        await updateDoc(docRef, {
          status: 'dismissed',
          adminNotes: adminNote.trim() || 'Laporan diabaikan / False Positive.',
          updatedAt: new Date().toISOString()
        });
      } else if (item.type === 'review') {
        const docRef = doc(db, 'reviewReports', item.id);
        await updateDoc(docRef, {
          status: 'dismissed',
          updatedAt: new Date().toISOString()
        });
      }

      // Log to admin_audit_logs
      await logAdminAction({
        action: 'report_dismissed',
        entityType: item.type === 'review' ? 'review' : 'report',
        entityId: item.targetId,
        entityName: item.targetName,
        metadata: {
          itemId: item.id,
          reason: 'dismissed_by_admin',
          note: adminNote.trim()
        }
      });

      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'dismissed' } : i));
      if (selectedItem?.id === item.id) {
        setSelectedItem(prev => prev ? { ...prev, status: 'dismissed' } : null);
      }

      setActionSuccess('Item moderasi telah diabaikan (Dismissed).');
      setAdminNote('');
    } catch (err) {
      console.error('Error dismissing item:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuarantineApp = async (appId: string, appName: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengkarantina aplikasi "${appName}"? Status aplikasi akan diubah menjadi Draft/Problem.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, {
        status: 'draft',
        healthStatus: 'problem',
        securityStatus: 'suspicious',
        updatedAt: new Date().toISOString()
      });

      await logAdminAction({
        action: 'app_archived',
        entityType: 'application',
        entityId: appId,
        entityName: appName,
        metadata: { reason: 'quarantined_via_moderation_hub' }
      });

      setActionSuccess(`Aplikasi ${appName} berhasil dikarantina.`);
      if (onRefreshApps) onRefreshApps();
    } catch (err) {
      console.error('Error quarantining app:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'reports' && item.type === 'report') ||
      (activeTab === 'reviews' && item.type === 'review') ||
      (activeTab === 'security' && item.type === 'security_warning');

    const matchesStatus = 
      statusFilter === 'all' || item.status === statusFilter;

    const matchesSearch = 
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reportedBy && item.reportedBy.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesStatus && matchesSearch;
  });

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const reportsCount = items.filter(i => i.type === 'report' && i.status === 'pending').length;
  const reviewsCount = items.filter(i => i.type === 'review' && i.status === 'pending').length;
  const securityCount = items.filter(i => i.type === 'security_warning' && i.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600/10 via-amber-600/10 to-blue-600/10 border border-red-500/20 dark:border-red-500/30 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-2xl shadow-md">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Pusat Moderasi & Keamanan Terpadu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Agregasi laporan pengguna, ulasan komunitas bermasalah, dan audit peringatan keamanan APK real-time.
              </p>
            </div>
          </div>

          <button
            onClick={loadAllModerationItems}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Antrean</span>
          </button>
        </div>

        {/* Quick KPI stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] font-bold text-slate-500">Antrean Aktif</div>
            <div className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">{pendingCount} Item</div>
          </div>
          <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] font-bold text-slate-500">Laporan Kendala</div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{reportsCount} Terbuka</div>
          </div>
          <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] font-bold text-slate-500">Ulasan Flagged</div>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{reviewsCount} Kasus</div>
          </div>
          <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] font-bold text-slate-500">Peringatan APK</div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{securityCount} Peringatan</div>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="p-1 hover:bg-emerald-500/20 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Filter & Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of items */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-4 rounded-3xl space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'reports', label: `Laporan (${reportsCount})` },
                  { id: 'reviews', label: `Ulasan (${reviewsCount})` },
                  { id: 'security', label: `Keamanan (${securityCount})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      activeTab === tab.id
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="pending">Perlu Tindakan (Pending)</option>
                <option value="resolved">Terselesaikan (Resolved)</option>
                <option value="dismissed">Diabaikan (Dismissed)</option>
                <option value="all">Semua Status</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan judul, nama aplikasi, atau keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>

          {/* List items */}
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl">
              <RefreshCw className="h-8 w-8 text-red-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-semibold">Memuat data agregasi moderasi...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl">
              <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Tidak ada antrean moderasi</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Semua laporan dan peringatan telah diselesaikan atau tidak ada item yang cocok dengan filter saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setActionSuccess('');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-500/40 shadow-sm'
                        : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-xl mt-0.5 ${
                          item.type === 'security_warning'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : item.type === 'review'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {item.type === 'security_warning' ? (
                            <ShieldAlert className="h-4 w-4" />
                          ) : item.type === 'review' ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              item.severity === 'critical'
                                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                : item.severity === 'high'
                                ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                            }`}>
                              {item.severity}
                            </span>
                          </div>

                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.subtitle}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1.5 line-clamp-2">
                            {item.details}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : item.status === 'dismissed'
                            ? 'bg-slate-200 dark:bg-white/10 text-slate-500'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse'
                        }`}>
                          {item.status === 'resolved' ? 'Selesai' : item.status === 'dismissed' ? 'Diabaikan' : 'Pending'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Resolution Panel */}
        <div className="lg:col-span-5">
          {selectedItem ? (
            <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-6 shadow-sm sticky top-6">
              
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
                <div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    selectedItem.type === 'security_warning'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : selectedItem.type === 'review'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {selectedItem.type === 'security_warning' ? 'Audit Keamanan APK' : selectedItem.type === 'review' ? 'Moderasi Ulasan' : 'Laporan Pengguna'}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                    {selectedItem.title}
                  </h3>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    Target: <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedItem.targetName}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Details box */}
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Deskripsi Masalah / Muatan
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-700 dark:text-slate-300 font-medium leading-relaxed border border-slate-100 dark:border-white/5">
                    {selectedItem.details}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 font-bold block">Pelapor / Sumber</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">
                      {selectedItem.reportedBy || 'Anonim'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] text-slate-400 font-bold block">Waktu Laporan</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">
                      {new Date(selectedItem.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Direct App Link if available */}
                {selectedItem.targetSlug && onNavigateToApp && (
                  <button
                    onClick={() => onNavigateToApp(selectedItem.targetSlug!)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    <span>Buka Halaman Aplikasi Publik</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Admin Note Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Catatan Moderator / Penyelesaian
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Masukkan catatan tindakan yang diambil..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleResolve(selectedItem)}
                    disabled={actionLoading}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    <span>Selesaikan (Resolve)</span>
                  </button>

                  <button
                    onClick={() => handleDismiss(selectedItem)}
                    disabled={actionLoading}
                    className="w-full py-2.5 px-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    <span>Abaikan (Dismiss)</span>
                  </button>
                </div>

                {/* Harsh Action: Quarantine / Takedown if applicable */}
                {selectedItem.type === 'security_warning' || selectedItem.type === 'report' ? (
                  <button
                    onClick={() => handleQuarantineApp(selectedItem.targetId, selectedItem.targetName)}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Karantina / Sembunyikan Aplikasi Dari Publik</span>
                  </button>
                ) : null}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center space-y-3">
              <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit mx-auto text-slate-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Pilih Item Moderasi</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Klik salah satu laporan atau peringatan keamanan di sebelah kiri untuk melihat rincian dan melakukan verifikasi status.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
