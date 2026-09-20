import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Download, ShieldAlert, Users, Activity, 
  Plus, ShieldCheck, Clock, RefreshCw, CheckCircle2, 
  AlertTriangle, Layers, Database, ArrowRight, Eye, 
  TrendingUp, Star, ExternalLink, MessageSquare, Heart, 
  FileText, Check, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { AppData, AppReport, AdminAuditLog } from '../../types';
import { db } from '../../lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, limit as firestoreLimit, doc, updateDoc 
} from 'firebase/firestore';
import { subscribeAdminAuditLogs } from '../../services/admin/auditLogService';

interface AdminDashboardOverviewProps {
  onNavigateTab: (tab: string, slugOrId?: string) => void;
  onOpenNewAppForm: () => void;
  onNavigateToApp?: (slug: string) => void;
}

interface FirestoreFeedback {
  id: string;
  appId?: string;
  appName?: string;
  userEmail?: string;
  type?: string;
  message?: string;
  status?: 'new' | 'reviewed' | 'resolved' | string;
  createdAt?: any;
}

interface FirestoreDonation {
  id: string;
  amount?: number;
  status?: string;
  userDisplayName?: string;
}

export default function AdminDashboardOverview({
  onNavigateTab,
  onOpenNewAppForm,
  onNavigateToApp
}: AdminDashboardOverviewProps) {
  // Live State from Firestore
  const [apps, setApps] = useState<AppData[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FirestoreFeedback[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [donations, setDonations] = useState<FirestoreDonation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

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

    // 2. Live listener for feedback collection
    const unsubFeedback = onSnapshot(collection(db, 'feedback'), (snapshot) => {
      const fbList: FirestoreFeedback[] = [];
      snapshot.forEach((doc) => {
        fbList.push({ id: doc.id, ...doc.data() } as FirestoreFeedback);
      });
      setFeedbackItems(fbList);
    }, (err) => {
      console.warn('Feedback snapshot error:', err);
    });

    // 3. Live listener for reviews collection
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const revList: any[] = [];
      snapshot.forEach((doc) => {
        revList.push({ id: doc.id, ...doc.data() });
      });
      setReviews(revList);
    }, (err) => {
      console.warn('Reviews snapshot error:', err);
    });

    // 4. Live listener for subscribers
    const unsubSubscribers = onSnapshot(collection(db, 'subscribers'), (snapshot) => {
      setSubscribersCount(snapshot.size);
    }, (err) => {
      console.warn('Subscribers snapshot error:', err);
    });

    // 5. Live listener for donations
    const unsubDonations = onSnapshot(collection(db, 'donations'), (snapshot) => {
      const donList: FirestoreDonation[] = [];
      snapshot.forEach((doc) => {
        donList.push({ id: doc.id, ...doc.data() } as FirestoreDonation);
      });
      setDonations(donList);
    }, (err) => {
      console.warn('Donations snapshot error:', err);
    });

    // 6. Live listener for admin audit logs
    const unsubLogs = subscribeAdminAuditLogs((logs) => {
      setAuditLogs(logs.slice(0, 10));
      setLoading(false);
    }, 10);

    return () => {
      unsubApps();
      unsubFeedback();
      unsubReviews();
      unsubSubscribers();
      unsubDonations();
      unsubLogs();
    };
  }, []);

  // Quick action helper: resolve feedback
  const handleResolveFeedback = async (id: string) => {
    try {
      await updateDoc(doc(db, 'feedback', id), { status: 'resolved' });
      setActionSuccessMsg('Status laporan berhasil diperbarui menjadi Selesai.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Resolve feedback error:', err);
    }
  };

  // Quick action helper: publish draft app
  const handlePublishApp = async (id: string) => {
    try {
      await updateDoc(doc(db, 'applications', id), { 
        status: 'published',
        publishMode: 'immediate',
        updatedAt: new Date().toISOString().split('T')[0]
      });
      setActionSuccessMsg('Aplikasi berhasil diterbitkan ke publik.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Publish app error:', err);
    }
  };

  // Real Metric Calculations
  const publishedApps = apps.filter(a => (a.status || 'published') === 'published');
  const draftApps = apps.filter(a => a.status === 'draft');
  const scheduledApps = apps.filter(a => a.status === 'scheduled');
  const archivedApps = apps.filter(a => a.status === 'archived');

  const totalDownloads = publishedApps.reduce((sum, a) => sum + (Number(a.downloads) || 0), 0);

  const pendingFeedback = feedbackItems.filter(f => f.status === 'new' || f.status === 'pending' || !f.status);
  const resolvedFeedback = feedbackItems.filter(f => f.status === 'resolved');
  const reviewedFeedback = feedbackItems.filter(f => f.status === 'reviewed');

  const flaggedReviews = reviews.filter(r => r.flagged || r.status === 'flagged' || r.status === 'pending');
  const totalAttentionRequired = pendingFeedback.length + flaggedReviews.length + draftApps.length;

  const totalDonationAmount = donations
    .filter(d => d.status === 'paid' || d.status === 'completed')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Top Downloaded Apps (Sorted strictly by downloads descending)
  const topDownloadedApps = [...publishedApps]
    .sort((a, b) => (Number(b.downloads) || 0) - (Number(a.downloads) || 0))
    .slice(0, 5);

  // Latest Uploaded/Updated Apps
  const latestApps = [...apps]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.releaseDate || 0).getTime();
      const dateB = new Date(b.updatedAt || b.releaseDate || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 animate-fade-in">
        <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 text-blue-500 animate-spin">
          <RefreshCw className="h-8 w-8" />
        </div>
        <p className="text-xs font-black tracking-wide text-slate-500 dark:text-slate-400">
          MENGHUBUNGKAN DATA REAL-TIME FIRESTORE...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">

      {/* SUCCESS TOAST NOTIFICATION */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-[10px] uppercase font-black hover:underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* DASHBOARD HEADER TITLE & QUICK BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Owner Console Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Ringkasan performa platform, perhatian mendesak, analisis tiket support, dan audit trail dari Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Terakhir Disinkron</span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {lastSyncTime.toLocaleTimeString('id-ID')}
            </span>
          </div>
          <button
            onClick={onOpenNewAppForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/15 cursor-pointer transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Rilis Baru</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PLATFORM OVERVIEW (HEADER SUMMARY CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOTAL APPS */}
        <div 
          onClick={() => onNavigateTab('applications')}
          className="bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-5 space-y-3 hover:border-blue-500/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Aplikasi Rilis
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Smartphone className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {publishedApps.length}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[10.5px] font-bold text-slate-500">
              <span className="text-emerald-500">{publishedApps.length} Terbit</span>
              <span>•</span>
              <span className="text-amber-500">{draftApps.length} Draf</span>
              <span>•</span>
              <span className="text-blue-400">{scheduledApps.length} Jadwal</span>
            </div>
          </div>
        </div>

        {/* CARD 2: CUMULATIVE DOWNLOADS */}
        <div 
          onClick={() => onNavigateTab('analytics-downloads')}
          className="bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-5 space-y-3 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Unduhan Kumulatif
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Download className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalDownloads > 0 ? totalDownloads.toLocaleString('id-ID') : '0'}
            </div>
            <p className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              Berdasarkan akumulasi data aktual katalog Firestore
            </p>
          </div>
        </div>

        {/* CARD 3: ATTENTION REQUIRED TICKETS */}
        <div 
          onClick={() => onNavigateTab('moderation-queue')}
          className="bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-5 space-y-3 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Perhatian Mendesak
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{totalAttentionRequired}</span>
              {totalAttentionRequired > 0 && (
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 mt-2">
              {pendingFeedback.length} Laporan Baru + {flaggedReviews.length} Ulasan Flagged
            </p>
          </div>
        </div>

        {/* CARD 4: COMMUNITY & DONATIONS */}
        <div 
          onClick={() => onNavigateTab('donations')}
          className="bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-5 space-y-3 hover:border-purple-500/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Dukungan & Komunitas
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Heart className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalDonationAmount)}
            </div>
            <p className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400 mt-2">
              {subscribersCount} Newsletter Subscriber Terdaftar
            </p>
          </div>
        </div>

      </div>

      {/* SECTION 2 & 3: ATTENTION REQUIRED + SUPPORT ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 2: ATTENTION REQUIRED (LEFT 7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Perhatian Mendesak (Attention Required)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tiket bug, ulasan yang dilaporkan, atau draf rilis yang memerlukan tindakan cepat Owner.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('moderation-queue')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ATTENTION ITEMS LIST */}
          <div className="space-y-3">
            
            {/* Urgent Pending Feedback */}
            {pendingFeedback.length === 0 && draftApps.length === 0 && flaggedReviews.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-black/10 space-y-2">
                <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-black text-slate-800 dark:text-white">Semua Aman & Terkendali!</p>
                <p className="text-[11px] text-slate-500">Tidak ada tiket bug kritis, draf tertunda, atau ulasan bermasalah di Firestore.</p>
              </div>
            ) : (
              <>
                {/* 1. Unresolved Bug Reports */}
                {pendingFeedback.slice(0, 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          {item.type || 'Laporan Bug'}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {item.appName || 'Aplikasi Mod Station'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                        "{item.message || 'Tidak ada uraian pesan.'}"
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Dari: {item.userEmail || 'Pengguna Anonim'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onNavigateTab('moderation-queue')}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Tinjau
                      </button>
                      <button
                        onClick={() => handleResolveFeedback(item.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Selesaikan</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Draft Apps Pending Release */}
                {draftApps.slice(0, 2).map((app) => (
                  <div 
                    key={app.id} 
                    className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Draf Rilis
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {app.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">v{app.version || '1.0.0'}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Kategori: {app.category} • Developer: {app.developer}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onNavigateTab('applications')}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handlePublishApp(app.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs transition-colors"
                      >
                        Terbitkan Sekarang
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

          </div>
        </div>

        {/* SECTION 3: TICKET & SUPPORT ANALYTICS (RIGHT 5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Status Tiket & Support
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Distribusi laporan masalah dari pengguna.
                </p>
              </div>
            </div>
          </div>

          {/* TICKET STATUS DISTRIBUTION BARS */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-extrabold">
                <span className="text-amber-500">Baru / Pending</span>
                <span className="text-slate-900 dark:text-white font-mono">{pendingFeedback.length} tiket</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${feedbackItems.length > 0 ? (pendingFeedback.length / feedbackItems.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-extrabold">
                <span className="text-blue-500">Dalam Tinjauan</span>
                <span className="text-slate-900 dark:text-white font-mono">{reviewedFeedback.length} tiket</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${feedbackItems.length > 0 ? (reviewedFeedback.length / feedbackItems.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-extrabold">
                <span className="text-emerald-500">Selesai / Resolved</span>
                <span className="text-slate-900 dark:text-white font-mono">{resolvedFeedback.length} tiket</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${feedbackItems.length > 0 ? (resolvedFeedback.length / feedbackItems.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-slate-600 dark:text-slate-300">Total Tiket Masuk</span>
              <span className="text-slate-900 dark:text-white font-mono font-black">{feedbackItems.length}</span>
            </div>
            <button
              onClick={() => onNavigateTab('moderation-queue')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-xs font-black cursor-pointer transition-colors shadow-xs"
            >
              Buka Moderasi Workspace
            </button>
          </div>

        </div>

      </div>

      {/* SECTION 4: KEY METRICS & CATALOG SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TOP DOWNLOADED APPLICATIONS (LEFT 7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span>Aplikasi Paling Populer (Top Downloaded)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Peringkat aplikasi berdasarkan total akumulasi unduhan di Firestore.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('applications')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Kelola Semua
            </button>
          </div>

          <div className="space-y-2.5">
            {topDownloadedApps.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-slate-400">
                Belum ada aplikasi rilis yang diunduh.
              </div>
            ) : (
              topDownloadedApps.map((app, index) => (
                <div 
                  key={app.id}
                  className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      index === 0 ? 'bg-amber-500 text-white' : index === 1 ? 'bg-slate-300 text-slate-800' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                    }`}>
                      #{index + 1}
                    </span>

                    <img 
                      src={app.iconUrl || app.icon || '/assets/mod-station-logo.svg'} 
                      alt={app.name}
                      className="w-9 h-9 rounded-xl object-contain bg-slate-200 dark:bg-black/30 p-1 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {app.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold truncate">
                        {app.category} • {app.developer}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono block">
                        {(Number(app.downloads) || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[9.5px] font-extrabold text-emerald-500 flex items-center justify-end gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        <span>{app.rating || 4.5}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigateToApp ? onNavigateToApp(app.slug || app.id) : onNavigateTab('applications')}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer transition-colors"
                      title="Pratinjau Aplikasi"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LATEST UPLOADED / UPDATED APPS (RIGHT 5 COLS) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Rilis Terbaru</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Aplikasi yang baru diperbarui atau ditambahkan.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {latestApps.map((app) => (
              <div 
                key={app.id}
                className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={app.iconUrl || app.icon || '/assets/mod-station-logo.svg'} 
                    alt={app.name}
                    className="w-8 h-8 rounded-xl object-contain bg-slate-200 dark:bg-black/30 p-1 shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {app.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      v{app.version || '1.0.0'} • {app.updatedAt || app.releaseDate || 'Hari ini'}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                  app.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {app.status || 'published'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 5: AUDIT TRAIL & RECENT ADMIN ACTIVITY */}
      <div className="bg-white dark:bg-[#13161C] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Audit Trail & Riwayat Aktivitas Admin
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Alur log tindakan administrator aktual dari Firestore (`audit_logs`).
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400">
              Belum ada log aktivitas admin tercatat di Firestore.
            </div>
          ) : (
            auditLogs.map((log, idx) => (
              <div 
                key={log.id || idx}
                className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                    {log.action}
                  </span>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {log.entityName || log.entityId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Oleh: {log.userEmail || 'Admin Operator'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : 'Baru saja'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
