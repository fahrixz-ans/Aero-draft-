import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';

interface BlogNavbarProps {
  onBack?: () => void;
  onOpenSearch?: () => void;
  onOpenDrawer?: () => void;
  title?: string;
}

export default function BlogNavbar({
  onBack,
  onOpenSearch,
  title = 'Mod Station Blog'
}: BlogNavbarProps) {
  return (
    <div className="w-full bg-white/80 dark:bg-[#1C1C1E]/80 border-b border-slate-200/60 dark:border-white/10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-3">
        {/* Left Side: Back Button & Sub-title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm sm:text-base tracking-tight text-slate-800 dark:text-slate-200 line-clamp-1">
              {title}
            </span>
          </div>
        </div>

        {/* Right Side: Search Icon */}
        {onOpenSearch && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Cari Blog"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

