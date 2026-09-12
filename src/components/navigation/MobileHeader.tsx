import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { SubscriptionPlan } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import HamburgerMorphIcon from './HamburgerMorphIcon';

interface MobileHeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSearchFocus: () => void;
  isDrawerOpen?: boolean;
  onOpenDrawer: () => void;
  subscriptionPlan?: SubscriptionPlan;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

export default function MobileHeader({
  currentView,
  onNavigate,
  onSearchFocus,
  isDrawerOpen = false,
  onOpenDrawer,
  subscriptionPlan = 'free',
  unreadNotificationCount = 0,
  onOpenNotifications
}: MobileHeaderProps) {
  const { t } = useLanguage();
  const [isBellAnimating, setIsBellAnimating] = useState(false);

  const handleNotificationClick = () => {
    setIsBellAnimating(true);
    setTimeout(() => setIsBellAnimating(false), 220);
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      onNavigate('notifications');
    }
  };

  return (
    <header 
      id="aero-mobile-header"
      className="md:hidden sticky top-0 z-40 w-full h-14 border-b border-slate-200/80 dark:border-white/10 bg-[#ffffff]/90 dark:bg-[#161617]/90 backdrop-blur-md transition-colors"
    >
      <div className="relative w-full h-full px-4 flex items-center justify-between">
        
        {/* Left: Minimal Hamburger Icon */}
        <div className="flex items-center z-20">
          <button
            onClick={onOpenDrawer}
            className="p-2 -ml-1 rounded-full text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 btn-press-feedback cursor-pointer"
            aria-label={t('common.openMenu', 'Buka menu')}
            id="mobile-menu-btn"
          >
            <HamburgerMorphIcon isOpen={isDrawerOpen} className="w-5 h-5" />
          </button>
        </div>

        {/* Center: EXACT CENTER OF VIEWPORT: [LOGO] MOD STATION */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 cursor-pointer select-none btn-press-feedback z-10"
          onClick={() => onNavigate('home')}
          id="mobile-brand-logo"
          role="button"
          tabIndex={0}
          aria-label={t('nav.home', 'Beranda')}
        >
          <img
            src="/assets/mod-station-logo.svg"
            alt="Mod Station Logo"
            className="w-6.5 h-6.5 object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            MOD STATION
          </span>
        </div>

        {/* Right: Notification Action */}
        <div className="flex items-center gap-1 z-20">
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-full text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 btn-press-feedback cursor-pointer"
            aria-label={t('notifications.title', 'Notifikasi')}
            id="mobile-notif-btn"
          >
            <Bell className={`w-5 h-5 ${isBellAnimating ? 'animate-icon-bell' : ''}`} />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
