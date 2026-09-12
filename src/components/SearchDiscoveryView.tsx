import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Flame, Sparkles, Gamepad2, Clock, X, 
  ArrowRight, Star, ChevronDown, Check,
  TrendingUp, Layers, SlidersHorizontal, Grid, List, RefreshCw
} from 'lucide-react';
import { AppData, DownloadHistoryRecord } from '../types';
import { executeSearchPipeline } from '../services/search/searchEngine';
import { 
  trackSearchEvent, 
  fetchUserRecentSearches, 
  deleteRecentSearch, 
  clearAllRecentSearches,
  getAggregatedSearchIntelligence 
} from '../services/search/searchIntelligence';

interface SearchDiscoveryViewProps {
  apps?: AppData[];
  view?: 'search' | 'search-type' | 'search-results' | 'search-expand' | 'search-expand-fully';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
  downloadHistory?: DownloadHistoryRecord[];
  onBookmarkToggle?: (appId: string) => void;
  bookmarkedAppIds?: string[];
  userId?: string | null;
  onNavigate?: (view: string, slug?: string) => void;
  onBack?: () => void;
}

export default function SearchDiscoveryView({
  apps = [],
  view = 'search',
  searchQuery = '',
  onSearchChange,
  onSelectApp,
  onDownloadApp,
  downloadHistory = [],
  onBookmarkToggle,
  bookmarkedAppIds = [],
  userId = null,
  onNavigate,
  onBack
}: SearchDiscoveryViewProps) {
  // Queries
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  
  // Expanded card state (screenshots)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Filters State
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'latest' | 'popular' | 'rating'>('popular');

  // Search intelligence / suggestions state
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<{ query: string; growth: number }[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<{ query: string; count: number }[]>([]);

  // input element ref for typing page
  const textInputRef = useRef<HTMLInputElement>(null);

  // Load Recent & Trending keywords on mount
  useEffect(() => {
    fetchUserRecentSearches(userId || 'guest_user').then(list => setRecentSearches(list));
    getAggregatedSearchIntelligence(apps).then(summary => {
      if (summary.trendingSearches.length > 0) {
        setTrendingKeywords(summary.trendingSearches.map(t => ({ query: t.query, growth: t.growthRate })));
      } else {
        const trend = apps
          .filter(a => a.featured || (a.rating && a.rating >= 4.5))
          .slice(0, 4)
          .map(a => ({ query: a.name, growth: 25 }));
        setTrendingKeywords(trend);
      }
      if (summary.popularSearches.length > 0) {
        setPopularKeywords(summary.popularSearches.map(p => ({ query: p.query, count: p.searchCount })));
      } else {
        const pop = apps.slice(0, 6).map(a => ({ query: a.name, count: a.downloads || 500 }));
        setPopularKeywords(pop);
      }
    });
  }, [userId, apps]);

  // Sync prop changes
  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  // Focus input on mount if we are in search-type stage
  useEffect(() => {
    if (view === 'search-type' && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [view]);

  // Build filter parameters for search engine
  const filterParams = useMemo(() => {
    return {
      type: 'all' as const,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      rating: selectedRating !== 'all' ? selectedRating : undefined,
      sort: selectedSort
    };
  }, [selectedCategory, selectedRating, selectedSort]);

  // Run Search Pipeline on current query
  const searchResult = useMemo(() => {
    return executeSearchPipeline(
      searchQuery,
      apps,
      filterParams,
      selectedSort
    );
  }, [searchQuery, apps, filterParams, selectedSort]);

  const { results, suggestions, timingMs } = searchResult;

  // Track search results shown
  useEffect(() => {
    if (searchQuery.trim().length > 0 && view === 'search-results') {
      trackSearchEvent(results.length === 0 ? 'SEARCH_NO_RESULT' : 'SEARCH_RESULT_SHOWN', {
        query: searchQuery,
        resultCount: results.length,
        filters: filterParams,
        userId
      });
    }
  }, [searchQuery, results.length, filterParams, view, userId]);

  // Handle Search Execution from Typing Input
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = internalQuery.trim();
    if (!query) return;

    // Record history
    const updatedHistory = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updatedHistory);
    
    // Save to firestore / guest persistence
    trackSearchEvent('SEARCH_SUBMITTED', { query, userId });
    
    if (onSearchChange) onSearchChange(query);
    if (onNavigate) onNavigate('search-results', query);
  };

  // Handle Direct click to search a tag/keyword
  const handleKeywordClick = (keyword: string) => {
    const updatedHistory = [keyword, ...recentSearches.filter(s => s !== keyword)].slice(0, 10);
    setRecentSearches(updatedHistory);
    trackSearchEvent('SEARCH_POPULAR_CLICKED', { query: keyword, userId });
    if (onSearchChange) onSearchChange(keyword);
    if (onNavigate) onNavigate('search-results', keyword);
  };

  // Clear single recent item
  const handleClearRecentItem = async (e: React.MouseEvent, keyword: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== keyword);
    setRecentSearches(updated);
    await deleteRecentSearch(userId || 'guest_user', keyword);
  };

  // Clear all recent searches
  const handleClearAllRecent = async () => {
    setRecentSearches([]);
    await clearAllRecentSearches(userId || 'guest_user');
  };

  // Categories list
  const availableCategories = useMemo(() => {
    const catSet = new Set<string>();
    apps.forEach(a => {
      if (a.category) catSet.add(a.category);
    });
    return Array.from(catSet).sort();
  }, [apps]);

  // First result matched
  const primaryMatch = results[0];

  // Related apps list: other apps in the same category as primaryMatch, or of similar categories
  const relatedApps = useMemo(() => {
    if (!primaryMatch) return [];
    return apps
      .filter(a => a.category === primaryMatch.category && a.id !== primaryMatch.id)
      .slice(0, 8);
  }, [primaryMatch, apps]);

  // "Anda Mungkin Juga Suka" - popular apps excluding the primaryMatch and related apps
  const recommendedApps = useMemo(() => {
    const excludedIds = new Set<string>();
    if (primaryMatch) excludedIds.add(primaryMatch.id);
    relatedApps.forEach(r => excludedIds.add(r.id));

    return apps
      .filter(a => !excludedIds.has(a.id))
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 8);
  }, [primaryMatch, relatedApps, apps]);

  // "Aplikasi Serupa" - other apps matches in search pipeline or of similar keyword
  const similarApps = useMemo(() => {
    if (results.length > 1) {
      return results.slice(1, 9);
    }
    // Fallback to latest apps
    return apps.slice(0, 8);
  }, [results, apps]);

  // Contextual search filters/tags "Mempersempit Penelusuran"
  const narrowDownTags = useMemo(() => {
    if (!primaryMatch) return [];
    const rawTags = [
      primaryMatch.category,
      'Aplikasi Premium',
      'Mod Populer',
      'Terbaru',
      'Kategori Terkait'
    ];
    return Array.from(new Set(rawTags.filter((tag): tag is string => typeof tag === 'string' && tag.trim() !== '')));
  }, [primaryMatch]);

  // RENDER STAGE 1: #/search/ (LANDING)
  if (view === 'search') {
    return (
      <div id="search-landing-container" className="max-w-4xl mx-auto px-4 py-6 md:py-10 animate-fade-in select-none">
        {/* Mock Search Input Bar (No autofocus, no keyboard trigger on render) */}
        <div className="mb-8">
          <div 
            onClick={() => {
              if (onNavigate) onNavigate('search-type');
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-2xl cursor-pointer shadow-xs transition-all duration-200"
          >
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-sm font-medium">Cari aplikasi atau game mod di Mod Station...</span>
          </div>
        </div>

        {/* Section 1: Trending Searches */}
        {trendingKeywords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Pencarian Sedang Tren
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trendingKeywords.map(({ query: tq, growth }, idx) => (
                <button
                  key={`${tq}-${idx}`}
                  onClick={() => handleKeywordClick(tq)}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl hover:border-blue-500/50 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all text-left"
                >
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate pr-2">{tq}</span>
                  <span className="text-xs font-semibold text-emerald-500 shrink-0 flex items-center gap-0.5">
                    ▲ +{growth}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Rekomendasi Mod Station */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Direkomendasikan Untuk Anda
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {apps.slice(0, 4).map((app, idx) => (
              <div
                key={`${app.id}-${idx}`}
                onClick={() => onSelectApp(app.slug)}
                className="flex gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl cursor-pointer hover:border-blue-500/40 dark:hover:border-white/20 hover:shadow-xs transition-all"
              >
                <img
                  src={app.icon || app.iconUrl || '/icon.png'}
                  alt={app.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200/50 dark:border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate mb-0.5">{app.name}</h3>
                  <p className="text-xs text-slate-400 truncate mb-1.5">{app.developer || 'Mod Station Developer'}</p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {(app.rating || 4.5).toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{app.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Jelajahi Kategori */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            Kategori Utama
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {availableCategories.map((cat, idx) => (
              <button
                key={`${cat}-${idx}`}
                onClick={() => handleKeywordClick(cat)}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 text-center transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">{cat}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {apps.filter(a => a.category === cat).length} Mod
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // RENDER STAGE 2: #/search/type/ (INPUT TYPING WITH HISTORY)
  if (view === 'search-type') {
    return (
      <div id="search-type-container" className="min-h-screen bg-slate-50/50 dark:bg-[#0F1115] flex flex-col select-none">
        {/* Compact Header with back to #/search/ */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-4 py-3.5 flex items-center gap-3 z-30">
          <button 
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('search');
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            ←
          </button>
          
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl">
            <input
              ref={textInputRef}
              type="text"
              value={internalQuery}
              onChange={(e) => setInternalQuery(e.target.value)}
              placeholder="Telusuri Mod Station..."
              className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-white text-sm"
            />
            {internalQuery && (
              <button
                type="button"
                onClick={() => setInternalQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            onClick={() => handleSearchSubmit()}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            CARI
          </button>
        </div>

        {/* History / Keyword list container */}
        <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
          {recentSearches.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Pencarian Terakhir
                </h3>
                <button
                  onClick={handleClearAllRecent}
                  className="text-xs text-red-500 hover:text-red-600 font-semibold"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                {recentSearches.map((item, idx) => (
                  <div
                    key={`${item}-${idx}`}
                    onClick={() => handleKeywordClick(item)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-200 truncate font-medium">{item}</span>
                    </div>
                    <button
                      onClick={(e) => handleClearRecentItem(e, item)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Belum ada riwayat pencarian</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Ketik kata kunci di atas untuk mencari modifikasi aplikasi terbaik.</p>
            </div>
          )}

          {/* Popular Keywords suggestion shelf */}
          {popularKeywords.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                Paling Banyak Dicari
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularKeywords.slice(0, 8).map(({ query }, idx) => (
                  <button
                    key={`${query}-${idx}`}
                    onClick={() => handleKeywordClick(query)}
                    className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full hover:border-blue-500 hover:text-blue-500 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER STAGE 3: #/search/type/:query (RESULTS)
  if (view === 'search-results') {
    return (
      <div id="search-results-container" className="max-w-4xl mx-auto px-4 py-6 animate-fade-in select-none">
        
        {/* Dynamic query header with edit search capability */}
        <div className="flex items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (onNavigate) onNavigate('search');
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              ←
            </button>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hasil Penelusuran</span>
              <h1 className="text-sm font-black text-slate-800 dark:text-white truncate">
                {searchQuery}
              </h1>
            </div>
          </div>
          
          <button
            onClick={() => {
              if (onNavigate) onNavigate('search-type', searchQuery);
            }}
            className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-200 transition-colors shrink-0"
          >
            <Search className="w-3 h-3" />
            <span>Ubah</span>
          </button>
        </div>

        {/* Filter / Filter Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-100/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Rating filter dropdown */}
          <select 
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Rating ⭐</option>
            <option value="4.0">Rating &gt;= 4.0</option>
            <option value="4.5">Rating &gt;= 4.5</option>
          </select>

          {/* Category filter dropdown */}
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort filter */}
          <select 
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value as any)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none ml-auto"
          >
            <option value="popular">Terpopuler</option>
            <option value="latest">Terbaru</option>
            <option value="rating">Rating Tertinggi</option>
          </select>
        </div>

        {results.length === 0 ? (
          /* Informative & Interactive Indonesian Empty State */
          <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-6">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-2">
              Mod Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Maaf, tidak ada modifikasi untuk kata kunci <span className="font-bold text-slate-600 dark:text-slate-300">"{searchQuery}"</span> yang cocok dengan filter aktif Anda. Coba kata kunci populer berikut.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['WhatsApp', 'Minecraft', 'Spotify', 'CapCut', 'Subway'].map((k, idx) => (
                <button
                  key={`${k}-${idx}`}
                  onClick={() => handleKeywordClick(k)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Primary Match Card (Halaman Utama Pencarian) */}
            <div className="mb-8">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Hasil Utama</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
                <div 
                  onClick={() => onSelectApp(primaryMatch.slug)}
                  className="flex gap-4 cursor-pointer"
                >
                  <img
                    src={primaryMatch.icon || primaryMatch.iconUrl || '/icon.png'}
                    alt={primaryMatch.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200/50 dark:border-white/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight truncate">
                        {primaryMatch.name}
                      </h3>
                      {primaryMatch.featured && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider rounded-md shrink-0">
                          Pilihan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{primaryMatch.developer || 'Mod Station Inc'}</p>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-bold mt-2.5">
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {(primaryMatch.rating || 4.5).toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{primaryMatch.category}</span>
                      <span>•</span>
                      <span>{primaryMatch.size || '35 MB'}</span>
                      <span>•</span>
                      <span className="text-emerald-500">{((primaryMatch.downloads || 0) / 1000000).toFixed(0)}M+ download</span>
                    </div>
                  </div>
                </div>

                {/* Direct description or modification context */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50/50 dark:bg-slate-800/10 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  {primaryMatch.description}
                </p>

                {/* Custom Expand Button to show Screenshots if they exist */}
                {primaryMatch.screenshots && primaryMatch.screenshots.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex flex-col gap-3">
                    <button
                      onClick={() => setExpandedCardId(expandedCardId === primaryMatch.id ? null : primaryMatch.id)}
                      className="flex items-center justify-between w-full text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 btn-press-feedback cursor-pointer"
                    >
                      <span>Lihat Pratinjau Tangkapan Layar (Screenshots)</span>
                      <ChevronDown className={`w-4 h-4 transform transition-transform duration-[180ms] cubic-bezier(0.16, 1, 0.3, 1) ${expandedCardId === primaryMatch.id ? 'rotate-180' : 'rotate-0'}`} />
                    </button>

                    {expandedCardId === primaryMatch.id && (
                      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
                        {primaryMatch.screenshots.map((screen, idx) => (
                          <img
                            key={`${screen}-${idx}`}
                            src={screen}
                            alt={`${primaryMatch.name} Screenshot ${idx + 1}`}
                            className="h-44 w-auto rounded-xl object-cover snap-start border border-slate-200/50 dark:border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terkait Penelusuran Anda (Horizontal Row) */}
            {relatedApps.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Terkait Penelusuran Anda</h2>
                <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {relatedApps.map((app, idx) => (
                    <div
                      key={`${app.id}-${idx}`}
                      onClick={() => onSelectApp(app.slug)}
                      className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 shrink-0 snap-start cursor-pointer hover:border-blue-500/40 transition-all flex flex-col"
                    >
                      <img
                        src={app.icon || app.iconUrl || '/icon.png'}
                        alt={app.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 dark:border-white/10 mx-auto mb-2.5"
                        referrerPolicy="no-referrer"
                      />
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white truncate text-center mb-0.5">{app.name}</h3>
                      <p className="text-[10px] text-slate-400 text-center truncate mb-1">{app.category}</p>
                      <span className="text-[10px] text-amber-500 font-bold text-center mt-auto flex items-center justify-center gap-0.5">
                        ⭐ {(app.rating || 4.5).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anda Mungkin Juga Suka Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Anda Mungkin Juga Suka</h2>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate('search-expand-fully', searchQuery);
                  }}
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
                >
                  <span>Tampilkan Lebih Banyak</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendedApps.slice(0, 4).map((app, idx) => (
                  <div
                    key={`${app.id}-${idx}`}
                    onClick={() => onSelectApp(app.slug)}
                    className="flex gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/30 transition-all"
                  >
                    <img
                      src={app.icon || app.iconUrl || '/icon.png'}
                      alt={app.name}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200/40"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-black text-slate-800 dark:text-white truncate">{app.name}</h3>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{app.category}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-bold">
                        <span className="text-amber-500 flex items-center gap-0.5">⭐ {(app.rating || 4.5).toFixed(1)}</span>
                        <span>•</span>
                        <span>{app.size}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aplikasi Serupa Section */}
            {similarApps.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Aplikasi Serupa</h2>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('search-expand', searchQuery);
                    }}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
                  >
                    <span>Jelajahi Semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {similarApps.slice(0, 4).map((app, idx) => (
                    <div
                      key={`${app.id}-${idx}`}
                      onClick={() => onSelectApp(app.slug)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 cursor-pointer hover:border-blue-500/40 transition-all flex flex-col"
                    >
                      <img
                        src={app.icon || app.iconUrl || '/icon.png'}
                        alt={app.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 mx-auto mb-2"
                        referrerPolicy="no-referrer"
                      />
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white text-center truncate mb-0.5">{app.name}</h3>
                      <span className="text-[10px] text-slate-400 text-center truncate">{app.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mempersempit Penelusuran (Contextual tags) */}
            {narrowDownTags.length > 0 && (
              <div className="mb-8 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200/50 dark:border-white/5">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Mempersempit Penelusuran</h2>
                <div className="flex flex-wrap gap-2">
                  {narrowDownTags.map((tag, idx) => (
                    <button
                      key={`${tag}-${idx}`}
                      onClick={() => handleKeywordClick(tag)}
                      className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl hover:border-blue-500/50 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    );
  }

  // RENDER STAGE 4: #/search/type/:query/expand/ (EXPANDED LIST VIEW)
  if (view === 'search-expand') {
    return (
      <div id="search-expand-container" className="max-w-4xl mx-auto px-4 py-6 animate-fade-in select-none">
        {/* Header bar back to results */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('search-results', searchQuery);
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            ← Kembali
          </button>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Jelajahi Lebih Lengkap</span>
            <h1 className="text-sm font-black text-slate-800 dark:text-white truncate">
              {searchQuery}
            </h1>
          </div>
        </div>

        <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Semua Aplikasi Terkait</h2>
        
        {/* Compact List View Cards */}
        <div className="flex flex-col gap-3">
          {results.map((app, idx) => (
            <div
              key={`${app.id}-${idx}`}
              onClick={() => onSelectApp(app.slug)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/40 rounded-2xl cursor-pointer transition-all"
            >
              <img
                src={app.icon || app.iconUrl || '/icon.png'}
                alt={app.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200/50 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-800 dark:text-white truncate">{app.name}</h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">{app.developer || 'Mod Station Creator'}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-bold">
                  <span className="flex items-center gap-0.5 text-amber-500">⭐ {(app.rating || 4.5).toFixed(1)}</span>
                  <span>•</span>
                  <span>{app.category}</span>
                  <span>•</span>
                  <span>{app.size}</span>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-300 transform -rotate-90 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // RENDER STAGE 5: #/search/type/:query/expand/Fully (FULLY EXPANDED RESULTS)
  if (view === 'search-expand-fully') {
    return (
      <div id="search-expand-fully-container" className="max-w-4xl mx-auto px-4 py-6 animate-fade-in select-none">
        {/* Header bar back to results */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('search-results', searchQuery);
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            ← Kembali
          </button>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hasil Pencarian Lengkap</span>
            <h1 className="text-sm font-black text-slate-800 dark:text-white truncate">
              {searchQuery}
            </h1>
          </div>
        </div>

        <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Discovery Results Grid</h2>

        {/* Detailed grid/discovery view of matching results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((app, idx) => (
            <div
              key={`${app.id}-${idx}`}
              onClick={() => onSelectApp(app.slug)}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/40 rounded-3xl cursor-pointer hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-3 mb-3">
                  <img
                    src={app.icon || app.iconUrl || '/icon.png'}
                    alt={app.name}
                    className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200/50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white truncate">{app.name}</h3>
                    <p className="text-[10px] text-slate-400 truncate">{app.developer || 'Mod Developer'}</p>
                    <span className="inline-block text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase mt-1">{app.category}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {app.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {(app.rating || 4.5).toFixed(1)}
                </span>
                <span className="text-blue-500 hover:text-blue-600">Unduh APK</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
