import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, ChevronDown, Calendar, HardDrive, Cpu, Star, X, Sparkles, Building, Layers } from 'lucide-react';
import { AppData, FilterState, SortOption } from '../types';
import { CATEGORIES } from '../data/appsData';
import { trackAnalyticsEvent } from '../utils/analytics';
import { recordSearchQuery } from '../services';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onFiltersChange: (newFilters: FilterState) => void;
  sortBy: SortOption;
  onSortChange: (newSort: SortOption) => void;
  totalResults: number;
  apps?: AppData[];
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  totalResults,
  apps = []
}: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);

  // Extract unique developers for developer filter
  const developers = Array.from(new Set(apps.map(a => a.developer).filter(Boolean))).sort();

  // Sync state if searchQuery prop changes externally
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

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

  return (
    <div className="w-full space-y-4" id="search-filter-module">
      {/* Search Input and Toggles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Cari nama aplikasi, pengembang, atau kategori..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-semibold focus:border-blue-500 focus:outline-none transition-all shadow-sm"
            id="search-input-field"
            autoComplete="off"
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue('');
                onSearchChange('');
              }}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 btn-close-effect cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
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

