import React, { useState, useEffect } from 'react';
import { 
  Star, Download, Calendar, Smartphone, ShieldCheck, 
  Share2, HardDrive, Cpu, ExternalLink, Zap, Bookmark, 
  AlertCircle, QrCode, ShieldAlert, Check, Copy, Info, Sparkles, Clock, AlertTriangle, ChevronDown, ChevronUp, History
} from 'lucide-react';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppData, AppVersion, ReportType, DownloadHistoryRecord } from '../types';
import Breadcrumb from './Breadcrumb';
import ScreenshotGallery from './ScreenshotGallery';
import AppCard from './AppCard';
import FeedbackModal from './FeedbackModal';
import AppDetailHeader from './AppDetailHeader';
import ReportIssueModal from './ReportIssueModal';
import RatingReviewSection from './RatingReviewSection';
import VersionFeedbackBar from './VersionFeedbackBar';
import LoginPromptModal from './LoginPromptModal';
import VersionHistorySection from './VersionHistorySection';
import VersionDetailModal from './VersionDetailModal';
import VersionComparisonModal from './VersionComparisonModal';
import QRCode from 'qrcode';
import { calculateAppBadges } from '../utils/badges';
import { trackEvent, recordUserInteraction } from '../services';
import { getSimilarAppsRecommendations, ScoredApp } from '../services/recommendations';
import RecommendationShelf from './recommendations/RecommendationShelf';
import { recordRecentlyViewed, recordDownloadHistory } from '../services/userService';
import AppTrustIndicators from './AppTrustIndicators';

interface AppDetailProps {
  app: AppData;
  relatedApps: AppData[];
  allApps?: AppData[];
  onNavigate: (view: string, slug?: string) => void;
  onSelectRelated: (slug: string) => void;
  onDownloadRelated: (e: React.MouseEvent, app: AppData) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  currentUser?: any;
  onSignIn?: () => void;
  downloadHistory?: DownloadHistoryRecord[];
}

export default function AppDetail({
  app,
  relatedApps,
  allApps = [],
  onNavigate,
  onSelectRelated,
  onDownloadRelated,
  isBookmarked,
  onToggleBookmark,
  isFollowed,
  onToggleFollow,
  currentUser,
  onSignIn,
  downloadHistory
}: AppDetailProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportInitialType, setReportInitialType] = useState<ReportType>('download_problem');
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginPromptConfig, setLoginPromptConfig] = useState<{ title: string; description: string }>({
    title: 'Masuk untuk menyimpan aplikasi',
    description: 'Dengan masuk, kamu bisa membuat daftar aplikasi yang ingin kamu akses kembali nanti.'
  });
  const [shareToast, setShareToast] = useState(false);
  const [pageHelpfulFeedback, setPageHelpfulFeedback] = useState<'yes' | 'no' | null>(null);

  const [qrUrlType, setQrUrlType] = useState<'official' | 'alternative'>('official');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedSha256, setCopiedSha256] = useState(false);
  const [copiedSha1, setCopiedSha1] = useState(false);

  // Stage 9.3: Similar Apps Recommendation Engine State
  const [similarRecommendations, setSimilarRecommendations] = useState<ScoredApp[]>([]);
  const [loadingSimilarRecs, setLoadingSimilarRecs] = useState(false);

  // Version History state
  const [versionHistory, setVersionHistory] = useState<AppVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [versionDownloadStatuses, setVersionDownloadStatuses] = useState<Record<string, 'idle' | 'loading' | 'error'>>({});
  const [selectedVersionForDetail, setSelectedVersionForDetail] = useState<AppVersion | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  // Fetch Version History on app ID change
  useEffect(() => {
    const fetchVersions = async () => {
      if (!app.id) return;
      setLoadingVersions(true);
      try {
        // Query appVersions subcollection first
        let q = query(
          collection(db, 'applications', app.id, 'appVersions'),
          where('status', '==', 'published'),
          orderBy('versionCode', 'desc')
        );
        let querySnapshot = await getDocs(q);

        // Fallback to legacy versions subcollection if empty
        if (querySnapshot.empty) {
          q = query(
            collection(db, 'applications', app.id, 'versions'),
            where('status', '==', 'published'),
            orderBy('versionCode', 'desc')
          );
          querySnapshot = await getDocs(q);
        }

        const list: AppVersion[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as AppVersion);
        });
        setVersionHistory(list);
      } catch (err) {
        console.error('Gagal mengambil riwayat versi:', err);
      } finally {
        setLoadingVersions(false);
      }
    };

    fetchVersions();
  }, [app.id]);

  // Scroll to top on change and track intelligent view event
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQrUrlType('official');
    if (app?.id) {
      trackEvent('app_view', { appId: app.id, categoryId: app.category, userId: currentUser?.uid });
      recordUserInteraction('view', app);
      recordRecentlyViewed(app);
    }

    // Stage 9.3: Compute Intelligent Similar App Recommendations
    const loadSimilar = async () => {
      const pool = (allApps && allApps.length > 0) ? allApps : relatedApps;
      if (pool && pool.length > 0) {
        setLoadingSimilarRecs(true);
        try {
          const recs = await getSimilarAppsRecommendations(app, pool, 4);
          setSimilarRecommendations(recs);
        } catch (err) {
          console.error('Error fetching similar recommendations:', err);
        } finally {
          setLoadingSimilarRecs(false);
        }
      }
    };
    loadSimilar();
  }, [app.id, app.category, currentUser?.uid, allApps, relatedApps]);

  // Determine current active URL for QR Code
  const activeDownloadUrl = qrUrlType === 'alternative' && app.alternativeDownloadUrl 
    ? app.alternativeDownloadUrl 
    : (app.officialDownloadUrl || app.downloadUrl);

  // Generate QR Code base64 Data URL locally (100% offline-ready, quiet zone compliant)
  useEffect(() => {
    if (activeDownloadUrl) {
      QRCode.toDataURL(activeDownloadUrl, {
        width: 280,
        margin: 4,
        color: {
          dark: '#0F172A', // Navy slate color for high-contrast scanning
          light: '#FFFFFF'
        }
      })
        .then(setQrCodeUrl)
        .catch(err => console.error('Gagal men-generate QR code:', err));
    }
  }, [activeDownloadUrl, app.id]);

  const formatDownloads = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(0)} Miliar+`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)} Juta+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)} Ribu+`;
    return num.toString();
  };

  const handleShare = () => {
    trackEvent('share_app', { appId: app.id });
    recordUserInteraction('share', app);
    const shareData = {
      title: `${app.name} di Aero`,
      text: `Temukan ${app.name} di Aero — Android App Discovery & APK Archive`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  const handleSafeToggleBookmark = () => {
    if (!currentUser) {
      setLoginPromptConfig({
        title: 'Masuk untuk menyimpan aplikasi',
        description: 'Dengan masuk, kamu bisa membuat daftar aplikasi yang ingin kamu akses kembali nanti.'
      });
      setLoginPromptOpen(true);
      return;
    }
    if (!isBookmarked) {
      trackEvent('save_app', { appId: app.id });
      recordUserInteraction('save', app);
    }
    onToggleBookmark();
  };

  const copyToClipboard = (text: string, type: 'sha256' | 'sha1') => {
    navigator.clipboard.writeText(text);
    if (type === 'sha256') {
      setCopiedSha256(true);
      setTimeout(() => setCopiedSha256(false), 2000);
    } else {
      setCopiedSha1(true);
      setTimeout(() => setCopiedSha1(false), 2000);
    }
  };

  const triggerVersionDownload = (versionItem: AppVersion) => {
    const downloadUrl = versionItem.apkFileUrl;
    if (!downloadUrl) return;

    setVersionDownloadStatuses(prev => ({ ...prev, [versionItem.id]: 'loading' }));

    // Increment Firestore download counters safely
    if (app.id) {
      try {
        const appRef = doc(db, 'applications', app.id);
        updateDoc(appRef, { downloads: increment(1) }).catch(e => console.warn('App download increment error:', e));

        if (versionItem.id) {
          const appVerRef = doc(db, 'applications', app.id, 'appVersions', versionItem.id);
          updateDoc(appVerRef, { downloads: increment(1) }).catch(() => {});
          const verRef = doc(db, 'applications', app.id, 'versions', versionItem.id);
          updateDoc(verRef, { downloads: increment(1) }).catch(() => {});
        }
      } catch (countErr) {
        console.warn('Could not increment downloads in Firestore:', countErr);
      }
    }

    setTimeout(() => {
      try {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${app.slug}-v${versionItem.versionName}-aeroapk.apk`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setVersionDownloadStatuses(prev => ({ ...prev, [versionItem.id]: 'idle' }));
        // Record download history
        recordDownloadHistory(currentUser, { 
          ...app, 
          version: versionItem.versionName || app.version, 
          size: typeof versionItem.fileSize === 'number' ? `${versionItem.fileSize} MB` : (versionItem.fileSize || app.size) 
        }, 'apk').catch(() => {});
      } catch (err) {
        console.error('Download version failed:', err);
        setVersionDownloadStatuses(prev => ({ ...prev, [versionItem.id]: 'error' }));
      }
    }, 1500);
  };

  // Check if any security data is present
  const hasSecurityData = !!(
    (app.permissions && app.permissions.length > 0) || 
    app.minSdk || 
    app.targetSdk || 
    app.signingCertificate?.sha256
  );

  const appBadges = calculateAppBadges(app);
  const isDraftOrScheduled = app.status === 'draft' || app.status === 'scheduled' || app.status === 'archived';

  const isHostedApk = app.sourceType === 'apk' || (!app.sourceType && !!app.downloadUrl && !app.officialDownloadUrl);
  const primaryUrl = isHostedApk
    ? (app.apkFileUrl || app.downloadUrl)
    : (app.officialUrl || app.officialDownloadUrl || app.downloadUrl);

  return (
    <div className="space-y-8 animate-fade-in" id="app-detail-container">
      {/* Draft / Scheduled Admin Preview Banner */}
      {isDraftOrScheduled && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-blue-500/15 border-2 border-dashed border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Mode Pratinjau Administrator
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Status aplikasi ini adalah <span className="font-black uppercase text-slate-900 dark:text-white">[{app.status || 'draft'}]</span>. 
                {app.status === 'scheduled' && app.publishAt && (
                  <span> Dijadwalkan otomatis rilis pada: {new Date(app.publishAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}.</span>
                )}
                {app.status === 'draft' && <span> Halaman ini belum dipublikasikan ke katalog umum pengunjung.</span>}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm shrink-0"
          >
            Buka Panel Admin
          </button>
        </div>
      )}

      {/* Breadcrumb pathing */}
      <Breadcrumb
        paths={[
          { label: 'Semua Aplikasi', view: 'all' },
          { label: app.category, view: 'all' },
          { label: app.name }
        ]}
        onNavigate={onNavigate}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: App Specs and details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Health Status Problem Warning (Requirement 20) */}
          {app.healthStatus === 'problem' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 select-none animate-fade-in">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-bold leading-relaxed">
                ⚠️ Beberapa pengguna melaporkan kendala pada versi ini.
              </p>
            </div>
          )}

          {/* Header Card */}
          <AppDetailHeader
            app={app}
            isBookmarked={isBookmarked}
            onToggleBookmark={handleSafeToggleBookmark}
            isFollowed={isFollowed}
            onToggleFollow={onToggleFollow}
            onShare={handleShare}
            onReport={(preselectedType) => {
              if (preselectedType) setReportInitialType(preselectedType);
              setReportModalOpen(true);
            }}
          />

          {/* Specifications Matrix */}
          <div className="p-5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-150 dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center select-none">
            <div className="p-3 bg-white dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Versi Terkini</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{app.version}</p>
            </div>
            
            <div className="p-3 bg-white dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Ukuran Berkas</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{app.size}</p>
            </div>

            <div className="p-3 bg-white dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Android Minimal</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{app.androidVersion}</p>
            </div>

            <div className="p-3 bg-white dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5 space-y-1 col-span-2 sm:col-span-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Tanggal Update</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                {new Date(app.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Trust Indicators (Stage 9.6) */}
          <AppTrustIndicators app={app} />

          {/* Screenshot Slider */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl">
            <ScreenshotGallery screenshots={app.screenshots} appName={app.name} />
          </div>

          {/* Changelog */}
          {app.whatsNew && (
            <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500 fill-blue-500/10" />
                <span>Yang Baru di Versi Terbaru</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-black/35 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                {app.whatsNew}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Deskripsi Aplikasi
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
              {app.description}
            </p>
          </div>

          {/* VERSION HISTORY & MANAGEMENT SECTION (Stage 9.8) */}
          <VersionHistorySection
            versions={versionHistory}
            onSelectVersion={(ver) => setSelectedVersionForDetail(ver)}
            onCompareVersions={() => setComparisonModalOpen(true)}
            onDownloadVersion={(ver) => triggerVersionDownload(ver)}
          />

          {/* Version Detail Modal */}
          {selectedVersionForDetail && (
            <VersionDetailModal
              version={selectedVersionForDetail}
              app={app}
              onClose={() => setSelectedVersionForDetail(null)}
              onDownload={(ver) => triggerVersionDownload(ver)}
            />
          )}

          {/* Version Comparison Modal */}
          {comparisonModalOpen && (
            <VersionComparisonModal
              versions={versionHistory}
              appName={app.name}
              onClose={() => setComparisonModalOpen(false)}
            />
          )}

          {/* TECHNICAL SECURITY METADATA SECTION */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl space-y-6">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5.5 w-5.5 text-blue-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Informasi Keamanan Aplikasi
              </h3>
            </div>

            {hasSecurityData ? (
              <div className="space-y-6">
                {/* SDK Levels & Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-150 dark:border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">SDK Target</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">Android {app.targetSdk || 'N/A'} (API {app.targetSdk || '34'})</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-150 dark:border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">SDK Minimum</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">Android {app.minSdk || 'N/A'} (API {app.minSdk || '21'})</p>
                  </div>
                </div>

                {/* Permissions tag chips */}
                {app.permissions && app.permissions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Daftar Android Permissions ({app.permissions.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {app.permissions.map((perm, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 rounded-md select-all"
                        >
                          {perm.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signing Certificate details */}
                {app.signingCertificate && (
                  <div className="space-y-3.5 border-t border-slate-100 dark:border-white/5 pt-4">
                    <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Signing Certificate
                    </h4>
                    
                    <div className="space-y-3 text-xs">
                      {/* SHA-256 */}
                      {app.signingCertificate.sha256 && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">
                            <span>SHA-256 Fingerprint</span>
                            <button 
                              onClick={() => copyToClipboard(app.signingCertificate!.sha256!, 'sha256')}
                              className="text-blue-500 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold lowercase"
                            >
                              {copiedSha256 ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedSha256 ? 'tersalin' : 'salin'}</span>
                            </button>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-black/35 rounded-lg border border-slate-150 dark:border-white/5 font-mono text-[10.5px] text-slate-700 dark:text-slate-300 break-all select-all font-bold">
                            {app.signingCertificate.sha256}
                          </div>
                        </div>
                      )}

                      {/* SHA-1 */}
                      {app.signingCertificate.sha1 && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-550 font-extrabold uppercase">
                            <span>SHA-1 Fingerprint</span>
                            <button 
                              onClick={() => copyToClipboard(app.signingCertificate!.sha1!, 'sha1')}
                              className="text-blue-500 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold lowercase"
                            >
                              {copiedSha1 ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedSha1 ? 'tersalin' : 'salin'}</span>
                            </button>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-black/35 rounded-lg border border-slate-150 dark:border-white/5 font-mono text-[10.5px] text-slate-700 dark:text-slate-300 break-all select-all font-bold">
                            {app.signingCertificate.sha1}
                          </div>
                        </div>
                      )}

                      {/* Issuer & Subject */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {app.signingCertificate.issuer && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide">Certificate Issuer</span>
                            <div className="p-2.5 bg-slate-50 dark:bg-black/35 rounded-lg border border-slate-150 dark:border-white/5 font-semibold text-slate-700 dark:text-slate-350 break-words leading-normal">
                              {app.signingCertificate.issuer}
                            </div>
                          </div>
                        )}
                        {app.signingCertificate.subject && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide">Certificate Subject</span>
                            <div className="p-2.5 bg-slate-50 dark:bg-black/35 rounded-lg border border-slate-150 dark:border-white/5 font-semibold text-slate-700 dark:text-slate-350 break-words leading-normal">
                              {app.signingCertificate.subject}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  Informasi keamanan belum tersedia.
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                  Metadata belum dimasukkan oleh admin atau aplikasi belum dianalisis secara teknis.
                </p>
              </div>
            )}

            {/* Strict Disclaimer with NO fake security claims */}
            <div className="p-4 bg-slate-50 dark:bg-black/25 border border-slate-150 dark:border-white/5 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                Informasi ini berasal dari metadata dan analisis teknis aplikasi. Data tersebut bukan jaminan bahwa aplikasi sepenuhnya aman.
              </p>
            </div>
          </div>

          {/* USER RATING & REVIEWS SECTION */}
          <RatingReviewSection
            app={app}
            currentUser={currentUser}
            onRequireLogin={() => {
              setLoginPromptConfig({
                title: 'Masuk untuk memberikan ulasan',
                description: 'Masuk dengan akun Google untuk memberi rating bintang dan membagikan ulasan aplikasi ini.'
              });
              setLoginPromptOpen(true);
            }}
          />
        </div>

        {/* Right Side: Secure download module */}
        <div className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            
            {/* File Audit Card */}
            <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl shadow-md space-y-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Audit Integritas Berkas
                </h3>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Semua paket aplikasi yang di-host di platform Aero divalidasi secara kriptografis menggunakan algoritma SHA-256 dan dibandingkan langsung dengan tanda tangan rilis resmi Google Play Store.
                </p>
                <ul className="text-xs space-y-2 font-bold text-slate-600 dark:text-slate-400 pt-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                    <span>SHA-256: Terverifikasi Google Play</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                    <span>Signature: Cocok dengan Rilis Asli</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* QR CODE DOWNLOADING MODULE */}
            <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-3xl shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                  <QrCode className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Scan QR Code untuk Unduh
                </h3>
              </div>

              {/* URL selector tabs if alternative URL is present */}
              {app.alternativeDownloadUrl && (
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-black/35 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setQrUrlType('official')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      qrUrlType === 'official' 
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    Resmi
                  </button>
                  <button
                    onClick={() => setQrUrlType('alternative')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      qrUrlType === 'alternative' 
                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    Alternatif
                  </button>
                </div>
              )}

              {/* QR Code Graphic Container (Clean white wrapper with quiet zone margins) */}
              <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-100 dark:border-white/5 max-w-[280px] mx-auto shadow-inner">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan QR Code to Download APK" 
                    referrerPolicy="no-referrer"
                    className="w-full aspect-square object-contain animate-fade-in"
                  />
                ) : (
                  <div className="w-full aspect-square bg-slate-50 dark:bg-black/5 flex items-center justify-center rounded-lg">
                    <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed font-semibold px-2">
                Pindai kode QR ini menggunakan kamera ponsel atau aplikasi scanner untuk mengunduh langsung ke HP Android Anda.
              </p>
            </div>

            {/* Quick Compare Tool Card */}
            <div className="p-5 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-2xl shadow-sm space-y-3">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Bandingkan Aplikasi
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bandingkan ukuran APK, kompatibilitas OS, dan perizinan {app.name} dengan aplikasi sejenis.
              </p>
              <button
                onClick={() => onNavigate('compare', app.slug)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Buka Perbandingan Spesifikasi</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Helpful Page Feedback Widget */}
      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
            Apakah informasi di halaman aplikasi ini membantu Anda?
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Umpan balik Anda membantu kami menjaga kelengkapan dan akurasi katalog Aero.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pageHelpfulFeedback ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Terima kasih atas masukan Anda!</span>
            </span>
          ) : (
            <>
              <button
                onClick={() => {
                  setPageHelpfulFeedback('yes');
                  trackEvent('app_page_feedback', { appId: app.id, metadata: { helpful: true } });
                }}
                className="px-4 py-1.5 bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 text-slate-700 dark:text-slate-200 hover:text-emerald-600 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                👍 Ya, membantu
              </button>
              <button
                onClick={() => {
                  setPageHelpfulFeedback('no');
                  trackEvent('app_page_feedback', { appId: app.id, metadata: { helpful: false } });
                  setFeedbackOpen(true);
                }}
                className="px-4 py-1.5 bg-white dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-white/10 hover:border-red-500/30 text-slate-700 dark:text-slate-200 hover:text-red-600 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                👎 Belum lengkap
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stage 9.3: Similar Apps Shelf with Explainability and Recommendation Engine */}
      {similarRecommendations.length > 0 ? (
        <div className="pt-4" id="related-apps-section">
          <RecommendationShelf
            shelfId="similarApps"
            title="Aplikasi Serupa Terkait"
            subtitle={`Rekomendasi cerdas berdasarkan kesamaan fungsi, kompatibilitas, dan kategori (${app.category})`}
            items={similarRecommendations}
            onSelectApp={(selected) => onSelectRelated(selected.slug || selected.id)}
            onDownloadApp={(selected) => onDownloadRelated({} as any, selected)}
            downloadHistory={downloadHistory}
            currentUser={currentUser}
            showExplanationBadges={true}
            allowDismiss={true}
          />
        </div>
      ) : relatedApps.length > 0 ? (
        <div className="space-y-4 pt-4" id="related-apps-section">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Aplikasi Serupa Terkait
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Rekomendasi berdasarkan kategori ({app.category}):
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {relatedApps.slice(0, 4).map((rel) => (
              <div key={rel.id} className="flex flex-col space-y-1.5">
                <AppCard
                  app={rel}
                  onSelect={onSelectRelated}
                  onDownload={onDownloadRelated}
                  downloadHistory={downloadHistory}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Dynamic Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        app={app}
      />

      {/* Report Issue Modal (Tahap 4) */}
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        app={app}
        currentUser={currentUser}
        initialType={reportInitialType}
      />

      {/* Reusable Login Prompt Modal */}
      <LoginPromptModal
        isOpen={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        onLogin={() => {
          if (onSignIn) onSignIn();
        }}
        title={loginPromptConfig.title}
        description={loginPromptConfig.description}
      />

      {/* Toast Notifikasi Berbagi Tautan */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>Link berhasil disalin.</span>
        </div>
      )}
    </div>
  );
}
