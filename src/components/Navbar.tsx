import React, { useState } from 'react';
import { 
  Download, Sun, Moon, Menu, X, Search, Grid, HelpCircle, LogIn, LogOut, 
  Bookmark, User as UserIcon, ChevronDown, ShieldAlert, Bell, Compass, 
  Layers, History, Settings, ShieldCheck, Heart
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSearchFocus: () => void;
  user: any;
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
  onSignIn,
  onSignOut,
  unreadNotificationCount = 0,
  onOpenNotifications
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { label: 'Beranda', view: 'home' },
    { label: 'Eksplorasi', view: 'discover' },
    { label: 'Kategori', view: 'categories' },
    { label: 'Koleksi', view: 'collections' },
    { label: 'Bandingkan', view: 'compare' },
    { label: 'Dukung Aero', view: 'donate' },
    ...(user ? [{ label: 'Tersimpan', view: 'bookmarks' }] : [])
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border-slate-200/80 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => {
              onNavigate('home');
              setIsOpen(false);
            }}
            id="nav-logo"
          >
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl font-extrabold text-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-md shadow-blue-500/20 select-none">
              A
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white">
                AERO
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  id={`nav-item-${item.view}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-extrabold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={onSearchFocus}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Cari Aplikasi"
              id="desktop-search-trigger"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
            
            <button
              onClick={onToggleDarkMode}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
              id="theme-toggle"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  onNavigate('notifications');
                }
              }}
              className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Pusat Notifikasi"
              id="notification-bell-btn"
              aria-label="Buka Pusat Notifikasi"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Google Sign-In / Auth Button */}
            {user === null ? (
              <button
                onClick={onSignIn}
                id="signin-btn"
                className="ml-1.5 flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Masuk</span>
              </button>
            ) : (
              <div className="relative ml-1.5">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer"
                  id="profile-dropdown-trigger"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User Avatar"}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-lg text-xs font-bold">
                      {(user.displayName || user.email || 'A').substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                    {user.displayName?.split(' ')[0] || 'Akun'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#13161C] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-fade-in">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.02]">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">{user.displayName || 'Pengguna Aero'}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                      >
                        <UserIcon className="h-4 w-4 text-blue-500" />
                        <span>Profil & Ringkasan</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('bookmarks');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Bookmark className="h-4 w-4 text-blue-500" />
                        <span>Aplikasi Tersimpan</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('downloads');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                      >
                        <History className="h-4 w-4 text-emerald-500" />
                        <span>Riwayat Unduhan</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('notifications');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Bell className="h-4 w-4 text-amber-500" />
                        <span>Pusat Notifikasi</span>
                      </button>

                      {user && (user.email === 'fahriandriansaputra123@gmail.com' || user.email === 'admin@aeroapk.com') && (
                        <button
                          onClick={() => {
                            onNavigate('admin');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 dark:border-white/5"
                        >
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                          <span>Panel Moderator & Admin</span>
                        </button>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSignOut();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5 cursor-pointer"
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

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={onSearchFocus}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              id="mobile-search-trigger"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              id="mobile-theme-toggle"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Toggle menu"
              id="mobile-menu-trigger"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu panel */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0f19] transition-colors">
          <div className="px-4 pt-3 pb-6 space-y-1.5">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    onNavigate(item.view);
                    setIsOpen(false);
                  }}
                  id={`mobile-nav-item-${item.view}`}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5">
              <button
                onClick={() => {
                  onNavigate('downloads');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5"
              >
                <History className="w-4 h-4 text-emerald-500" />
                <span>Riwayat Unduhan</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('notifications');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Notifikasi</span>
                </div>
                {unreadNotificationCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-black">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5"
                  >
                    <UserIcon className="w-4 h-4 text-blue-500" />
                    <span>Profil & Pengaturan Akun</span>
                  </button>

                  <button
                    onClick={() => {
                      onSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Akun ({user.displayName?.split(' ')[0] || user.email})</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onSignIn();
                    setIsOpen(false);
                  }}
                  className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Akun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
