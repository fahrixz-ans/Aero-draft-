import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, Moon, Menu, Search, LogIn, LogOut, 
  Bookmark, User as UserIcon, ChevronDown, Bell, 
  Crown, History, LayoutGrid, Gamepad2, Compass, Home, ShieldAlert
} from 'lucide-react';
import { UserRole, SubscriptionPlan } from '../types';
import MobileMenuDrawer from './MobileMenuDrawer';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearchFocus: () => void;
  user: any;
  userRole?: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  onSignIn: () => void;
  onSignOut: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  onSearchFocus,
  user,
  userRole = 'user',
  subscriptionPlan = 'free',
  onSignIn,
  onSignOut,
  unreadNotificationCount = 0,
  onOpenNotifications
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin' || 
    (user && (user.email === 'fahriandriansptr@gmail.com' || user.email === 'fantrastore.id@gmail.com' || user.email === 'fahriandriansaputra123@gmail.com' || user.email === 'admin@aeroapk.com'));

  const navItems = [
    { label: 'Beranda', view: 'home' },
    { label: 'Aplikasi', view: 'apps' },
    { label: 'Games', view: 'games' },
    { label: 'Pencarian', view: 'search' },
    { label: 'Kategori', view: 'categories' },
    ...(isOwnerOrAdmin ? [{ label: '👑 Owner Home', view: 'owner', isAdmin: true }] : []),
    { label: 'Berlangganan', view: 'subscription', highlight: true }
  ];

  const handleNotificationClick = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      onNavigate('notifications');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0f19] transition-colors" id="aero-top-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-15">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center gap-6">
              <div 
                className="flex items-center gap-2.5 cursor-pointer group select-none"
                onClick={() => onNavigate('home')}
                id="nav-logo"
              >
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg font-black text-base flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-black tracking-wider text-slate-900 dark:text-white leading-none">
                    AERO
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
                    App Discovery
                  </span>
                </div>
              </div>

              {/* Desktop Nav Items */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => onNavigate(item.view)}
                      id={`nav-item-${item.view}`}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        item.isAdmin 
                          ? isActive 
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 font-black'
                            : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                          : isActive
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-black'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right: Desktop Actions & User Controls */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Search Shortcut */}
              <button
                onClick={onSearchFocus}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Pencarian Cepat"
                id="desktop-search-trigger"
                aria-label="Cari aplikasi dan games"
              >
                <Search className="h-4.5 w-4.5" />
              </button>

              {/* Theme Switcher */}
              <button
                onClick={onToggleDarkMode}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title={darkMode ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
                id="theme-toggle"
                aria-label="Toggle tema tampilan"
              >
                {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
              </button>

              {/* Notification Bell */}
              <button
                onClick={handleNotificationClick}
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Pusat Notifikasi"
                id="notification-bell-btn"
                aria-label="Buka Pusat Notifikasi"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* User Sign In / Profile Dropdown */}
              {user === null ? (
                <button
                  onClick={onSignIn}
                  id="signin-btn"
                  className="ml-1.5 flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Masuk</span>
                </button>
              ) : (
                <div className="relative ml-1.5" ref={profileDropdownRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    id="profile-dropdown-trigger"
                    aria-label="Menu akun pengguna"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-blue-600/10 text-blue-600 flex items-center justify-center rounded-md text-xs font-bold">
                        {(user.displayName || user.email || 'A').substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                      {user.displayName?.split(' ')[0] || 'Akun'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {/* Desktop Profile Dropdown (Quick Profile) */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-fade-in">
                      {/* User Header */}
                      <div className="p-3.5 bg-slate-50 dark:bg-white/[0.02]">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {user.displayName || 'Pengguna Aero'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                        
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            subscriptionPlan === 'premium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                          }`}>
                            {subscriptionPlan === 'premium' ? '👑 Premium (Bebas Iklan)' : 'Free Plan'}
                          </span>
                          {userRole === 'developer' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Developer
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onNavigate('profile');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                        >
                          <UserIcon className="h-4 w-4 text-blue-500" />
                          <span>Kelola Akun Anda</span>
                        </button>

                        <button
                          onClick={() => {
                            onNavigate('bookmarks');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Bookmark className="h-4 w-4 text-blue-500" />
                          <span>Aplikasi Tersimpan</span>
                        </button>

                        <button
                          onClick={() => {
                            onNavigate('downloads');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                        >
                          <History className="h-4 w-4 text-emerald-500" />
                          <span>Riwayat Download</span>
                        </button>

                        <button
                          onClick={() => {
                            onNavigate('notifications');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Bell className="h-4 w-4 text-amber-500" />
                          <span>Pusat Notifikasi</span>
                        </button>

                        <button
                          onClick={() => {
                            onNavigate('subscription');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span>Status Berlangganan</span>
                        </button>

                        {isOwnerOrAdmin && (
                          <button
                            onClick={() => {
                              onNavigate('owner');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 dark:border-white/5"
                          >
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                            <span>Owner Home (Admin Panel)</span>
                          </button>
                        )}
                      </div>

                      {/* Sign Out */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onSignOut();
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Keluar Akun</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Top Controls: [ Bell | Profile | Hamburger ] */}
            <div className="flex md:hidden items-center gap-1">
              {/* Notification Bell */}
              <button
                onClick={handleNotificationClick}
                className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Buka notifikasi"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-3.5 h-3.5 px-0.5 bg-red-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Profile Icon Shortcut */}
              <button
                onClick={() => user ? onNavigate('profile') : onSignIn()}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Profil Pengguna"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profil"
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-md object-cover"
                  />
                ) : (
                  <UserIcon className="h-4.5 w-4.5" />
                )}
              </button>

              {/* Mobile Drawer Hamburger Trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Buka menu navigasi"
                id="mobile-menu-trigger"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Section 14 & 15) */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
        user={user}
        userRole={userRole}
        subscriptionPlan={subscriptionPlan}
        unreadNotificationCount={unreadNotificationCount}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />
    </>
  );
}
