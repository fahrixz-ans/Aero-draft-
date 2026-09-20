import React from 'react';
import { X } from 'lucide-react';

interface OwnerConsoleHeaderProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onNavigateHome?: () => void;
}

export default function OwnerConsoleHeader({
  isMenuOpen,
  onToggleMenu,
  onNavigateHome
}: OwnerConsoleHeaderProps) {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-md">
      
      {/* Left: Hamburger Button with 2 horizontal lines (=) toggled to (×) */}
      <div className="flex items-center">
        <button
          onClick={onToggleMenu}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
          title={isMenuOpen ? "Tutup Menu" : "Buka Navigasi Console"}
          aria-label={isMenuOpen ? "Tutup Menu" : "Buka Navigasi Console"}
        >
          {isMenuOpen ? (
            <X className="w-5 h-5 text-emerald-400" />
          ) : (
            <div className="w-5 h-4 flex flex-col justify-between items-center py-0.5">
              <span className="w-5 h-0.5 bg-slate-200 rounded-full transition-all"></span>
              <span className="w-5 h-0.5 bg-slate-200 rounded-full transition-all"></span>
            </div>
          )}
        </button>
      </div>

      {/* Center: Brand Logo + Text "OWNER CONSOLE" centered relative to viewport */}
      <div 
        onClick={onNavigateHome}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 cursor-pointer select-none"
      >
        <img
          src="/assets/mod-station-logo.svg"
          alt="Mod Station Logo"
          className="w-6.5 h-6.5 sm:w-7 sm:h-7 object-contain shrink-0 pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <span className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-bold">|</span>
        <span className="text-sm sm:text-base font-black tracking-widest text-white uppercase whitespace-nowrap">
          OWNER CONSOLE
        </span>
      </div>

      {/* Right: Empty */}
      <div className="w-10"></div>

    </header>
  );
}
