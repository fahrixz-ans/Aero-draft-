import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, Search, ShieldCheck, ChevronRight, 
  Sparkles, Download, Layers, Star, ChevronDown, ChevronUp,
  ArrowRight, Filter
} from 'lucide-react';
import { AppData } from '../../types';
import Breadcrumb from '../Breadcrumb';
import FollowSocialSection from '../FollowSocialSection';
import { getDevelopersFromApps, DeveloperStat } from '../../utils/developerUtils';

interface AllDevelopersViewProps {
  apps: AppData[];
  onSelectDeveloper: (developerSlug: string) => void;
  onSelectApp: (slug: string) => void;
  onDownloadApp: (e: React.MouseEvent, app: AppData) => void;
  onNavigate: (view: string, slug?: string) => void;
}

const ALPHABET = ['Semua', '#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const ITEMS_PER_PAGE = 12;

export default function AllDevelopersView({
  apps,
  onSelectDeveloper,
  onSelectApp,
  onDownloadApp,
  onNavigate
}: AllDevelopersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [topDevsExpanded, setTopDevsExpanded] = useState(false);

  // Compute all developer stats dynamically from real Firestore apps
  const allDevelopers = useMemo(() => {
    return getDevelopersFromApps(apps);
  }, [apps]);

  // Top developers (first 6 or expanded to 12)
  const topDevelopers = useMemo(() => {
    return allDevelopers.slice(0, topDevsExpanded ? 12 : 6);
  }, [allDevelopers, topDevsExpanded]);

  // Filter developers by search query and alphabet
  const filteredDevelopers = useMemo(() => {
    return allDevelopers.filter(dev => {
      const matchSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchSearch) return false;

      if (selectedLetter === 'Semua') return true;
      if (selectedLetter === '#') {
        return /^[0-9]/.test(dev.name.trim());
      }
      return dev.name.trim().toUpperCase().startsWith(selectedLetter);
    });
  }, [allDevelopers, searchQuery, selectedLetter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDevelopers.length / ITEMS_PER_PAGE) || 1;
  const paginatedDevelopers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDevelopers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDevelopers, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const formatDownloadCount = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B+`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`;
    return `${num}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in" id="all-developers-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        paths={[
          { label: 'Beranda', view: 'home' },
          { label: 'Developer' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Hero Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-[#131924] dark:via-[#111620] dark:to-blue-950/20 border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-500/20">
              <Users className="w-3.5 h-3.5" />
              <span>Direktori Pengembang Terverifikasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Daftar Developer Aplikasi Android
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Temukan profil studio, publisher, dan pengembang aplikasi resmi yang merilis berkas APK aman di platform Mod Station.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama developer..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Top Developers Showcase */}
      <div className="space-y-4" id="top-developers-section">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Top Developer Populer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengembang dengan jumlah unduhan aplikasi terbanyak
              </p>
            </div>
          </div>

          {allDevelopers.length > 6 && (
            <button
              onClick={() => setTopDevsExpanded(!topDevsExpanded)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {topDevsExpanded ? (
                <>
                  <span>Ciutkan</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Lihat Semua Top ({allDevelopers.length})</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topDevelopers.map((dev, idx) => (
            <div
              key={dev.slug}
              onClick={() => onSelectDeveloper(dev.slug)}
              className="p-5 bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4 select-none"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  {dev.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {dev.name}
                    </h3>
                    {dev.verified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="Terverifikasi" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {dev.appCount} Aplikasi
                    </span>
                    <span>·</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {formatDownloadCount(dev.totalDownloads)} Unduhan
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              {/* Preview top 2 apps */}
              {dev.apps.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">Karya:</span>
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    {dev.apps.slice(0, 2).map(app => (
                      <span
                        key={app.id}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate"
                      >
                        {app.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Developer Directory (A-Z) */}
      <div className="space-y-4" id="all-developer-alphabet-section">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Semua Developer (A-Z)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ditemukan {filteredDevelopers.length} developer yang terdaftar
            </p>
          </div>
        </div>

        {/* Alphabet Filter Bar */}
        <div className="p-2 bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-x-auto scrollbar-none flex items-center gap-1 shadow-sm">
          {ALPHABET.map(letter => (
            <button
              key={letter}
              onClick={() => {
                setSelectedLetter(letter);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedLetter === letter
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Paginated Developer Cards */}
        {paginatedDevelopers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedDevelopers.map(dev => (
              <div
                key={dev.slug}
                className="p-5 bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      onClick={() => onSelectDeveloper(dev.slug)}
                      className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 group-hover:bg-blue-600 transition-colors">
                        {dev.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {dev.name}
                          </h4>
                          {dev.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {dev.appCount} Aplikasi · {formatDownloadCount(dev.totalDownloads)} Unduhan
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectDeveloper(dev.slug)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
                      title="Lihat Profil Developer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Top 3 App Previews */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Aplikasi Terpopuler
                    </p>
                    <div className="space-y-1.5">
                      {dev.apps.slice(0, 3).map(app => (
                        <div
                          key={app.id}
                          onClick={() => onSelectApp(app.slug)}
                          className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group/app"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={app.iconUrl || app.icon}
                              alt={app.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-lg object-cover border border-slate-100 dark:border-white/10 shrink-0"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate group-hover/app:text-blue-600 dark:group-hover/app:text-blue-400">
                              {app.name}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 shrink-0 font-medium ml-2">
                            v{app.version}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectDeveloper(dev.slug)}
                  className="w-full py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Buka Semua ({dev.appCount}) Aplikasi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2">
            <Filter className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Tidak ada developer yang cocok dengan filter.
            </p>
            <p className="text-xs text-slate-500">
              Silakan coba kata kunci lain atau pilih huruf abjad 'Semua'.
            </p>
            <button
              onClick={() => {
                setSelectedLetter('Semua');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Sebelumnya
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                Math.abs(pageNum - currentPage) <= 1
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (
                (pageNum === 2 && currentPage > 3) ||
                (pageNum === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return <span key={pageNum} className="text-slate-400 text-xs">...</span>;
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>

      {/* Follow Mod Station */}
      <FollowSocialSection />
    </div>
  );
}
