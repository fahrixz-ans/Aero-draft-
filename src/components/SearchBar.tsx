import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Filter, RotateCcw, ChevronDown, Calendar, HardDrive, 
  Cpu, Star, X, Sparkles, Building, Layers, Clock, ArrowUpLeft, 
  Trash2, TrendingUp, Tag
} from 'lucide-react';
import { AppData, FilterState, SortOption, SearchHistoryRecord } from '../types';
import { CATEGORIES } from '../data/appsData';
import { trackAnalyticsEvent } from '../utils/analytics';
import { recordSearchQuery } from '../services';
import { getSearchHistory, clearSearchHistory as clearStorageSearchHistory } from '../services/userService';
import ActiveFilterChips, { FilterChipItem } from './common/ActiveFilterChips';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onFiltersChange: (newFilters: FilterState) => void;
  sortBy: SortOption;
  onSortChange: (newSort: SortOption) => void;
  totalResults: number;
  apps?: AppData[];
  searchHistory?: (string | SearchHistoryRecord)[];
  onClearSearchHistory?: () => void;
  onRemoveHistoryItem?: (query: string) => void;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  totalResults,
  apps = [],
  searchHistory,
  onClearSearchHistory,
  onRemoveHistoryItem
}: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [localHistory, setLocalHistory] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external searchHistory prop with internal string array state
  useEffect(() => {
    if (searchHistory && searchHistory.length > 0) {
      const strings = searchHistory
        .map(item => (typeof item === 'string' ? item : item?.query))
        .filter((q): q is string => Boolean(q && q.trim()));
      setLocalHistory(Array.from(new Set(strings)));
    } else {
      const stored = getSearchHistory();
      const strings = stored.map(s => s.query).filter(Boolean);
      setLocalHistory(strings);
    }
  }, [searchHistory]);

  // Extract unique developers for developer filter
  const developers = Array.from(new Set(apps.map(a => a.developer).filter(Boolean))).sort();

  // Sync state if searchQuery prop changes externally
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Handle click outside to dismiss auto-complete popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search trigger and analytics search tracking
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(inputValue);
      const clean = inputValue.trim();
      if (clean.length >= 2) {
        trackAnalyticsEvent('application_search', null, clean);
        recordSearchQuery(clean, totalResults);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [inputValue, onSearchChange, totalResults]);

  // Calculate auto-complete suggestions based on user input and history
  const { matchingHistory, matchingApps, popularSuggestions } = useMemo(() => {
    const cleanQuery = inputValue.trim().toLowerCase();

    if (!cleanQuery) {
      // Empty input: show latest past queries
      return {
        matchingHistory: localHistory.slice(0, 6),
        matchingApps: [],
        popularSuggestions: ['WhatsApp', 'Minecraft', 'Spotify', 'Instagram', 'CapCut']
      };
    }

    // Filter past queries that contain the search term
    const historyMatches = localHistory
      .filter(h => h.toLowerCase().includes(cleanQuery))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(cleanQuery);
        const bStarts = b.toLowerCase().startsWith(cleanQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length;
      })
      .slice(0, 6);

    // Matching apps from database for rich auto-complete preview
    const appMatches = apps
      .filter(app => {
        const nameMatch = app.name.toLowerCase().includes(cleanQuery);
        const devMatch = (app.developer || '').toLowerCase().includes(cleanQuery);
        const catMatch = (app.category || '').toLowerCase().includes(cleanQuery);
        return nameMatch || devMatch || catMatch;
      })
      .slice(0, 3);

    return {
      matchingHistory: historyMatches,
      matchingApps: appMatches,
      popularSuggestions: []
    };
  }, [inputValue, localHistory, apps]);

  const allSuggestionsCount = matchingHistory.length + matchingApps.length;

  const handleSelectQuery = (query: string) => {
    setInputValue(query);
    onSearchChange(query);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleRemoveHistory = (e: React.MouseEvent, queryToRemove: string) => {
    e.stopPropagation();
    const updated = localHistory.filter(q => q.toLowerCase() !== queryToRemove.toLowerCase());
    setLocalHistory(updated);

    if (onRemoveHistoryItem) {
      onRemoveHistoryItem(queryToRemove);
    } else {
      try {
        const raw = localStorage.getItem('aero_guest_search_history');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const newStored = parsed.filter((r: any) => 
              (typeof r === 'string' ? r : r.query)?.toLowerCase() !== queryToRemove.toLowerCase()
            );
            localStorage.setItem('aero_guest_search_history', JSON.stringify(newStored));
          }
        }
      } catch {}
    }
  };

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalHistory([]);
    if (onClearSearchHistory) {
      onClearSearchHistory();
    } else {
      clearStorageSearchHistory();
    }
  };

  // Keyboard navigation for auto-complete dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (allSuggestionsCount > 0) {
        setActiveIndex(prev => (prev < allSuggestionsCount - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (allSuggestionsCount > 0) {
        setActiveIndex(prev => (prev > 0 ? prev - 1 : allSuggestionsCount - 1));
      }
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < matchingHistory.length) {
        e.preventDefault();
        handleSelectQuery(matchingHistory[activeIndex]);
      } else if (activeIndex >= matchingHistory.length && activeIndex < allSuggestionsCount) {
        e.preventDefault();
        const app = matchingApps[activeIndex - matchingHistory.length];
        if (app) handleSelectQuery(app.name);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Tab' && matchingHistory.length > 0 && activeIndex === -1) {
      // Auto-complete with first matching history query
      setInputValue(matchingHistory[0]);
    }
  };

  const handleReset = () => {
    setInputValue('');
    onSearchChange('');
    onFiltersChange({
      category: '',
      developer: '',
      rating: '',
      version: '',
      recentlyUpdated: false,
      size: '',
      minAndroid: '',
      updatedDateRange: ''
    });
    onSortChange('popular');
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'sort') return false;
    return v !== '' && v !== false && v !== undefined;
  }).length;

  // Active filter chips data
  const activeChips: FilterChipItem[] = useMemo(() => {
    const list: FilterChipItem[] = [];

    if (searchQuery && searchQuery.trim()) {
      list.push({
        id: 'chip-query',
        label: 'Kata Kunci',
        value: `"${searchQuery}"`,
        icon: <Search className="w-3 h-3 text-blue-500" />,
        onRemove: () => {
          setInputValue('');
          onSearchChange('');
        }
      });
    }

    if (filters.category) {
      list.push({
        id: 'chip-category',
        label: 'Kategori',
        value: filters.category,
        icon: <Layers className="w-3 h-3 text-blue-500" />,
        onRemove: () => handleFilterChange('category', '')
      });
    }

    if (filters.developer) {
      list.push({
        id: 'chip-developer',
        label: 'Pengembang',
        value: filters.developer,
        icon: <Building className="w-3 h-3 text-blue-500" />,
        onRemove: () => handleFilterChange('developer', '')
      });
    }

    if (filters.rating) {
      list.push({
        id: 'chip-rating',
        label: 'Rating',
        value: `≥ ${filters.rating} ★`,
        icon: <Star className="w-3 h-3 text-amber-500 fill-amber-500" />,
        onRemove: () => handleFilterChange('rating', '')
      });
    }

    if (filters.size) {
      const sizeLabels: Record<string, string> = {
        small: 'Kecil (< 40 MB)',
        medium: 'Sedang (40 - 100 MB)',
        large: 'Besar (> 100 MB)'
      };
      list.push({
        id: 'chip-size',
        label: 'Ukuran',
        value: sizeLabels[filters.size] || filters.size,
        icon: <HardDrive className="w-3 h-3 text-blue-500" />,
        onRemove: () => handleFilterChange('size', '')
      });
    }

    if (filters.minAndroid) {
      list.push({
        id: 'chip-android',
        label: 'Android Minimal',
        value: `Android ${filters.minAndroid}`,
        icon: <Cpu className="w-3 h-3 text-blue-500" />,
        onRemove: () => handleFilterChange('minAndroid', '')
      });
    }

    if (filters.updatedDateRange) {
      const rangeLabels: Record<string, string> = {
        '7-days': '7 Hari Terakhir',
        '30-days': '30 Hari Terakhir',
        '90-days': '90 Hari Terakhir'
      };
      list.push({
        id: 'chip-updated',
        label: 'Pembaruan',
        value: rangeLabels[filters.updatedDateRange] || filters.updatedDateRange,
        icon: <Calendar className="w-3 h-3 text-blue-500" />,
        onRemove: () => handleFilterChange('updatedDateRange', '')
      });
    }

    if (filters.recentlyUpdated) {
      list.push({
        id: 'chip-recent',
        label: 'Status',
        value: 'Baru Diperbarui',
        icon: <Sparkles className="w-3 h-3 text-amber-500" />,
        onRemove: () => handleFilterChange('recentlyUpdated', false)
      });
    }

    return list;
  }, [searchQuery, filters, onSearchChange]);

  // Helper to highlight matching substrings in autocomplete suggestions
  const highlightMatch = (text: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return <span>{text}</span>;
    const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (index === -1) return <span>{text}</span>;

    const before = text.substring(0, index);
    const match = text.substring(index, index + trimmed.length);
    const after = text.substring(index + trimmed.length);

    return (
      <span className="inline-flex items-center">
        {before}
        <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/20 px-0.5 rounded">
          {match}
        </span>
        {after}
      </span>
    );
  };

  const showDropdown = isOpen && (
    matchingHistory.length > 0 || 
    matchingApps.length > 0 || 
    (isFocused && popularSuggestions.length > 0)
  );

  return (
    <div className="w-full space-y-4" id="search-filter-module">
      {/* Search Input and Toggles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1" ref={containerRef}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 z-10">
            <Search className="h-5 w-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari nama aplikasi, pengembang, atau kategori..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              setIsFocused(true);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-semibold focus:border-blue-500 focus:outline-none transition-all shadow-sm"
            id="search-input-field"
            autoComplete="off"
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue('');
                onSearchChange('');
                setIsOpen(false);
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 btn-close-effect cursor-pointer z-10"
              title="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Auto-Complete Suggestions Dropdown */}
          {showDropdown && (
            <div 
              className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#13161F] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-fade-in"
              id="search-autocomplete-dropdown"
            >
              {/* Past Search Queries Section */}
              {matchingHistory.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {inputValue.trim() ? 'Saran Riwayat Pencarian' : 'Pencarian Terakhir'}
                    </span>
                    {!inputValue.trim() && localHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllHistory}
                        className="text-slate-400 hover:text-rose-500 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus Semua
                      </button>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {matchingHistory.map((query, idx) => {
                      const isSelected = activeIndex === idx;
                      return (
                        <div
                          key={`history-${query}-${idx}`}
                          onClick={() => handleSelectQuery(query)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                            <span className="truncate">
                              {highlightMatch(query, inputValue)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={(e) => handleRemoveHistory(e, query)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                              title="Hapus dari riwayat"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <ArrowUpLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 opacity-60 group-hover:opacity-100" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matching Apps Section */}
              {matchingApps.length > 0 && (
                <div className="p-2 space-y-1 bg-slate-50/50 dark:bg-white/[0.01]">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Aplikasi Terkait
                  </div>

                  <div className="space-y-0.5">
                    {matchingApps.map((app, idx) => {
                      const itemIndex = matchingHistory.length + idx;
                      const isSelected = activeIndex === itemIndex;
                      return (
                        <div
                          key={`app-${app.id}`}
                          onClick={() => handleSelectQuery(app.name)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {app.icon || app.iconUrl ? (
                              <img
                                src={app.iconUrl || app.icon}
                                alt={app.name}
                                className="w-6 h-6 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {app.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0 truncate">
                              <span className="block truncate font-bold">
                                {highlightMatch(app.name, inputValue)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {app.developer} • {app.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0 ml-2">
                            <span className="text-amber-500">★</span> {app.rating || app.ratingAverage || '4.5'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Popular Searches for Fresh Sessions */}
              {matchingHistory.length === 0 && !inputValue.trim() && popularSuggestions.length > 0 && (
                <div className="p-3 space-y-2 bg-slate-50/50 dark:bg-white/[0.01]">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    Paling Sering Dicari
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popularSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSelectQuery(item)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer navigation hint */}
              <div className="px-3 py-1.5 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                <span>Gunakan <strong className="font-mono">↑ ↓</strong> untuk navigasi, <strong className="font-mono">Enter</strong> untuk memilih</span>
                <span><strong className="font-mono">Esc</strong> untuk tutup</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            id="filter-toggle-button"
            className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-bold btn-press-feedback cursor-pointer ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-50/20 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : 'bg-white dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
            }`}
          >
            <Filter className="h-4.5 w-4.5" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-black text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sorting Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              id="sorting-select"
              className="w-full sm:w-52 appearance-none pl-4 pr-10 py-3.5 bg-white dark:bg-[#13161C] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="popular">Terpopuler</option>
              <option value="trending">🔥 Sedang Tren</option>
              <option value="updated">Baru Diperbarui</option>
              <option value="latest">Terbaru Ditambahkan</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="a-z">Nama A-Z</option>
              <option value="z-a">Nama Z-A</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter panel */}
      {showFilters && (
        <div className="p-5 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-150 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 transition-all duration-300" id="advanced-filter-panel">
          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Layers className="h-3 w-3 text-slate-400" /> Kategori
            </label>
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                id="filter-category"
                className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-450">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Developer Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Building className="h-3 w-3 text-slate-400" /> Pengembang
            </label>
            <div className="relative">
              <select
                value={filters.developer || ''}
                onChange={(e) => handleFilterChange('developer', e.target.value)}
                id="filter-developer"
                className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Semua Pengembang</option>
                {developers.map((dev) => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-450">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500" /> Rating Minimal
            </label>
            <div className="relative">
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                id="filter-rating"
                className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Semua Rating</option>
                <option value="4.5">★ 4.5 ke atas</option>
                <option value="4.2">★ 4.2 ke atas</option>
                <option value="4.0">★ 4.0 ke atas</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-450">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Android SDK Requirement */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Cpu className="h-3 w-3 text-slate-400" /> Versi Android
            </label>
            <div className="relative">
              <select
                value={filters.version}
                onChange={(e) => handleFilterChange('version', e.target.value)}
                id="filter-version"
                className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Semua Versi</option>
                <option value="Android 5.0+">Android 5.0+</option>
                <option value="Android 6.0+">Android 6.0+</option>
                <option value="Android 7.0+">Android 7.0+</option>
                <option value="Android 8.0+">Android 8.0+</option>
                <option value="Android 9.0+">Android 9.0+</option>
                <option value="Android 10+">Android 10+</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-450">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* File Size Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <HardDrive className="h-3 w-3 text-slate-400" /> Ukuran Berkas
            </label>
            <div className="relative">
              <select
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                id="filter-size"
                className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Semua Ukuran</option>
                <option value="small">Kecil (&lt; 40 MB)</option>
                <option value="medium">Sedang (40 - 100 MB)</option>
                <option value="large">Besar (&gt; 100 MB)</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-450">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Date range for last updated */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" /> Waktu Pembaruan
            </label>
            <div className="relative">
              <select
                value={filters.updatedDateRange}
                onChange={(e) => handleFilterChange('updatedDateRange', e.target.value)}
                id="filter-updated-range"
                className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Semua Waktu</option>
                <option value="7-days">7 Hari Terakhir</option>
                <option value="30-days">30 Hari Terakhir</option>
                <option value="90-days">90 Hari Terakhir</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-450">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Recently updated & reset */}
          <div className="col-span-1 sm:col-span-2 md:col-span-3 xl:col-span-6 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 pt-2 border-t border-slate-150 dark:border-white/5">
            <label className="flex items-center gap-2 py-2 px-3 bg-white dark:bg-[#0F1115] border border-slate-150 dark:border-white/10 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.recentlyUpdated}
                onChange={(e) => handleFilterChange('recentlyUpdated', e.target.checked)}
                id="filter-recent"
                className="accent-blue-500 h-4 w-4 rounded cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Hanya Tampilkan Aplikasi Baru Diperbarui
              </span>
            </label>

            <button
              onClick={handleReset}
              id="filter-reset-button"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer transition-colors text-xs font-extrabold"
              title="Atur Ulang Filter"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Chips with X remove buttons */}
      {activeChips.length > 0 && (
        <ActiveFilterChips
          chips={activeChips}
          onClearAll={handleReset}
        />
      )}

      {/* Result statistics strip */}
      <div className="flex items-center justify-between text-xs text-slate-450 font-semibold" id="search-result-stats">
        <span>Menampilkan <strong className="text-slate-800 dark:text-slate-200">{totalResults}</strong> aplikasi terverifikasi</span>
        {(searchQuery || activeFiltersCount > 0) && (
          <button
            onClick={handleReset}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold cursor-pointer hover:underline"
          >
            Bersihkan pencarian & filter
          </button>
        )}
      </div>
    </div>
  );
}
