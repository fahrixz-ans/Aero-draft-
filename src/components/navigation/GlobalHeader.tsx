import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import HamburgerMorphIcon from './HamburgerMorphIcon';
import { useLanguage } from '../../context/LanguageContext';

interface GlobalHeaderProps {
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onNavigate: (view: string, slug?: string) => void;
  isOwnerConsole?: boolean;
  className?: string;
}

/**
 * GlobalHeader
 * The universal top navigation bar for Mod Station & Owner Console across all viewports and pages.
 * 
 * Strict specifications from blueprint & user mandate:
 * - LEFT: Hamburger toggle ("=" closed, "×" open) with >=44px touch target.
 * - CENTER: Mathematically centered [LOGO] + Animated Title ("MOD STATION" <-> "OWNER CONSOLE").
 * - Character-by-character morph animation with stagger delay on state switch.
 * - RIGHT: STRICTLY EMPTY (KOSONG). No notifications, profile, search, diamond, or extra buttons.
 * - THEME: Full support for light and dark modes with glassmorphism blur.
 * - A11Y: aria-label, aria-expanded, aria-controls, keyboard-accessible (Tab, Enter, Space, Escape).
 */
export default function GlobalHeader({
  isDrawerOpen,
  onToggleDrawer,
  onNavigate,
  isOwnerConsole = false,
  className = ""
}: GlobalHeaderProps) {
  const { t } = useLanguage();

  const titleText = isOwnerConsole ? "OWNER CONSOLE" : "MOD STATION";
  const letters = titleText.split('');

  return (
    <header
      id="mod-station-global-header"
      className={`sticky top-0 z-50 w-full h-14 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#161617]/90 backdrop-blur-md transition-colors ${className}`}
    >
      <div className="relative w-full h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        
        {/* LEFT AREA: Hamburger Button ("=" when closed, "×" when open) */}
        <div className="flex items-center z-20">
          <button
            type="button"
            id="global-hamburger-btn"
            onClick={onToggleDrawer}
            aria-expanded={isDrawerOpen}
            aria-controls="global-navigation-drawer"
            aria-label={isDrawerOpen ? t('common.close', 'Tutup menu') : t('common.openMenu', 'Buka menu')}
            className="w-11 h-11 -ml-1 rounded-xl flex items-center justify-center text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 transition-all cursor-pointer select-none"
          >
            <HamburgerMorphIcon isOpen={isDrawerOpen} className="w-5 h-5" />
          </button>
        </div>

        {/* CENTER AREA: Pinned to exact viewport center [LOGO] + Character Morphing Title */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none z-10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1.5 transition-transform active:scale-98"
          onClick={() => onNavigate(isOwnerConsole ? 'admin' : 'home')}
          id="global-brand-logo"
          role="button"
          tabIndex={0}
          aria-label={isOwnerConsole ? "Owner Console Dashboard" : "Mod Station - Beranda"}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate(isOwnerConsole ? 'admin' : 'home');
            }
          }}
        >
          <img
            src="/assets/mod-station-logo.svg"
            alt="Mod Station Logo"
            className="w-6.5 h-6.5 sm:w-7 sm:h-7 object-contain shrink-0 pointer-events-none"
            referrerPolicy="no-referrer"
          />
          
          <div className="relative overflow-hidden py-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={titleText}
                className="flex items-center text-[14px] sm:text-[15px] font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap"
              >
                {letters.map((char, index) => (
                  <motion.span
                    key={`${titleText}-${index}`}
                    initial={{ opacity: 0, y: -10, filter: 'blur(3px)', scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                    exit={{ opacity: 0, y: 10, filter: 'blur(3px)', scale: 0.85 }}
                    transition={{
                      duration: 0.22,
                      delay: index * 0.02,
                      type: 'spring',
                      stiffness: 350,
                      damping: 26
                    }}
                    className="inline-block"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT AREA: STRICTLY EMPTY (KOSONG) as required by blueprint & user mandate */}
        <div
          className="w-11 h-11 shrink-0 pointer-events-none opacity-0 select-none"
          aria-hidden="true"
        />

      </div>
    </header>
  );
}

