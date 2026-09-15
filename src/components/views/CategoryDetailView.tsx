import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Star, ChevronDown, ChevronUp, ChevronRight, 
  ChevronLeft, Sparkles, Layers, ShieldCheck, ArrowRight
} from 'lucide-react';
import { AppData } from '../../types';
import Breadcrumb from '../Breadcrumb';
import FollowSocialSection from '../FollowSocialSection';
import { 
  slugToCategoryName, 
  categoryToSlug, 
  appMatchesCategory, 
  getAppCategories,
  getRelatedAppsForCategory
} from '../../utils/categoryUtils';
import { getForYouRecommendations } from '../../services/recommendations/recommendationService';

interface CategoryDetailViewProps {
  categorySlug?: string;
  categoryName?: string;
  apps: AppData[];
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onNavigate: (view: string, slug?: string) => void;
  onBack: () => void;
}

/**
 * Reusable single-row horizontal carousel for Category Detail layout
 * - Horizontal single-line
 * - Mobile swipe friendly
 * - Does not break items to second line
 * - Smooth scroll with clean hidden scrollbars
 */
interface HorizontalCarouselProps {
  items: AppData[];
  onSelectApp: (slug: string) => void;
  emptyMessage?: string;
  id?: string;
}

function HorizontalCarousel({ items, onSelectApp, emptyMessage, id }: HorizontalCarouselProps) {
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

  if (items.length === 0) {
    return (
      <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {emptyMessage || 'Belum ada aplikasi yang tersedia pada bagian ini.'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative group/carousel" id={id}>
      {/* Scroll controls for desktop */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          aria-label="Scroll ke kiri"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          aria-label="Scroll ke kanan"
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Single-row horizontal container */}
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
            {/* Logo */}
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

            {/* Nama App */}
            <h3 className="w-full text-xs font-semibold text-slate-900 dark:text-white truncate mt-2 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
              {app.name}
            </h3>

            {/* Ukuran */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
              {app.size || '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Reusable vertical list component for Section 2 and Section 5
 * - Default 4 items
 * - In-place expand/collapse ("Lihat lainnya ˅" / "Lihat lainnya ^")
 * - Does not change views
 */
interface VerticalListProps {
  items: AppData[];
  onSelectApp: (slug: string) => void;
  emptyMessage?: string;
  id?: string;
}

function VerticalList({ items, onSelectApp, emptyMessage, id }: VerticalListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const DEFAULT_COUNT = 4;
  const displayItems = isExpanded ? items : items.slice(0, DEFAULT_COUNT);

  if (items.length === 0) {
    return (
      <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {emptyMessage || 'Belum ada aplikasi yang tersedia pada daftar ini.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5" id={id}>
      <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        {displayItems.map((app) => {
          const categories = getAppCategories(app);
          const categoriesText = categories.slice(0, 3).join(' • ');
          const ratingValue = (app.ratingAverage || app.rating || 0).toFixed(1);

          return (
            <div
              key={app.id}
              onClick={() => onSelectApp(app.slug || app.id)}
              className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Logo */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
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

                {/* Details */}
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {app.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {categoriesText}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {ratingValue}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-400 dark:text-slate-500">
                      {app.size || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
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

      {/* Expand / Collapse Button */}
      {items.length > DEFAULT_COUNT && (
        <div className="pt-1 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
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
  const [recommendedApps, setRecommendedApps] = useState<AppData[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'popularity' | 'size'>('newest');

  // 1. Resolve canonical category name from slug or name prop
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

  // 2. Filter apps that match this category via multi-label system
  const categoryApps = useMemo(() => {
    if (!categoryName) return [];
    return apps.filter(app => appMatchesCategory(app, categoryName));
  }, [apps, categoryName]);

  // Helper to sort apps
  const sortApps = (appsToSort: AppData[]) => {
    return [...appsToSort].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.updatedAt || b.releaseDate || 0).getTime() - new Date(a.updatedAt || a.releaseDate || 0).getTime();
      } else if (sortBy === 'popularity') {
        return (b.downloads || 0) - (a.downloads || 0);
      } else if (sortBy === 'size') {
        const sizeA = parseFloat(a.size || '0');
        const sizeB = parseFloat(b.size || '0');
        return sizeB - sizeA;
      }
      return 0;
    });
  };

  // 3. Section 1: Berdasarkan Aktivitas Terbaru (Horizontal Carousel)
  const recentActivityApps = useMemo(() => {
    return sortApps(categoryApps);
  }, [categoryApps, sortBy]);

  // 4. Section 2: Aplikasi Gratis Terpopuler (Vertical List, top 12)
  const generalPopularApps = useMemo(() => {
    return sortApps(categoryApps);
  }, [categoryApps, sortBy]);

  // 5. Section 3: Disarankan Untuk Anda (Real Recommendation Engine)
  useEffect(() => {
    let isMounted = true;
    async function loadRecommendations() {
      try {
        const scored = await getForYouRecommendations(apps, undefined, 8);
        if (isMounted) {
          const recs = scored.map(s => s.app);
          // Prioritize category affinity in recommendations
          if (categoryName) {
            recs.sort((a, b) => {
              const aMatches = appMatchesCategory(a, categoryName) ? 1 : 0;
              const bMatches = appMatchesCategory(b, categoryName) ? 1 : 0;
              return bMatches - aMatches;
            });
          }
          setRecommendedApps(recs);
        }
      } catch (err) {
        if (isMounted) {
          // Fallback to high rating apps in current catalog
          setRecommendedApps(apps.filter(a => (a.ratingAverage || a.rating || 0) >= 4.5).slice(0, 8));
        }
      }
    }
    loadRecommendations();
    return () => { isMounted = false; };
  }, [apps, categoryName]);

  // 6. Section 4: Yang berkaitan dengan {Kategori} (Horizontal Carousel)
  const relatedApps = useMemo(() => {
    if (!categoryName) return [];
    return sortApps(getRelatedAppsForCategory(categoryName, apps, categoryApps));
  }, [categoryName, apps, categoryApps, sortBy]);

  // 7. Section 5: Aplikasi {Kategori} Gratis Terpopuler (Vertical List)
  const categorySpecificPopularApps = useMemo(() => {
    return sortApps(categoryApps);
  }, [categoryApps, sortBy]);

  // 8. Section 6: Fitur {Kategori} (Horizontal Carousel)
  const featuredCategoryApps = useMemo(() => {
    return sortApps(categoryApps);
  }, [categoryApps, sortBy]);

  // Smooth scroll to Section 1 if user clicks "Berdasarkan aktivitas terbaru →"
  const scrollToRecent = () => {
    const section = document.getElementById('section-1-aktivitas-terbaru');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // If slug is invalid or category not recognized in 100 list
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
              Kategori dengan URL <code className="text-blue-600">#/detail{categorySlug || ''}</code> tidak terdaftar dalam direktori resmi Mod Station.
            </p>
          </div>
          <button
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

  // If category is valid but has 0 apps
  const hasApps = categoryApps.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 animate-fade-in" id="category-detail-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        paths={[
          { label: 'Beranda', view: 'home' },
          { label: 'Kategori', view: 'all-categories' },
          { label: categoryName }
        ]}
        onNavigate={onNavigate}
      />

      {/* HEADER: "← Nama Kategori" & "Berdasarkan aktivitas terbaru →" */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <button
          onClick={onBack}
          aria-label={`Kembali dari kategori ${categoryName}`}
          className="flex items-center gap-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group self-start"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 group-hover:-translate-x-1 transition-transform" />
          <span>{categoryName}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={scrollToRecent}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Berdasarkan aktivitas terbaru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'popularity' | 'size')}
              aria-label="Urutkan aplikasi"
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="popularity">Popularity</option>
              <option value="size">Size</option>
            </select>
          </div>
        </div>
      </header>

      {/* When category has no apps: clean empty state */}
      {!hasApps ? (
        <div className="p-12 text-center bg-white dark:bg-[#131924] rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Belum Ada Aplikasi di Kategori {categoryName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aplikasi untuk kategori {categoryName} sedang dalam proses verifikasi dan penambahan katalog oleh tim Mod Station.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('all-categories')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
            >
              Jelajahi Kategori Lainnya
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Ke Beranda
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* SECTION 1 — BERDASARKAN AKTIVITAS TERBARU */}
          <section className="space-y-4" id="section-1-aktivitas-terbaru">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Berdasarkan Aktivitas Terbaru</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>
            <HorizontalCarousel
              items={recentActivityApps}
              onSelectApp={onSelectApp}
              emptyMessage={`Belum ada rilis terbaru di kategori ${categoryName}.`}
              id="carousel-recent-activity"
            />
          </section>

          {/* SECTION 2 — APLIKASI GRATIS TERPOPULER */}
          <section className="space-y-4" id="section-2-aplikasi-gratis-terpopuler">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Aplikasi Gratis Terpopuler</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>
            <VerticalList
              items={generalPopularApps}
              onSelectApp={onSelectApp}
              emptyMessage={`Belum ada aplikasi populer di kategori ${categoryName}.`}
              id="list-general-popular"
            />
          </section>

          {/* SECTION 3 — DISARANKAN UNTUK ANDA */}
          <section className="space-y-4" id="section-3-disarankan-untuk-anda">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Disarankan Untuk Anda</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>
            <HorizontalCarousel
              items={recommendedApps}
              onSelectApp={onSelectApp}
              emptyMessage="Belum ada data rekomendasi yang valid untuk ditampilkan saat ini."
              id="carousel-recommended"
            />
          </section>

          {/* SECTION 4 — SECTION BERKAITAN */}
          <section className="space-y-4" id="section-4-berkaitan">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Yang berkaitan dengan {categoryName}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>
            <HorizontalCarousel
              items={relatedApps}
              onSelectApp={onSelectApp}
              emptyMessage={`Belum ada aplikasi yang berkaitan dengan ${categoryName}.`}
              id="carousel-related"
            />
          </section>

          {/* SECTION 5 — APLIKASI {KATEGORI} GRATIS TERPOPULER */}
          <section className="space-y-4" id="section-5-kategori-populer">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Aplikasi {categoryName} Gratis Terpopuler</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>
            <VerticalList
              items={categorySpecificPopularApps}
              onSelectApp={onSelectApp}
              emptyMessage={`Belum ada aplikasi populer khusus kategori ${categoryName}.`}
              id="list-category-specific-popular"
            />
          </section>

          {/* SECTION 6 — FITUR {KATEGORI} */}
          <section className="space-y-4" id="section-6-fitur-kategori">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Fitur {categoryName}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </h2>
            </div>
            <HorizontalCarousel
              items={featuredCategoryApps}
              onSelectApp={onSelectApp}
              emptyMessage={`Belum ada fitur aplikasi terpilih untuk kategori ${categoryName}.`}
              id="carousel-featured-category"
            />
          </section>
        </div>
      )}

      {/* Follow Social Section */}
      <FollowSocialSection />
    </div>
  );
}
