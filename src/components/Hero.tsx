import React from 'react';
import { Search, Flame, Sparkles } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onTagClick: (tag: string) => void;
}

export default function Hero({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onTagClick
}: HeroProps) {
  const popularTags = ['WhatsApp', 'CapCut', 'Mobile Legends', 'Instagram', 'TikTok', 'Spotify'];

  return (
    <section className="w-full py-8 sm:py-10 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#0c1017] transition-colors" id="hero-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3 select-none">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Katalog & Distribusi Resmi Aplikasi Android</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight font-sans">
          Discover Better Android Apps
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Temukan file APK resmi dan tautan terpercaya untuk aplikasi, games, dan utilitas Android favorit Anda.
        </p>

        {/* Compact Search Bar */}
        <form onSubmit={onSearchSubmit} className="max-w-xl mx-auto mt-5" id="hero-search-form">
          <div className="relative flex items-center p-1 bg-white dark:bg-[#131924] border border-slate-300 dark:border-white/15 rounded-xl shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
            <div className="pl-3 text-slate-400 shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari aplikasi, games, tools..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-2.5 pr-3 py-2 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
              id="hero-search-input"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer whitespace-nowrap"
              id="hero-search-submit"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Populer:
          </span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className="px-2.5 py-0.5 rounded-md bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-[11px] cursor-pointer transition-colors border border-slate-200 dark:border-white/10"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
