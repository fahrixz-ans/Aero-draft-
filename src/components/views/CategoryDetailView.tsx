import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Star, ChevronRight, ChevronLeft, ShieldCheck,
  Layers, Gamepad2, Users, Music, Camera, Film, MessageSquare,
  Wallet, GraduationCap, BookOpen, CloudSun, HeartPulse, Wrench,
  Cpu, Landmark, Globe, Smartphone, CheckSquare
} from 'lucide-react';
import { AppData } from '../../types';
import Breadcrumb from '../Breadcrumb';
import FollowSocialSection from '../FollowSocialSection';
import LoadingSkeleton from '../LoadingSkeleton';
import { 
  slugToCategoryName, 
  categoryToSlug, 
  appMatchesCategory 
} from '../../utils/categoryUtils';

interface CategoryDetailViewProps {
  categorySlug?: string;
  categoryName?: string;
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onNavigate: (view: string, slug?: string) => void;
  onBack: () => void;
}

// Icon mapper for Category SVG icon
const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('game')) return Gamepad2;
  if (lower.includes('sosial') || lower.includes('social') || lower.includes('kencan')) return Users;
  if (lower.includes('musik') || lower.includes('audio') || lower.includes('podcast') || lower.includes('radio')) return Music;
  if (lower.includes('foto') || lower.includes('kamera') || lower.includes('galeri')) return Camera;
  if (lower.includes('video') || lower.includes('streaming') || lower.includes('film') || lower.includes('tv')) return Film;
  if (lower.includes('komunikasi') || lower.includes('chat') || lower.includes('pesan')) return MessageSquare;
  if (lower.includes('keuangan') || lower.includes('bank') || lower.includes('investasi') || lower.includes('dompet')) return Wallet;
  if (lower.includes('pendidikan') || lower.includes('belajar') || lower.includes('kamus')) return GraduationCap;
  if (lower.includes('buku') || lower.includes('komik') || lower.includes('ensiklopedia') || lower.includes('referensi')) return BookOpen;
  if (lower.includes('cuaca')) return CloudSun;
  if (lower.includes('kesehatan') || lower.includes('medis') || lower.includes('kebugaran')) return HeartPulse;
  if (lower.includes('alat') || lower.includes('kalkulator') || lower.includes('sistem')) return Wrench;
  if (lower.includes('keamanan') || lower.includes('vpn')) return ShieldCheck;
  if (lower.includes('ai') || lower.includes('asisten') || lower.includes('developer') || lower.includes('program')) return Cpu;
  if (lower.includes('pemerintahan')) return Landmark;
  if (lower.includes('peta') || lower.includes('navigasi') || lower.includes('transportasi') || lower.includes('wisata')) return Globe;
  if (lower.includes('smartwatch') || lower.includes('jam') || lower.includes('auto')) return Smartphone;
  if (lower.includes('produktivitas') || lower.includes('catatan') || lower.includes('dokumen') || lower.includes('kalender')) return CheckSquare;
  return Layers;
};

/**
 * Reusable Single-Row Horizontal Shelf for Category Detail (Populer)
 * Displays: [APP] [APP] [APP] [APP] →
 * Mobile touch swipeable, desktop drag & arrow buttons
 */
interface PopularHorizontalShelfProps {
  items: AppData[];
  onSelectApp: (slug: string) => void;
}

function PopularHorizontalShelf({ items, onSelectApp }: PopularHorizontalShelfProps) {
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
    <div className="relative group/popular">
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
        className="flex items-start gap-4 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-none py-1 px-0.5 select-none"
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

/**
 * Vertical List Component for "Semua aplikasi" Section
 * Shows Icon, App Name, Developer, Rating, Size, Version
 */
interface AllCategoryAppsListProps {
  items: AppData[];
  onSelectApp: (slug: string) => void;
}

function AllCategoryAppsList({ items, onSelectApp }: AllCategoryAppsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const DEFAULT_COUNT = 6;
  const displayItems = isExpanded ? items : items.slice(0, DEFAULT_COUNT);

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        {displayItems.map((app) => {
          const ratingValue = (app.ratingAverage || app.rating || 4.5).toFixed(1);
          const devName = app.developerName || app.developer || 'Mod Station';

          return (
            <div
              key={app.id}
              onClick={() => onSelectApp(app.slug || app.id)}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <img
                    src={app.iconUrl || app.icon}
                    alt={app.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {app.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {devName} • <span className="text-amber-500 font-semibold">★{ratingValue}</span>
                    {app.size ? ` • ${app.size}` : ''}
                    {app.version ? ` • v${app.version}` : ''}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-1">
                  Detail
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {items.length > DEFAULT_COUNT && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Lihat lainnya ^' : 'Lihat lainnya ˅'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function CategoryDetailView({
  categorySlug,
  categoryName: initialCategoryName,
  apps,
  onSelectApp,
  onDownloadApp,
  onNavigate,
  onBack
}: CategoryDetailViewProps) {
  const [loading, setLoading] = useState(true);

  // 1. Resolve canonical category name from slug or prop
  const categoryName = useMemo(() => {
    if (categorySlug) {
      const resolved = slugToCategoryName(categorySlug, apps);
      if (resolved) return resolved;
    }
    if (initialCategoryName) {
      const slug = categoryToSlug(initialCategoryName);
      const resolved = slugToCategoryName(slug, apps);
      if (resolved) return resolved;
      return initialCategoryName;
    }
    return null;
  }, [categorySlug, initialCategoryName, apps]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [categorySlug, initialCategoryName]);

  // 2. Filter apps in this category
  const categoryApps = useMemo(() => {
    if (!categoryName) return [];
    return apps.filter(app => appMatchesCategory(app, categoryName));
  }, [apps, categoryName]);

  // Popular apps in category sorted by downloads / rating
  const popularApps = useMemo(() => {
    return [...categoryApps].sort((a, b) => {
      const popA = (a.downloads || 0) + ((a.ratingAverage || a.rating || 0) * 100);
      const popB = (b.downloads || 0) + ((b.ratingAverage || b.rating || 0) * 100);
      return popB - popA;
    });
  }, [categoryApps]);

  // Loading skeleton
  if (loading) {
    return <LoadingSkeleton type="category-detail" />;
  }

  // Not Found State if category slug is invalid
  if (!categoryName) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in" id="category-not-found">
        <Breadcrumb
          paths={[
            { label: 'Beranda', view: 'home' },
            { label: 'Kategori', view: 'all-categories' },
            { label: 'Tidak Ditemukan' }
          ]}
          onNavigate={onNavigate}
        />

        <div className="p-12 text-center bg-white dark:bg-[#131924] rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Kategori Tidak Ditemukan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kategori dengan URL <code className="text-blue-600">#/category/{categorySlug || ''}</code> tidak terdaftar dalam direktori resmi Mod Station.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('all-categories')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Buka Direktori Kategori</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(categoryName);
  const categoryDescription = `Temukan aplikasi kategori ${categoryName}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in font-sans" id="category-detail-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        paths={[
          { label: 'Beranda', view: 'home' },
          { label: 'Kategori', view: 'all-categories' },
          { label: categoryName }
        ]}
        onNavigate={onNavigate}
      />

      {/* Back button */}
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

      {/* CATEGORY IDENTITY HEADER */}
      <div className="flex items-center gap-4 sm:gap-5 p-6 bg-white dark:bg-[#131924] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <CategoryIcon className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {categoryName}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {categoryDescription}
          </p>
        </div>
      </div>

      {/* IF CATEGORY HAS 0 APPS: CLEAN EMPTY STATE */}
      {categoryApps.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#131924] rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Belum Ada Aplikasi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Belum ada aplikasi yang tersedia dalam kategori ini.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('all-categories')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
            >
              Jelajahi Kategori Lainnya
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION 1: POPULER */}
          <section className="space-y-4" id="popular-category-shelf">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Populer</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>

            <PopularHorizontalShelf
              items={popularApps}
              onSelectApp={onSelectApp}
            />
          </section>

          {/* SECTION 2: SEMUA APLIKASI */}
          <section className="space-y-4" id="all-category-apps-list">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Semua aplikasi</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>

            <AllCategoryAppsList
              items={categoryApps}
              onSelectApp={onSelectApp}
            />
          </section>
        </div>
      )}

      {/* Follow Social Section */}
      <FollowSocialSection />
    </div>
  );
}
