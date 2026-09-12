import React, { useState } from 'react';
import { Search, Sun, Moon, Bell, Menu, PanelLeft, LogIn } from 'lucide-react';
import AccountMenu from './AccountMenu';
import { UserRole, SubscriptionPlan } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface DesktopHeaderProps {
  currentView: string;
  categoryFilter?: string;
  onNavigate: (view: string, slug?: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearchFocus: () => void;
  onToggleSidebar?: () => void;
  user: any;
  userRole?: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  onSignIn: () => void;
  onSignOut: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

export default function DesktopHeader({
  currentView,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  onSearchFocus,
  onToggleSidebar,
  user,
  userRole = 'user',
  subscriptionPlan = 'free',
  onSignIn,
  onSignOut,
  unreadNotificationCount = 0,
  onOpenNotifications
}: DesktopHeaderProps) {
  const [searchHovered, setSearchHovered] = useState(false);
  const [isBellAnimating, setIsBellAnimating] = useState(false);
  const { t } = useLanguage();

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
      id="aero-desktop-header"
      className="hidden md:block sticky top-0 z-40 w-full h-14 border-b border-slate-200/80 dark:border-white/10 bg-[#ffffff]/90 dark:bg-[#161617]/90 backdrop-blur-md transition-colors"
    >
      <div className="relative w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* 1. LEFT AREA: Minimal Sidebar Toggle Button */}
        <div className="flex items-center gap-2 z-20">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 btn-press-feedback cursor-pointer"
              title={t('common.openMenu', 'Buka menu')}
              id="desktop-toggle-sidebar-btn"
              aria-label={t('common.openMenu', 'Buka menu')}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. EXACT CENTER OF VIEWPORT: Brand Logo + MOD STATION */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 cursor-pointer select-none group btn-press-feedback z-10"
          onClick={() => onNavigate('home')}
          id="desktop-brand-logo"
          role="button"
          tabIndex={0}
          aria-label={t('nav.home', 'Beranda')}
        >
          <img
            src="/assets/mod-station-logo.svg"
            alt="Mod Station Logo"
            className="w-7 h-7 object-contain group-hover:scale-105 transition-transform shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="font-extrabold text-[15px] sm:text-base tracking-tight text-slate-900 dark:text-white">
            MOD STATION
          </span>
        </div>

        {/* 3. RIGHT AREA: Notification, Dark Mode & Account */}
        <div className="flex items-center gap-2 sm:gap-2.5 z-20">
          
          {/* Simple Bell Notification with small dot indicator */}
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 btn-press-feedback cursor-pointer"
            title={t('notifications.title', 'Notifications')}
            id="desktop-notifications-btn"
            aria-label={t('notifications.title', 'Notifikasi')}
          >
            <Bell className={`w-4.5 h-4.5 ${isBellAnimating ? 'animate-icon-bell' : ''}`} />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-[#161617]" />
            )}
          </button>

          {/* Subtle Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={darkMode ? t('settings.theme.light', 'Terang') : t('settings.theme.dark', 'Gelap')}
            id="desktop-theme-toggle"
            aria-label={darkMode ? t('settings.theme.light', 'Terang') : t('settings.theme.dark', 'Gelap')}
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Account: Guest vs Logged In */}
          {user === null ? (
            <button
              onClick={onSignIn}
              id="desktop-signin-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('common.login', 'Masuk')}</span>
            </button>
          ) : (
            <AccountMenu
              user={user}
              userRole={userRole}
              subscriptionPlan={subscriptionPlan}
              onNavigate={onNavigate}
              onSignOut={onSignOut}
            />
          )}
        </div>
      </div>
    </header>
  );
}
