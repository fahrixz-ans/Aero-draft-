import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, ShieldCheck, Download, Star, ArrowLeft, 
  ChevronRight, ChevronLeft, Globe, CheckCircle2, Layers,
  Sparkles, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AppData, DeveloperProfile } from '../../types';
import Breadcrumb from '../Breadcrumb';
import FollowSocialSection from '../FollowSocialSection';
import LoadingSkeleton from '../LoadingSkeleton';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
  slugToDeveloperName, 
  developerToSlug
} from '../../utils/developerUtils';

interface DeveloperDetailViewProps {
  developerSlug: string;
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onNavigate: (view: string, slug?: string) => void;
  onBack: () => void;
}

/**
 * Reusable Horizontal Shelf for Developer's Apps
 * Displays: [APP] [APP] [APP] [APP] →
 * Name, Rating ★, Category
 */
interface AppHorizontalShelfProps {
  items: AppData[];
  onSelectApp: (slug: string) => void;
}

function AppHorizontalShelf({ items, onSelectApp }: AppHorizontalShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth'
    });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative group/shelf">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Scroll ke kiri"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Scroll ke kanan"
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-start gap-3.5 sm:gap-4 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-none py-1 px-0.5 select-none"
        style={{ scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((app) => (
          <div
            key={app.id}
            onClick={() => onSelectApp(app.slug || app.id)}
            style={{ scrollSnapAlign: 'start' }}
            className="flex flex-col items-center sm:items-start shrink-0 w-24 sm:w-28 cursor-pointer group/item text-center sm:text-left transition-transform active:scale-95"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs group-hover/item:scale-105 group-hover/item:shadow-md transition-all shrink-0">
              <img
                src={app.iconUrl || app.icon}
                alt={app.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Crect width="128" height="128" rx="28" fill="%231e293b"/%3E%3Ctext x="64" y="72" font-size="28" fill="%2394a3b8" text-anchor="middle" font-family="sans-serif"%3EAPK%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            <h3 className="w-full text-xs font-semibold text-slate-900 dark:text-white truncate mt-2 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
              {app.name}
            </h3>

            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span>{(app.ratingAverage || app.rating || 4.5).toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeveloperDetailView({
  developerSlug,
  apps,
  onSelectApp,
  onDownloadApp,
  onNavigate,
  onBack
}: DeveloperDetailViewProps) {
  const { t } = useLanguage();
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [isExpandedRecent, setIsExpandedRecent] = useState<boolean>(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const mediaScrollRef = useRef<HTMLDivElement>(null);

  // Resolve canonical developer name from slug
  const developerName = useMemo(() => {
    if (developerProfile?.name) return developerProfile.name;
    return slugToDeveloperName(developerSlug, apps);
  }, [developerSlug, apps, developerProfile]);

  // Fetch real developer profile from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const cleanSlug = developerSlug.toLowerCase().trim();
        const q = query(collection(db, 'developers'), where('slug', '==', cleanSlug));
        const snap = await getDocs(q);

        if (!snap.empty && isMounted) {
          const docData = snap.docs[0];
          setDeveloperProfile({ id: docData.id, ...docData.data() } as DeveloperProfile);
        } else {
          // Check if any app has matching developer identifier
          const matchingApp = apps.find(app => {
            const devName = app.developerName || app.developer || '';
            return developerToSlug(devName) === cleanSlug;
          });
          const rawApp = matchingApp as any;
          if (rawApp && rawApp.developerId && isMounted) {
            const docSnap = await getDoc(doc(db, 'developers', rawApp.developerId));
            if (docSnap.exists() && isMounted) {
              setDeveloperProfile({ id: docSnap.id, ...docSnap.data() } as DeveloperProfile);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch developer profile from Firestore:', err);
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [developerSlug, apps]);

  // Filter apps strictly belonging to this developer
  const developerApps = useMemo(() => {
    const cleanSlug = developerSlug.toLowerCase().trim();
    return apps.filter(app => {
      const devName = app.developerName || app.developer || '';
      return developerToSlug(devName) === cleanSlug ||
        devName.toLowerCase().trim() === developerName.toLowerCase().trim();
    });
  }, [apps, developerSlug, developerName]);

  // Determine EXACTLY 1 Featured Application according to blueprint rules:
  // 1. featured flag on app
  // 2. top rated/downloaded app from developer
  const featuredApp = useMemo(() => {
    if (developerApps.length === 0) return null;
    const flagged = developerApps.find(a => (a as any).featured || (a as any).isFeatured);
    if (flagged) return flagged;
    // Fallback to highest rated app
    return [...developerApps].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0];
  }, [developerApps]);

  // Extract preview media screenshots for the single featured app
  const featuredMedia = useMemo(() => {
    if (!featuredApp) return [];
    const mediaList: string[] = [];
    if (Array.isArray(featuredApp.screenshots) && featuredApp.screenshots.length > 0) {
      mediaList.push(...featuredApp.screenshots);
    } else if (Array.isArray((featuredApp as any).media) && (featuredApp as any).media.length > 0) {
      mediaList.push(...(featuredApp as any).media);
    } else if (featuredApp.iconUrl || featuredApp.icon) {
      mediaList.push(featuredApp.iconUrl || featuredApp.icon);
    }
    return mediaList;
  }, [featuredApp]);

  // Handle preview media scroll sync for indicator
  const handleMediaScroll = () => {
    if (!mediaScrollRef.current || featuredMedia.length === 0) return;
    const { scrollLeft, clientWidth } = mediaScrollRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveMediaIndex(Math.min(index, featuredMedia.length - 1));
  };

  const scrollMedia = (direction: 'left' | 'right') => {
    if (!mediaScrollRef.current) return;
    const { clientWidth } = mediaScrollRef.current;
    mediaScrollRef.current.scrollBy({
      left: direction === 'left' ? -clientWidth : clientWidth,
      behavior: 'smooth'
    });
  };

  // Recent apps list sorted by timestamp
  const recentApps = useMemo(() => {
    return [...developerApps].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.releaseDate || (a as any).createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.releaseDate || (b as any).createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [developerApps]);

  const displayedRecentApps = isExpandedRecent ? recentApps : recentApps.slice(0, 5);

  // Check if developer exists or has matching apps
  const isDeveloperValid = developerProfile !== null || developerApps.length > 0 || slugToDeveloperName(developerSlug, apps) !== 'Developer';

  if (loadingProfile) {
    return <LoadingSkeleton type="developer-detail" />;
  }

  // Not found state
  if (!isDeveloperValid) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in" id="developer-not-found">
        <Breadcrumb
          paths={[
            { label: 'Beranda', view: 'home' },
            { label: 'Developer', view: 'all-developers' },
            { label: 'Tidak Ditemukan' }
          ]}
          onNavigate={onNavigate}
        />

        <div className="p-12 text-center bg-white dark:bg-[#131924] rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Developer Tidak Ditemukan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Profil pengembang dengan URL <code className="text-blue-600">#/dev-prof/{developerSlug}</code> tidak terdaftar dalam direktori resmi Mod Station.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('all-developers')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Daftar Developer</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Secondary text underneath developer name
  const secondaryText = developerProfile?.secondaryName || developerProfile?.handle || `@${developerToSlug(developerName)}`;
  const isVerified = developerProfile?.verified ?? developerApps.some(a => a.verifiedSource || a.officialUrl);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in font-sans" id="developer-profile-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        paths={[
          { label: 'Beranda', view: 'home' },
          { label: 'Developer', view: 'all-developers' },
          { label: developerName }
        ]}
        onNavigate={onNavigate}
      />

      {/* TOP BAR: Kembalian Context-Aware */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali</span>
        </button>
      </div>

      {/* COVER BANNER */}
      <div className="w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-sm relative bg-slate-100 dark:bg-[#181f2c]">
        {developerProfile?.coverUrl ? (
          <img
            src={developerProfile.coverUrl}
            alt={`Cover ${developerName}`}
            className="w-full h-40 sm:h-56 md:h-64 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          /* Neutral Fallback UI Backdrop */
          <div className="w-full h-40 sm:h-56 md:h-64 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-slate-950 dark:via-[#131924] dark:to-slate-900 flex items-center justify-between px-8 sm:px-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400/80">
                Official Developer Page
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white/90 tracking-tight">
                {developerName}
              </h2>
            </div>
            <Building2 className="w-24 h-24 text-white/5 shrink-0 hidden sm:block" />
          </div>
        )}
      </div>

      {/* DEVELOPER IDENTITY SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 -mt-10 sm:-mt-14 px-4 sm:px-6 relative z-10">
        {/* Logo Avatar */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white dark:bg-[#161c27] border-4 border-white dark:border-[#0b0f17] shadow-lg flex items-center justify-center font-black text-3xl sm:text-4xl text-slate-800 dark:text-white shrink-0 overflow-hidden select-none">
          {developerProfile?.logoUrl || developerProfile?.avatarUrl ? (
            <img
              src={developerProfile.logoUrl || developerProfile.avatarUrl}
              alt={developerName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{developerName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Name and Muted Secondary Text */}
        <div className="space-y-1 pt-2 sm:pt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {developerName}
            </h1>
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium opacity-70">
            {secondaryText}
          </p>
        </div>
      </div>

      {/* DEVELOPER HAS 0 APPS: CLEAN EMPTY STATE */}
      {developerApps.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#131924] rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Belum Ada Aplikasi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Developer {developerName} belum memiliki aplikasi publik yang diterbitkan di Mod Station.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION: APLIKASI UNGGULAN (EXACTLY 1 FEATURED APP) */}
          {featuredApp && (
            <section className="space-y-4" id="featured-app-section">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Aplikasi Unggulan</span>
                </h2>
              </div>

              <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
                {/* PREVIEW MEDIA CAROUSEL (SWIPEABLE SCREENSHOTS FOR THIS 1 FEATURED APP ONLY) */}
                {featuredMedia.length > 0 && (
                  <div className="relative group/media">
                    {/* Media scroll container */}
                    <div
                      ref={mediaScrollRef}
                      onScroll={handleMediaScroll}
                      className="flex gap-3 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-none rounded-2xl select-none py-1"
                      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
                    >
                      {featuredMedia.map((mediaUrl, idx) => (
                        <div
                          key={idx}
                          style={{ scrollSnapAlign: 'center' }}
                          className="shrink-0 w-full sm:w-80 h-48 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/5 relative"
                        >
                          <img
                            src={mediaUrl}
                            alt={`Preview ${featuredApp.name} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"%3E%3Crect width="320" height="200" fill="%231e293b"/%3E%3Ctext x="160" y="105" font-size="20" fill="%2394a3b8" text-anchor="middle" font-family="sans-serif"%3EPreview Media%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Media Controls for Desktop */}
                    {featuredMedia.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => scrollMedia('left')}
                          aria-label="Previous preview"
                          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white transition-all cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollMedia('right')}
                          aria-label="Next preview"
                          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white transition-all cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Pagination Dots */}
                        <div className="flex items-center justify-center gap-1.5 pt-2">
                          {featuredMedia.map((_, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`h-1.5 rounded-full transition-all ${
                                dotIdx === activeMediaIndex
                                  ? 'w-5 bg-blue-600 dark:bg-blue-400'
                                  : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* FEATURED APP IDENTITY & ACTION */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs shrink-0">
                      <img
                        src={featuredApp.iconUrl || featuredApp.icon}
                        alt={featuredApp.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                        {featuredApp.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {featuredApp.category}
                      </p>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{(featuredApp.ratingAverage || featuredApp.rating || 4.5).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectApp(featuredApp.slug || featuredApp.id)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Detail Aplikasi</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* SECTION: SEMUA APLIKASI > (HORIZONTAL SHELF) */}
          <section className="space-y-4" id="all-developer-apps-shelf">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsExpandedRecent(!isExpandedRecent)}
                className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
              >
                <span>Semua aplikasi</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <AppHorizontalShelf
              items={developerApps}
              onSelectApp={onSelectApp}
            />
          </section>

          {/* SECTION: TERBARU DARI DEVELOPER (VERTICAL COMPACT LIST) */}
          <section className="space-y-4" id="recent-developer-apps-list">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Terbaru Dari Developer</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              {displayedRecentApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onSelectApp(app.slug || app.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={app.iconUrl || app.icon}
                        alt={app.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {app.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {(app.ratingAverage || app.rating || 4.5).toFixed(1)}
                        </span>
                        <span>•</span>
                        <span className="truncate">{app.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-1">
                      Detail
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* "Lihat semua" Button */}
            {recentApps.length > 5 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsExpandedRecent(!isExpandedRecent)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                >
                  <span>{isExpandedRecent ? 'Tampilkan Lebih Sedikit' : 'Lihat semua'}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isExpandedRecent ? '-rotate-90' : 'rotate-90'}`} />
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Follow Social Section */}
      <FollowSocialSection />
    </div>
  );
}
