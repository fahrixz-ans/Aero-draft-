import React, { useState, useEffect } from 'react';
import { 
  Star, Download, Calendar, Smartphone, ShieldCheck, 
  Share2, HardDrive, Cpu, ExternalLink, Zap, Bookmark, 
  AlertCircle, QrCode, ShieldAlert, Check, Copy, Info, Sparkles, Clock, AlertTriangle, ChevronDown, ChevronUp, History
} from 'lucide-react';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppData, AppVersion, ReportType, DownloadHistoryRecord } from '../types';
import BackButton from './navigation/BackButton';
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
import DownloadSelectorModal from './DownloadSelectorModal';
import AppExpandableSections from './AppExpandableSections';
import AdBanner from './AdBanner';
import QRCode from 'qrcode';
import { calculateAppBadges } from '../utils/badges';
import { trackEvent, recordUserInteraction } from '../services';
import { getSimilarAppsRecommendations, ScoredApp } from '../services/recommendations';
import RecommendationShelf from './recommendations/RecommendationShelf';
import { recordRecentlyViewed, recordDownloadHistory } from '../services/userService';
import AppTrustIndicators from './AppTrustIndicators';

import { developerToSlug } from '../utils/developerUtils';
import { categoryToSlug } from '../utils/categoryUtils';
import { useLanguage } from '../context/LanguageContext';

interface AppDetailProps {
  app: AppData;
  relatedApps: AppData[];
  allApps?: AppData[];
  onNavigate: (view: string, slug?: string) => void;
  onBack?: () => void;
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
  onBack,
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
  const { t, language } = useLanguage();
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
  const [downloadSelectorOpen, setDownloadSelectorOpen] = useState(false);

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

  // 17. Disarankan untuk anda (2-row horizontal scroll)
  const suggestedApps = (allApps && allApps.length > 0 ? allApps : relatedApps)
    .filter(a => a.id !== app.id)
    .slice(0, 12);

  // 18. Aplikasi lain untuk dicoba (1-row horizontal scroll)
  const otherAppsToTry = (allApps && allApps.length > 0 ? allApps : relatedApps)
    .filter(a => a.category !== app.category && a.id !== app.id)
    .slice(0, 10);

  // 19. Aplikasi serupa
  const similarAppsList = (relatedApps && relatedApps.length > 0 ? relatedApps : allApps)
    .filter(a => a.id !== app.id)
    .slice(0, 8);

  // 20. Popularitas (Real Database metrics)
  const popular30Days = [...(allApps || [])]
    .sort((a, b) => {
      const bDl = typeof b.downloads === 'number' ? b.downloads : parseInt(String(b.downloads).replace(/[^0-9]/g, '') || '0', 10);
      const aDl = typeof a.downloads === 'number' ? a.downloads : parseInt(String(a.downloads).replace(/[^0-9]/g, '') || '0', 10);
      return bDl - aDl;
    })
    .slice(0, 6);

  const popular7Days = [...(allApps || [])]
    .sort((a, b) => (Number(b.popular) - Number(a.popular)) || ((b.ratingAverage || b.rating || 0) - (a.ratingAverage || a.rating || 0)))
    .slice(0, 6);

  const popular24Hours = [...(allApps || [])]
    .sort((a, b) => (b.ratingAverage || b.rating || 0) - (a.ratingAverage || a.rating || 0))
    .slice(0, 6);

  const lastUpdateApps = [...(allApps || [])]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 6);

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

      {/* Top Back Action Button */}
      <div className="flex items-center">
        <BackButton
          onBack={() => {
            if (onBack) {
              onBack();
            } else if (window.history && window.history.length > 1) {
              window.history.back();
            } else {
              onNavigate('apps');
            }
          }}
          label={t('common.back', 'Kembali')}
          showText={true}
        />
      </div>

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
            onTriggerDownload={() => setDownloadSelectorOpen(true)}
            onNavigateDeveloper={(slug) => onNavigate('developer-detail', slug)}
            onNavigateCategory={(slug) => onNavigate('category-detail', slug)}
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500 fill-blue-500/10" />
                  <span>{t('app.whatsNew', 'Yang Baru')}</span>
                </h3>
                <button 
                  onClick={() => onNavigate('detailapps', app.slug)}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {t('app.aboutAppBtn', 'TENTANG APLIKASI')} →
                </button>
              </div>
              <p className="text-xs text-slate-500">{t('app.lastUpdated', 'Terakhir di update')}: {new Date(app.updatedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-black/35 p-4 rounded-xl border border-slate-100 dark:border-white/5 line-clamp-3">
                {app.whatsNew}
              </p>
            </div>
          )}

          {/* 7. TENTANG APLIKASI */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => onNavigate('detailapps', app.slug)}
                className="group text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
              >
                <span>{t('app.aboutThisApp', 'Tentang aplikasi ini')}</span>
                <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium line-clamp-4">
              {app.description}
            </p>

            {/* 8. TAGS / BADGES */}
            {app.tags && app.tags.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => onNavigate('search-results', tag)}
                      className="px-3 py-1 bg-slate-100 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 15. VERSI APLIKASI */}
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Versi Aplikasi</span>
              </h3>
              <button
                onClick={() => setDownloadSelectorOpen(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Lihat Semua Versi →
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-xl border border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-black uppercase">
                    Versi Saat Ini
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">v{app.version}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(app.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Ukuran download: <span className="font-semibold text-slate-700 dark:text-slate-300">{app.size || '30 MB'}</span>
              </div>
              {app.whatsNew && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Apa yang baru:</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {app.whatsNew}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setDownloadSelectorOpen(true)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors text-center cursor-pointer"
            >
              Lihat Semua Versi ({versionHistory.length > 0 ? versionHistory.length : 1} Versi Tersedia)
            </button>
          </div>

          {/* 16. VERSI LAIN DARI APLIKASI */}
          {versionHistory.length > 1 && (
            <div className="space-y-4">
              <AdBanner slot="feed-inline" />
              <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Versi lain dari aplikasi ini:
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {versionHistory.filter(v => v.versionName !== app.version).slice(0, 4).map((ver) => (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersionForDetail(ver)}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{app.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">v{ver.versionName}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Unduh</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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

          {/* Download Selector Modal */}
          <DownloadSelectorModal
            isOpen={downloadSelectorOpen}
            onClose={() => setDownloadSelectorOpen(false)}
            app={app}
            versions={versionHistory.length > 0 ? versionHistory : [{
              id: 'current',
              versionName: app.version,
              fileSize: app.size,
              apkFileUrl: app.downloadUrl || app.apkFileUrl
            } as any]}
            onDownloadVersion={(ver) => {
              setDownloadSelectorOpen(false);
              triggerVersionDownload(ver);
            }}
          />

          {/* Expandable Sections */}
          <AppExpandableSections app={app} />

          {/* USER RATING & REVIEWS SECTION */}
          <RatingReviewSection
            app={app}
            currentUser={currentUser}
            onNavigate={onNavigate}
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

      {/* 17. DISARANKAN UNTUK ANDA */}
      {suggestedApps.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5" id="disarankan-untuk-anda">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Disarankan untuk anda
            </h3>
          </div>

          <div className="grid grid-rows-2 grid-flow-col auto-cols-[200px] sm:auto-cols-[220px] gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {suggestedApps.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectRelated(item.slug || item.id)}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl flex items-center gap-3 hover:border-blue-500/50 hover:shadow-sm cursor-pointer transition-all group"
              >
                <img
                  src={item.iconUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    {item.size || '35 MB'}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-1">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span>{(item.ratingAverage || item.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 18. APLIKASI LAIN UNTUK DICOBA */}
      {otherAppsToTry.length > 0 && (
        <div className="space-y-4 pt-4" id="aplikasi-lain-untuk-dicoba">
          <AdBanner slot="feed-inline" />
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('all')}
              className="group flex items-center gap-2 text-left cursor-pointer"
            >
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                <span>Aplikasi lain untuk di coba</span>
                <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
              </h3>
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {otherAppsToTry.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectRelated(item.slug || item.id)}
                className="flex-none w-52 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl hover:border-blue-500/50 hover:shadow-sm cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.category}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 19. APLIKASI SERUPA */}
      {similarAppsList.length > 0 && (
        <div className="space-y-4 pt-4" id="aplikasi-serupa">
          <AdBanner slot="feed-inline" />
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('category-detail', categoryToSlug(app.category))}
              className="group flex items-center gap-2 text-left cursor-pointer"
            >
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-2">
                <span>Aplikasi serupa</span>
                <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
              </h3>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {similarAppsList.slice(0, 4).map((rel) => (
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
      )}

      {/* 20. POPULARITAS */}
      <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5" id="popularitas-section">
        {/* Popular in last 30 days */}
        {popular30Days.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Popular in last 30 days
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {popular30Days.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectRelated(item.slug || item.id)}
                  className="flex-none w-36 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl hover:border-blue-500/50 cursor-pointer text-center group transition-all"
                >
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl mx-auto object-cover mb-2 group-hover:scale-105 transition-transform shadow-xs"
                  />
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.downloads || '10K+'} unduhan</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <AdBanner slot="feed-inline" />

        {/* Popular in last 7 days */}
        {popular7Days.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Popular in last 7 days
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {popular7Days.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectRelated(item.slug || item.id)}
                  className="flex-none w-36 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl hover:border-blue-500/50 cursor-pointer text-center group transition-all"
                >
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl mx-auto object-cover mb-2 group-hover:scale-105 transition-transform shadow-xs"
                  />
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <AdBanner slot="feed-inline" />

        {/* Popular in last 24 hour */}
        {popular24Hours.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Popular in last 24 hour
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {popular24Hours.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectRelated(item.slug || item.id)}
                  className="flex-none w-36 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl hover:border-blue-500/50 cursor-pointer text-center group transition-all"
                >
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl mx-auto object-cover mb-2 group-hover:scale-105 transition-transform shadow-xs"
                  />
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-amber-500 font-bold mt-0.5">★ {(item.ratingAverage || item.rating || 0).toFixed(1)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <AdBanner slot="feed-inline" />

        {/* Last update */}
        {lastUpdateApps.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Last update
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {lastUpdateApps.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectRelated(item.slug || item.id)}
                  className="flex-none w-36 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl hover:border-blue-500/50 cursor-pointer text-center group transition-all"
                >
                  <img
                    src={item.iconUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl mx-auto object-cover mb-2 group-hover:scale-105 transition-transform shadow-xs"
                  />
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(item.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <AdBanner slot="feed-inline" />

        {/* Discovery more button */}
        <div className="pt-2 text-center">
          <button
            onClick={() => onNavigate('all')}
            className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Discovery More
          </button>
        </div>
      </div>

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
