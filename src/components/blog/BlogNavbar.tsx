import React from 'react';
import { ArrowLeft, Search, Menu } from 'lucide-react';

interface BlogNavbarProps {
  onBack?: () => void;
  onOpenSearch?: () => void;
  onOpenDrawer?: () => void;
  title?: string;
}

export default function BlogNavbar({
  onBack,
  onOpenSearch,
  onOpenDrawer,
  title = 'Mod Station Blog'
}: BlogNavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-white/10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left Side: Back Button & Logo/Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer btn-press-feedback shrink-0"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-xs shrink-0">
              M
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white line-clamp-1">
                {title}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Search Icon & Hamburger Menu Icon */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer btn-press-feedback"
            aria-label="Cari Blog"
          >
            <Search className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenDrawer}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer btn-press-feedback"
            aria-label="Buka Menu Blog"
          >
            <Menu className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
