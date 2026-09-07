import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Search, Flame, Sparkles, Gamepad2, LayoutGrid, Clock, X, 
  ArrowRight, Filter, SlidersHorizontal, Star, ShieldCheck, 
  Download, Globe, RotateCcw, AlertCircle, ChevronDown, Check,
  Zap, TrendingUp, Layers, ExternalLink, RefreshCw
} from 'lucide-react';
import { AppData, DownloadHistoryRecord, SearchTabType, SearchFilterParams, SortOption, RankedSearchResult, SearchIntentType } from '../types';
import { executeSearchPipeline, normalizeQuery } from '../services/search/searchEngine';
import { 
  trackSearchEvent, 
  fetchUserRecentSearches, 
  deleteRecentSearch, 
  clearAllRecentSearches,
  getAggregatedSearchIntelligence 
} from '../services/search/searchIntelligence';

interface SearchDiscoveryViewProps {
  apps?: AppData[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
  downloadHistory?: DownloadHistoryRecord[];
  onBookmarkToggle?: (appId: string) => void;
  bookmarkedAppIds?: string[];
  userId?: string | null;
  onNavigate?: (view: string, slug?: string) => void;
}

export default function SearchDiscoveryView({
  apps = [],
  searchQuery = '',
  onSearchChange,
  onSelectApp,
  onDownloadApp,
  downloadHistory = [],
  onBookmarkToggle,
  bookmarkedAppIds = [],
  userId,
  onNavigate
}: SearchDiscoveryViewProps) {
  // Input State
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [submittedQuery, setSubmittedQuery] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState<SearchTabType>('all');
  
  // Filters & Sorting State
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('latest');
  const [hasApkOnly, setHasApkOnly] = useState(false);
  const [hasOfficialOnly, setHasOfficialOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);

  // Autocomplete dropdown state
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Recent & Popular searches state
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<{ query: string; count: number }[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<{ query: string; growth: number }[]>([]);
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(20);

  // Sync prop changes
  useEffect(() => {
    if (searchQuery !== internalQuery) {
      setInternalQuery(searchQuery);
      setSubmittedQuery(searchQuery);
    }
  }, [searchQuery]);

  // Load Recent & Popular searches on mount
  useEffect(() => {
    fetchUserRecentSearches(userId).then(list => setRecentSearches(list));
    getAggregatedSearchIntelligence(apps).then(summary => {
      setPopularKeywords(summary.popularSearches.map(p => ({ query: p.query, count: p.searchCount })));
      setTrendingKeywords(summary.trendingSearches.map(t => ({ query: t.query, growth: t.growthRate })));
    });
  }, [userId, apps]);

  // Handle outside click for autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current && 
        !autocompleteRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Categories List
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    apps.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set).sort();
  }, [apps]);

  // Build filter parameters for search engine
  const filterParams = useMemo<SearchFilterParams>(() => {
    let typeParam: 'all' | 'apps' | 'games' = 'all';
    if (activeTab === 'apps') typeParam = 'apps';
    if (activeTab === 'games') typeParam = 'games';

    return {
      type: typeParam,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      rating: selectedRating !== 'all' ? selectedRating : undefined,
      hasApk: hasApkOnly || undefined,
      hasOfficialWebsite: hasOfficialOnly || undefined,
      recentlyUpdated: recentOnly || undefined,
      sort: selectedSort
    };
  }, [activeTab, selectedCategory, selectedRating, hasApkOnly, hasOfficialOnly, recentOnly, selectedSort]);

  // Run Search Pipeline
  const pipelineResult = useMemo(() => {
    return executeSearchPipeline(
      submittedQuery,
      apps,
      filterParams,
      selectedSort
    );
  }, [submittedQuery, apps, filterParams, selectedSort]);

  const { results, suggestions, didYouMean, intent, timingMs } = pipelineResult;
  const isSearching = submittedQuery.trim().length > 0;

  // Track search results shown
  useEffect(() => {
    if (isSearching) {
      trackSearchEvent(results.length === 0 ? 'SEARCH_NO_RESULT' : 'SEARCH_RESULT_SHOWN', {
        query: submittedQuery,
        resultCount: results.length,
        intent,
        filters: filterParams,
        sort: selectedSort,
        userId
      });
    }
  }, [submittedQuery, results.length, intent, filterParams, selectedSort, isSearching, userId]);

  // Handle Input Changes
  const handleInputChange = (val: string) => {
    setInternalQuery(val);
    setSelectedSuggestionIndex(-1);
    setIsAutocompleteOpen(true);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Perform search submission
  const handlePerformSearch = (queryText: string, eventType: 'SEARCH_SUBMITTED' | 'SEARCH_SUGGESTION_CLICKED' | 'SEARCH_RECENT_CLICKED' | 'SEARCH_POPULAR_CLICKED' = 'SEARCH_SUBMITTED') => {
    const q = queryText.trim();
    setInternalQuery(q);
    setSubmittedQuery(q);
    setIsAutocompleteOpen(false);
    setVisibleCount(20);

    if (q) {
      trackSearchEvent(eventType, {
        query: q,
        resultCount: results.length,
        userId
      });
      // Refresh recent searches
      fetchUserRecentSearches(userId).then(list => setRecentSearches(list));
    }
  };

  // Autocomplete Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isAutocompleteOpen) return;

    const totalSuggestions = (suggestions.apps.length || 0) + (suggestions.queries.length || 0);
    if (totalSuggestions === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev < totalSuggestions - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : totalSuggestions - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        if (selectedSuggestionIndex < suggestions.apps.length) {
          const app = suggestions.apps[selectedSuggestionIndex];
          handleSelectAppDirect(app.slug, app.name);
        } else {
          const queryIdx = selectedSuggestionIndex - suggestions.apps.length;
          const q = suggestions.queries[queryIdx];
          if (q) handlePerformSearch(q, 'SEARCH_SUGGESTION_CLICKED');
        }
      } else {
        handlePerformSearch(internalQuery);
      }
    } else if (e.key === 'Escape') {
      setIsAutocompleteOpen(false);
    }
  };

  const handleSelectAppDirect = (slug: string, appName: string) => {
    trackSearchEvent('SEARCH_RESULT_CLICKED', {
      query: submittedQuery || internalQuery,
      clickedResultSlug: slug,
      userId
    });
    onSelectApp(slug);
  };

  const handleClearRecentItem = async (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    await deleteRecentSearch(q, userId);
    setRecentSearches(prev => prev.filter(item => item !== q));
  };

  const handleClearAllRecent = async () => {
    await clearAllRecentSearches(userId);
    setRecentSearches([]);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedRating('all');
    setSelectedSort('latest');
    setHasApkOnly(false);
    setHasOfficialOnly(false);
    setRecentOnly(false);
    setActiveTab('all');
  };

  // Shelves for discovery mode
  const gameApps = useMemo(() => {
    return apps.filter(a => 
      a.category?.toLowerCase().includes('game') || 
      a.category?.toLowerCase().includes('permainan')
    ).slice(0, 4);
  }, [apps]);

  const recommendedApps = useMemo(() => {
    return apps.filter(a => a.featured || (a.ratingAverage && a.ratingAverage >= 4.5) || a.rating >= 4.5).slice(0, 4);
  }, [apps]);

  const toolApps = useMemo(() => {
    return apps.filter(a => a.category === 'Alat' || a.category === 'Produktivitas' || a.category === 'Fotografi').slice(0, 4);
  }, [apps]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in" id="search-discovery-page">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP SEARCH BAR CONTAINER & AUTOCOMPLETE                      */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-3xl mx-auto mb-6 relative">
        <form 
          onSubmit={(e) => { e.preventDefault(); handlePerformSearch(internalQuery); }}
          className="relative flex items-center p-1.5 bg-white dark:bg-[#121722] border border-slate-300 dark:border-white/15 rounded-2xl shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all"
        >
          <div className="pl-3.5 text-slate-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari nama aplikasi, game, developer, atau kategori..."
            value={internalQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsAutocompleteOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full pl-3 pr-4 py-2.5 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none"
            id="search-discovery-input"
            autoComplete="off"
            autoFocus
          />

          {internalQuery && (
            <button
              type="button"
              onClick={() => {
                setInternalQuery('');
                setSubmittedQuery('');
                setIsAutocompleteOpen(false);
                if (onSearchChange) onSearchChange('');
              }}
              className="p-1.5 mr-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
          >
            Cari
          </button>
        </form>

        {/* Real-Time Autocomplete & Suggestions Dropdown */}
        {isAutocompleteOpen && internalQuery.trim().length > 0 && (
          <div 
            ref={autocompleteRef}
            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#151c2a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5"
          >
            {/* Apps Direct Match Section */}
            {suggestions.apps.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  Aplikasi Cocok
                </div>
                <div className="space-y-0.5">
                  {suggestions.apps.map((app, idx) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleSelectAppDirect(app.slug, app.name)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        selectedSuggestionIndex === idx
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={app.icon || '/icon.png'} 
                          alt={app.name} 
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200/60 dark:border-white/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{app.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{app.developer} • {app.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0 ml-2">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{app.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Search Query Terms */}
            {suggestions.queries.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-slate-400" />
                  Saran Kata Kunci
                </div>
                <div className="space-y-0.5">
                  {suggestions.queries.map((q, idx) => {
                    const globalIdx = suggestions.apps.length + idx;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handlePerformSearch(q, 'SEARCH_SUGGESTION_CLICKED')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer ${
                          selectedSuggestionIndex === globalIdx
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <span>{q}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Developers / Categories Suggestion Chips */}
            {(suggestions.developers.length > 0 || suggestions.categories.length > 0) && (
              <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] flex flex-wrap items-center gap-2 text-xs">
                {suggestions.developers.map(dev => (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => handlePerformSearch(dev, 'SEARCH_SUGGESTION_CLICKED')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 text-[11px] font-semibold cursor-pointer"
                  >
                    Dev: {dev}
                  </button>
                ))}
                {suggestions.categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      handlePerformSearch(internalQuery || cat, 'SEARCH_SUGGESTION_CLICKED');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-semibold cursor-pointer"
                  >
                    Kategori: {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Popular Keywords bar */}
        {!isSearching && popularKeywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
            <span className="font-bold flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Populer:
            </span>
            {popularKeywords.slice(0, 8).map(({ query: kw }) => (
              <button
                key={kw}
                onClick={() => handlePerformSearch(kw, 'SEARCH_POPULAR_CLICKED')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-[11px] cursor-pointer transition-colors border border-slate-200/80 dark:border-white/5"
              >
                {kw}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SEARCH TABS & FILTER BAR                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3 mb-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Semua', icon: LayoutGrid },
            { id: 'apps', label: 'Aplikasi', icon: Sparkles },
            { id: 'games', label: 'Games', icon: Gamepad2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as SearchTabType);
                  trackSearchEvent('SEARCH_FILTER_USED', {
                    query: submittedQuery,
                    filters: { type: tab.id },
                    userId
                  });
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls & Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          {/* Category Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                trackSearchEvent('SEARCH_FILTER_USED', {
                  query: submittedQuery,
                  filters: { category: e.target.value },
                  userId
                });
              }}
              className="pl-2.5 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs border border-slate-200 dark:border-white/10 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => {
                const s = e.target.value as SortOption;
                setSelectedSort(s);
                trackSearchEvent('SEARCH_SORT_USED', {
                  query: submittedQuery,
                  sort: s,
                  userId
                });
              }}
              className="pl-2.5 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs border border-slate-200 dark:border-white/10 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="latest">Paling Relevan</option>
              <option value="popular">Paling Populer</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="updated">Terbaru Diperbarui</option>
              <option value="a-z">Nama (A-Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter Panel Toggle */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              showFilterPanel || selectedRating !== 'all' || hasApkOnly || hasOfficialOnly || recentOnly
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
            }`}
            title="Filter Lanjutan"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {showFilterPanel && (
        <div className="p-4 mb-6 bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-2xl animate-fade-in text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-500" />
              Filter Pencarian Spesifik
            </span>
            <button
              onClick={handleResetFilters}
              className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Rating Filter */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Rating Minimal</label>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: '4.0+', label: '★ 4.0+' },
                  { id: '4.5+', label: '★ 4.5+' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRating(r.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      selectedRating === r.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distribution Status Checkboxes */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ketersediaan Unduhan</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasApkOnly}
                    onChange={(e) => setHasApkOnly(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Hanya yang memiliki file APK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOfficialOnly}
                    onChange={(e) => setHasOfficialOnly(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Hanya tautan situs resmi</span>
                </label>
              </div>
            </div>

            {/* Freshness */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pembaruan</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recentOnly}
                  onChange={(e) => setRecentOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Diperbarui dalam 30 hari terakhir</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. "DID YOU MEAN" TYPO TOLERANCE BANNER                       */}
      {/* ------------------------------------------------------------- */}
      {didYouMean && isSearching && (
        <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Mungkin maksud Anda: <strong className="font-bold underline cursor-pointer" onClick={() => handlePerformSearch(didYouMean, 'SEARCH_SUGGESTION_CLICKED')}>{didYouMean}</strong>?
            </span>
          </div>
          <button
            onClick={() => handlePerformSearch(didYouMean, 'SEARCH_SUGGESTION_CLICKED')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] shadow-sm cursor-pointer transition-all"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. ACTIVE SEARCH RESULTS VIEW                                 */}
      {/* ------------------------------------------------------------- */}
      {isSearching ? (
        <div>
          {/* Results Metadata Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-slate-900 dark:text-white">{results.length}</strong> hasil untuk "{submittedQuery}"
              </span>
              <span className="hidden sm:inline text-slate-400">({timingMs} ms)</span>
            </div>
            {intent && intent !== 'GENERAL' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                Intent: {intent}
              </span>
            )}
          </div>

          {/* Search Result Cards Grid */}
          {results.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.slice(0, visibleCount).map(({ app, matchedField }) => (
                  <div
                    key={app.id}
                    onClick={() => handleSelectAppDirect(app.slug, app.name)}
                    className="group relative flex flex-col justify-between p-4 bg-white dark:bg-[#121722] hover:bg-slate-50 dark:hover:bg-[#161d2b] border border-slate-200 dark:border-white/10 hover:border-blue-500/50 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start gap-3.5 mb-3">
                        <img
                          src={app.icon || app.iconUrl || '/icon.png'}
                          alt={app.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200/80 dark:border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {app.name}
                            </h3>
                            {app.verifiedBadge && (
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="Terverifikasi" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {app.developer || app.developerName || 'Pengembang Resmi'}
                          </p>
                          <span className="inline-block px-2 py-0.5 mt-1 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                            {app.category}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                        {app.description}
                      </p>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {(app.ratingAverage || app.rating || 4.5).toFixed(1)}
                        </span>
                        <span>{app.downloads ? `${(app.downloads >= 1000000 ? (app.downloads/1000000).toFixed(0)+'M+' : app.downloads >= 1000 ? (app.downloads/1000).toFixed(0)+'K+' : app.downloads)} unduhan` : 'Populer'}</span>
                      </div>

                      {/* Download APK / Official Website Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDownloadApp) onDownloadApp(e, app);
                          else handleSelectAppDirect(app.slug, app.name);
                        }}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        {app.sourceType === 'official_link' || (!app.apkFileUrl && app.officialUrl) ? (
                          <>
                            <Globe className="w-3 h-3" />
                            <span>Situs Resmi</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>Download APK</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Pagination */}
              {results.length > visibleCount && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-xs"
                  >
                    Muat Lebih Banyak ({results.length - visibleCount} lagi)
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* --------------------------------------------------------- */
            /* 5. ZERO-RESULTS RECOVERY STATE                             */
            /* --------------------------------------------------------- */
            <div className="text-center py-12 px-4 max-w-lg mx-auto bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-3xl animate-fade-in">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Tidak ada aplikasi yang ditemukan untuk "{submittedQuery}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Coba periksa kesalahan pengetikan, gunakan kata kunci yang lebih umum, atau cari berdasarkan kategori dan nama pengembang.
              </p>

              {/* Suggested Recovery Terms */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                {popularKeywords.slice(0, 5).map(({ query: kw }) => (
                  <button
                    key={kw}
                    onClick={() => handlePerformSearch(kw, 'SEARCH_POPULAR_CLICKED')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setInternalQuery('');
                  setSubmittedQuery('');
                  handleResetFilters();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all"
              >
                Kembali ke Jelajah Katalog
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 6. DISCOVERY SHELVES & RECENT SEARCHES (IDLE STATE)           */
        /* ------------------------------------------------------------- */
        <div className="space-y-10 animate-fade-in">
          
          {/* Recent Searches Panel */}
          {recentSearches.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Pencarian Terakhir Anda
                </span>
                <button
                  onClick={handleClearAllRecent}
                  className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Hapus Semua Riwayat
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((kw) => (
                  <div
                    key={kw}
                    onClick={() => handlePerformSearch(kw, 'SEARCH_RECENT_CLICKED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-medium cursor-pointer transition-colors group"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={(e) => handleClearRecentItem(e, kw)}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                      title="Hapus"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches Shelf */}
          {trendingKeywords.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Pencarian Sedang Tren Pekan Ini
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {trendingKeywords.map(({ query: tq, growth }) => (
                  <button
                    key={tq}
                    onClick={() => handlePerformSearch(tq, 'SEARCH_POPULAR_CLICKED')}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#121722] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all text-left cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Search className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{tq}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      +{growth}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disarankan Untuk Anda Shelf */}
          {recommendedApps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Disarankan Untuk Anda
                </h2>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('categories')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendedApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => handleSelectAppDirect(app.slug, app.name)}
                    className="p-4 bg-white dark:bg-[#121722] hover:bg-slate-50 dark:hover:bg-[#161d2b] border border-slate-200 dark:border-white/10 hover:border-blue-500/50 rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={app.icon || app.iconUrl || '/icon.png'}
                        alt={app.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 dark:border-white/10 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.name}</h3>
                        <p className="text-[11px] text-slate-400 truncate">{app.developer || app.developerName}</p>
                        <span className="inline-block text-[10px] text-slate-500 mt-0.5">{app.category}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {(app.ratingAverage || app.rating || 4.5).toFixed(1)}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">Lihat Detail</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jelajahi Games Shelf */}
          {gameApps.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-purple-500" />
                  Jelajahi Games Android Populer
                </h2>
                <button
                  onClick={() => {
                    setActiveTab('games');
                    handlePerformSearch('game');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Semua Games</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {gameApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => handleSelectAppDirect(app.slug, app.name)}
                    className="p-4 bg-white dark:bg-[#121722] hover:bg-slate-50 dark:hover:bg-[#161d2b] border border-slate-200 dark:border-white/10 hover:border-purple-500/50 rounded-2xl shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={app.icon || app.iconUrl || '/icon.png'}
                        alt={app.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 dark:border-white/10 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{app.name}</h3>
                        <p className="text-[11px] text-slate-400 truncate">{app.developer || app.developerName}</p>
                        <span className="inline-block text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">{app.category}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {(app.ratingAverage || app.rating || 4.5).toFixed(1)}
                      </span>
                      <span className="text-purple-600 dark:text-purple-400 font-bold">Download APK</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browse By Category Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                Jelajahi Berdasarkan Kategori
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    handlePerformSearch(cat, 'SEARCH_SUGGESTION_CLICKED');
                  }}
                  className="p-3 bg-white dark:bg-[#121722] hover:bg-slate-50 dark:hover:bg-[#161d2b] border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 rounded-2xl text-center transition-all cursor-pointer shadow-xs"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{cat}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {apps.filter(a => a.category === cat).length} aplikasi
                  </p>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
