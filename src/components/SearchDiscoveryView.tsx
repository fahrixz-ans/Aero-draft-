import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Flame, Sparkles, Clock, X, 
  ArrowRight, Star, ChevronDown, Check,
  TrendingUp, Layers, SlidersHorizontal, ChevronRight, ExternalLink
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
import ActiveFilterChips, { FilterChipItem } from './common/ActiveFilterChips';

interface SearchDiscoveryViewProps {
  apps?: AppData[];
  view?: string;
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

export type SearchInternalState = 'idle' | 'focused' | 'results' | 'expanded';

/**
 * Unified SearchDiscoveryView
 * Single-view Search Architecture for Mod Station.
 * 
 * Handles all states (idle, focused/suggestions, results, expanded) internally
 * within ONE single view component and hash route.
 */
export default function SearchDiscoveryView({
  apps = [],
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
  // Queries & Internal State
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [searchState, setSearchState] = useState<SearchInternalState>(searchQuery.trim() ? 'results' : 'idle');
  
  // Expanded card state (screenshots toggle)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Filters State
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'latest' | 'popular' | 'rating'>('popular');

  // Search intelligence / suggestions state
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<{ query: string; growth: number }[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<{ query: string; count: number }[]>([]);

  // Input element ref
  const textInputRef = useRef<HTMLInputElement>(null);

  // Sync prop changes for searchQuery
  useEffect(() => {
    setInternalQuery(searchQuery);
    if (searchQuery.trim()) {
      setSearchState('results');
    } else {
      setSearchState('idle');
    }
  }, [searchQuery]);

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

  // Build filter parameters for search engine
  const filterParams = useMemo(() => {
    return {
      type: 'all' as const,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      rating: selectedRating !== 'all' ? selectedRating : undefined,
      sort: selectedSort
    };
  }, [selectedCategory, selectedRating, selectedSort]);

  // Run Search Pipeline on current query or internal query
  const effectiveQuery = searchState === 'focused' ? internalQuery : searchQuery;
  
  const searchResult = useMemo(() => {
    return executeSearchPipeline(
      effectiveQuery,
      apps,
      filterParams,
      selectedSort
    );
  }, [effectiveQuery, apps, filterParams, selectedSort]);

  const { results, suggestions } = searchResult;

  // Track search results shown
  useEffect(() => {
    if (searchQuery.trim().length > 0 && (searchState === 'results' || searchState === 'expanded')) {
      trackSearchEvent(results.length === 0 ? 'SEARCH_NO_RESULT' : 'SEARCH_RESULT_SHOWN', {
        query: searchQuery,
        resultCount: results.length,
        filters: filterParams,
        userId
      });
    }
  }, [searchQuery, results.length, filterParams, searchState, userId]);

  // Handle Search Submission (Enter key or Submit button)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = internalQuery.trim();
    if (!query) return;

    // Record history
    const updatedHistory = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updatedHistory);
    
    // Save to firestore / guest persistence
    trackSearchEvent('SEARCH_SUBMITTED', { query, userId });
    
    if (textInputRef.current) textInputRef.current.blur();
    setSearchState('results');
    if (onSearchChange) onSearchChange(query);
  };

  // Handle Direct click to search a keyword
  const handleKeywordClick = (keyword: string) => {
    setInternalQuery(keyword);
    const updatedHistory = [keyword, ...recentSearches.filter(s => s !== keyword)].slice(0, 10);
    setRecentSearches(updatedHistory);
    trackSearchEvent('SEARCH_POPULAR_CLICKED', { query: keyword, userId });
    if (textInputRef.current) textInputRef.current.blur();
    setSearchState('results');
    if (onSearchChange) onSearchChange(keyword);
  };

  // Cancel search focus & reset active input state
  const handleCancelSearch = () => {
    if (textInputRef.current) textInputRef.current.blur();
    setInternalQuery(searchQuery);
    if (searchQuery.trim()) {
      setSearchState('results');
    } else {
      setSearchState('idle');
    }
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

  // Primary match
  const primaryMatch = results[0];

  // Related apps list
  const relatedApps = useMemo(() => {
    if (!primaryMatch) return [];
    return apps
      .filter(a => a.category === primaryMatch.category && a.id !== primaryMatch.id)
      .slice(0, 8);
  }, [primaryMatch, apps]);

  // Dynamic suggestion matches for focus overlay
  const suggestionList = useMemo(() => {
    const extractedQueries: string[] = [];
    if (suggestions) {
      if (Array.isArray(suggestions.queries)) {
        extractedQueries.push(...suggestions.queries);
      }
      if (Array.isArray(suggestions.apps)) {
        extractedQueries.push(...suggestions.apps.map(a => a.name));
      }
      if (Array.isArray(suggestions.categories)) {
        extractedQueries.push(...suggestions.categories);
      }
      if (Array.isArray(suggestions.developers)) {
        extractedQueries.push(...suggestions.developers);
      }
      if (Array.isArray(suggestions as unknown as string[])) {
        extractedQueries.push(...(suggestions as unknown as string[]));
      }
    }

    if (!internalQuery.trim()) {
      return Array.from(new Set(extractedQueries)).slice(0, 6);
    }

    const queryLower = internalQuery.toLowerCase().trim();
    const matches = apps
      .filter(a => a.name.toLowerCase().includes(queryLower) || a.category.toLowerCase().includes(queryLower))
      .slice(0, 6)
      .map(a => a.name);

    return Array.from(new Set([...matches, ...extractedQueries])).slice(0, 8);
  }, [internalQuery, apps, suggestions]);

  return (
    <div id="search-unified-container" className="max-w-4xl mx-auto px-4 py-6 select-none animate-fade-in">
      
      {/* 1. SEARCH INPUT BAR (App Store Inspired UI) */}
      <div className="mb-6 sticky top-16 z-30 bg-white/90 dark:bg-[#0F1115]/90 backdrop-blur-md pt-2 pb-2">
        <label htmlFor="search-main-input" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
          Cari
        </label>
        
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              id="search-main-input"
              ref={textInputRef}
              type="text"
              value={internalQuery}
              onChange={(e) => {
                setInternalQuery(e.target.value);
                if (searchState !== 'focused') setSearchState('focused');
              }}
              onFocus={() => setSearchState('focused')}
              placeholder="Cari aplikasi atau game mod di Mod Station..."
              className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-white text-sm font-medium placeholder:text-slate-400"
              autoComplete="off"
            />
            {internalQuery && (
              <button
                type="button"
                onClick={() => setInternalQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md transition-colors"
                aria-label="Bersihkan input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tombol Batal when input is focused or query is active */}
          {(searchState === 'focused' || internalQuery !== searchQuery) && (
            <button
              type="button"
              onClick={handleCancelSearch}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all shrink-0 cursor-pointer"
            >
              Batal
            </button>
          )}
        </form>
      </div>

      {/* 2. STATE B: FOCUSED / SUGGESTIONS OVERLAY */}
      {searchState === 'focused' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-lg mb-8 animate-fade-in">
          {/* Real-time Dynamic Suggestions */}
          {suggestionList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Temukan
              </h3>
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                {suggestionList.map((item, idx) => (
                  <div
                    key={`${item}-${idx}`}
                    onClick={() => handleKeywordClick(item)}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Search className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Pencarian Terakhir
                </h3>
                <button
                  onClick={handleClearAllRecent}
                  className="text-xs text-red-500 hover:text-red-600 font-semibold cursor-pointer"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                {recentSearches.slice(0, 5).map((item, idx) => (
                  <div
                    key={`${item}-${idx}`}
                    onClick={() => handleKeywordClick(item)}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl cursor-pointer transition-colors"
                  >
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">{item}</span>
                    <button
                      type="button"
                      onClick={(e) => handleClearRecentItem(e, item)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {popularKeywords.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Paling Banyak Dicari
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularKeywords.slice(0, 8).map(({ query }, idx) => (
                  <button
                    key={`${query}-${idx}`}
                    type="button"
                    onClick={() => handleKeywordClick(query)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. STATE A: IDLE / NORMAL SEARCH LANDING (When search query is empty) */}
      {searchState === 'idle' && (
        <div className="space-y-8 animate-fade-in">
          {/* Trending Searches Shelf */}
          {trendingKeywords.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Pencarian Sedang Tren
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trendingKeywords.map(({ query: tq, growth }, idx) => (
                  <button
                    key={`${tq}-${idx}`}
                    type="button"
                    onClick={() => handleKeywordClick(tq)}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all text-left cursor-pointer shadow-xs"
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

          {/* Recommended for You */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Direkomendasikan Untuk Anda
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {apps.slice(0, 4).map((app, idx) => (
                <div
                  key={`${app.id}-${idx}`}
                  onClick={() => onSelectApp(app.slug)}
                  className="flex gap-3.5 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/40 hover:shadow-xs transition-all"
                >
                  <img
                    src={app.icon || app.iconUrl || '/icon.png'}
                    alt={app.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200/50 dark:border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate mb-0.5">{app.name}</h3>
                    <p className="text-xs text-slate-400 truncate mb-1">{app.developer || 'Mod Station Developer'}</p>
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

          {/* Main Categories */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              Kategori Utama
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {availableCategories.map((cat, idx) => (
                <button
                  key={`${cat}-${idx}`}
                  type="button"
                  onClick={() => handleKeywordClick(cat)}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center transition-all cursor-pointer"
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
      )}

      {/* 4. STATE C & D: RESULTS / EXPANDED RESULTS (When searchQuery is present) */}
      {(searchState === 'results' || searchState === 'expanded') && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Result Header Title */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hasil Pencarian</span>
              <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-white truncate">
                Hasil untuk "{searchQuery}"
              </h1>
            </div>
            {results.length > 0 && (
              <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full shrink-0">
                {results.length} ditemukan
              </span>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-100/60 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select 
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Semua Rating ⭐</option>
              <option value="4.0">Rating &gt;= 4.0</option>
              <option value="4.5">Rating &gt;= 4.5</option>
            </select>

            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select 
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none ml-auto"
            >
              <option value="popular">Terpopuler</option>
              <option value="latest">Terbaru</option>
              <option value="rating">Rating Tertinggi</option>
            </select>
          </div>

          {/* Active Filter Chips */}
          {(() => {
            const discoveryChips: FilterChipItem[] = [];
            if (selectedCategory && selectedCategory !== 'all') {
              discoveryChips.push({
                id: 'chip-cat',
                label: 'Kategori',
                value: selectedCategory,
                icon: <Layers className="w-3 h-3 text-blue-500" />,
                onRemove: () => setSelectedCategory('all')
              });
            }
            if (selectedRating && selectedRating !== 'all') {
              discoveryChips.push({
                id: 'chip-rating',
                label: 'Rating',
                value: `≥ ${selectedRating} ★`,
                icon: <Star className="w-3 h-3 text-amber-500 fill-amber-500" />,
                onRemove: () => setSelectedRating('all')
              });
            }
            if (selectedSort && selectedSort !== 'popular') {
              discoveryChips.push({
                id: 'chip-sort',
                label: 'Urutan',
                value: selectedSort === 'latest' ? 'Terbaru' : 'Rating Tertinggi',
                icon: <TrendingUp className="w-3 h-3 text-blue-500" />,
                onRemove: () => setSelectedSort('popular')
              });
            }

            if (discoveryChips.length === 0) return null;

            return (
              <ActiveFilterChips
                chips={discoveryChips}
                onClearAll={() => {
                  setSelectedCategory('all');
                  setSelectedRating('all');
                  setSelectedSort('popular');
                }}
              />
            );
          })()}

          {/* NO RESULTS EMPTY STATE */}
          {results.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xs">
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
                    type="button"
                    onClick={() => handleKeywordClick(k)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* RESULT CARDS LIST */}
              <div className="space-y-4">
                {(searchState === 'expanded' ? results : results.slice(0, 5)).map((app, idx) => (
                  <div
                    key={`${app.id}-${idx}`}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-xs hover:border-blue-500/40 transition-all flex flex-col gap-4"
                  >
                    {/* Top Section: Icon, Info & Unduh Button */}
                    <div className="flex gap-3.5 sm:gap-4 items-start">
                      <img
                        src={app.icon || app.iconUrl || '/icon.png'}
                        alt={app.name}
                        onClick={() => onSelectApp(app.slug)}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200/50 dark:border-white/10 shrink-0 cursor-pointer"
                        referrerPolicy="no-referrer"
                      />
                      
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelectApp(app.slug)}>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight truncate">
                            {app.name}
                          </h3>
                          {app.featured && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider rounded-md shrink-0">
                              Pilihan
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{app.developer || 'Mod Station Creator'}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-bold mt-2">
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {(app.rating || 4.5).toFixed(1)}
                          </span>
                          <span>•</span>
                          <span>{app.category}</span>
                          {app.size && (
                            <>
                              <span>•</span>
                              <span>{app.size}</span>
                            </>
                          )}
                          {app.version && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">v{app.version}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Download Button */}
                      <button
                        type="button"
                        onClick={(e) => onDownloadApp ? onDownloadApp(e, app) : onSelectApp(app.slug)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer self-center"
                      >
                        Unduh
                      </button>
                    </div>

                    {/* App Description */}
                    {app.description && (
                      <p 
                        onClick={() => onSelectApp(app.slug)}
                        className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50/70 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-white/5 cursor-pointer"
                      >
                        {app.description}
                      </p>
                    )}

                    {/* Screenshots Carousel / Preview Strip */}
                    {app.screenshots && app.screenshots.length > 0 && (
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pratinjau Media</span>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
                          {app.screenshots.map((screen, sIdx) => (
                            <img
                              key={`${screen}-${sIdx}`}
                              src={screen}
                              alt={`${app.name} Screenshot ${sIdx + 1}`}
                              onClick={() => onSelectApp(app.slug)}
                              className="h-36 sm:h-44 w-auto rounded-xl object-cover snap-start border border-slate-200/50 dark:border-white/10 shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* LIHAT SEMUA HASIL / EXPAND TOGGLE BUTTON */}
              {results.length > 5 && (
                <div className="pt-2">
                  {searchState === 'results' ? (
                    <button
                      type="button"
                      onClick={() => setSearchState('expanded')}
                      className="w-full py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <span>Lihat Semua Hasil ({results.length})</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchState('results')}
                      className="w-full py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <span>Tampilkan Lebih Sedikit</span>
                      <ChevronDown className="w-4 h-4 transform rotate-180" />
                    </button>
                  )}
                </div>
              )}

              {/* Related Apps Shelf */}
              {relatedApps.length > 0 && (
                <div className="pt-6 border-t border-slate-200/60 dark:border-white/5">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Terkait Penelusuran Anda</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {relatedApps.map((app, idx) => (
                      <div
                        key={`${app.id}-${idx}`}
                        onClick={() => onSelectApp(app.slug)}
                        className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 shrink-0 snap-start cursor-pointer hover:border-blue-500/40 transition-all flex flex-col"
                      >
                        <img
                          src={app.icon || app.iconUrl || '/icon.png'}
                          alt={app.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-white/10 mx-auto mb-2"
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

            </div>
          )}

        </div>
      )}

    </div>
  );
}
