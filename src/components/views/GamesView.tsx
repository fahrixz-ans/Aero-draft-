import React, { useState, useMemo } from 'react';
import { Star, Download, ChevronRight, Sparkles, Flame, Clock, Gamepad2, ShieldCheck } from 'lucide-react';
import { AppData, DownloadHistoryRecord } from '../../types';
import AppCard from '../AppCard';

interface GamesViewProps {
  apps: AppData[];
  onNavigate: (view: string, slug?: string) => void;
  onSelectApp: (slug: string) => void;
  onDownloadApp?: (e: React.MouseEvent, app: AppData) => void;
  downloadHistory?: DownloadHistoryRecord[];
  currentUser?: any;
  userRole?: any;
  subscriptionPlan?: any;
  banners?: any;
}

function isGameApp(app: AppData): boolean {
  if (!app) return false;
  const category = (app.category || '').toLowerCase().trim();
  const id = (app.id || '').toLowerCase();
  const slug = (app.slug || '').toLowerCase();
  const type = ((app as any).type || '').toLowerCase();

  return (
    category === 'games' ||
    category === 'game' ||
    category === 'permainan' ||
    category === 'action' ||
    category === 'casual' ||
    category === 'arcade' ||
    category === 'rpg' ||
    category === 'strategy' ||
    category === 'simulation' ||
    category === 'puzzle' ||
    category === 'adventure' ||
    type === 'game' ||
    id === 'mobile-legends' ||
    id === 'subway-surfers' ||
    id === 'minecraft' ||
    id === 'genshin' ||
    id === 'pubg' ||
    id === 'freefire' ||
    id === 'mlbb' ||
    slug === 'mobile-legends' ||
    slug === 'subway-surfers'
  );
}

export default function GamesView({
  apps = [],
  onNavigate,
  onSelectApp,
  onDownloadApp,
  downloadHistory = []
}: GamesViewProps) {
  const [activeTab, setActiveTab] = useState<'for-you' | 'popular' | 'new'>('for-you');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter only real games
  const gameApps = useMemo(() => {
    return apps.filter(isGameApp);
  }, [apps]);

  // Extract game sub-categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    gameApps.forEach(g => {
      if (g.category && g.category.trim()) {
        set.add(g.category.trim());
      }
    });
    return Array.from(set);
  }, [gameApps]);

  const forYouGames = useMemo(() => {
    return [...gameApps].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [gameApps]);

  const popularGames = useMemo(() => {
    return [...gameApps].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  }, [gameApps]);

  const newGames = useMemo(() => {
    return [...gameApps].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.releaseDate || 0).getTime();
      const dateB = new Date(b.updatedAt || b.releaseDate || 0).getTime();
      return dateB - dateA;
    });
  }, [gameApps]);

  const displayedGames = useMemo(() => {
    let source = activeTab === 'popular' ? popularGames : activeTab === 'new' ? newGames : forYouGames;
    if (selectedCategory !== 'all') {
      source = source.filter(g => (g.category || '').toLowerCase().trim() === selectedCategory.toLowerCase().trim());
    }
    return source;
  }, [activeTab, selectedCategory, forYouGames, popularGames, newGames]);

  const handleDownload = (e: React.MouseEvent, app: AppData) => {
    if (onDownloadApp) {
      onDownloadApp(e, app);
    } else {
      onSelectApp(app.slug || app.id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8" id="games-page-container">
      {/* Title Header */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Game
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Jelajahi game Android paling seru, grafis terbaik, dan gameplay terpopuler.
        </p>
      </div>

      {/* Horizontal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/10 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'for-you', label: 'Pilihan Game', icon: Sparkles },
          { id: 'popular', label: 'Paling Populer', icon: Flame },
          { id: 'new', label: 'Rilis Terbaru', icon: Clock }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Genre Filter Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15'
            }`}
          >
            Semua Genre
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Featured Game Shelf */}
      {selectedCategory === 'all' && forYouGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Game Unggulan
            </h2>
            <button 
              onClick={() => setActiveTab('for-you')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Lihat semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
            {forYouGames.slice(0, 8).map(game => (
              <div
                key={`shelf-game-${game.id}`}
                onClick={() => onSelectApp(game.slug || game.id)}
                className="w-40 sm:w-44 shrink-0 snap-start p-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group flex flex-col items-center text-center select-none"
              >
                <img
                  src={game.iconUrl || game.icon}
                  alt={game.name}
                  referrerPolicy="no-referrer"
                  className="w-18 h-18 rounded-[16px] object-cover shadow-2xs group-hover:scale-105 transition-transform mb-2.5 border border-black/5 dark:border-white/10"
                />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {game.name}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 w-full mt-0.5">
                  {game.category}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span>{game.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Games Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeTab === 'popular' ? 'Game Terpopuler' : activeTab === 'new' ? 'Game Baru & Update' : 'Daftar Game'}
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {displayedGames.length} Game
          </span>
        </div>

        {displayedGames.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#1c1c1e] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Tidak ada game yang ditemukan untuk kategori ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedGames.map(game => (
              <AppCard
                key={game.id}
                app={game}
                onSelect={(s) => onSelectApp(s)}
                onDownload={handleDownload}
                downloadHistory={downloadHistory}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
