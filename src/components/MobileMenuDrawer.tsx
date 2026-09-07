import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Home, LayoutGrid, Gamepad2, Search, Compass, 
  Crown, Bell, User as UserIcon, Bookmark, History, 
  Sun, Moon, LogIn, LogOut, ShieldAlert, Sparkles, HelpCircle
} from 'lucide-react';
import { UserRole, SubscriptionPlan } from '../types';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  user: any;
  userRole?: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  unreadNotificationCount?: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  user,
  userRole = 'user',
  subscriptionPlan = 'free',
  unreadNotificationCount = 0,
  darkMode,
  onToggleDarkMode,
  onSignIn,
  onSignOut
}: MobileMenuDrawerProps) {
  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin' || 
    (user && (user.email === 'fantrastore.id@gmail.com' || user.email === 'fahriandriansaputra123@gmail.com' || user.email === 'admin@aeroapk.com'));

  const navItems = [
    { label: 'Beranda', view: 'home', icon: Home },
    { label: 'Aplikasi', view: 'apps', icon: LayoutGrid },
    { label: 'Games', view: 'games', icon: Gamepad2 },
    { label: 'Pencarian', view: 'search', icon: Search },
    { label: 'Kategori', view: 'categories', icon: Compass },
    { label: 'Berlangganan', view: 'subscription', icon: Crown, highlight: true }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex" id="mobile-menu-drawer-container">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="relative ml-auto w-full max-w-xs sm:max-w-sm h-full bg-white dark:bg-[#0f141c] text-slate-900 dark:text-white shadow-2xl flex flex-col border-l border-slate-200 dark:border-white/10 z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Menu Navigasi Mobile"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4.5 border-b border-slate-200 dark:border-white/10">
              <div 
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => {
                  onNavigate('home');
                  onClose();
                }}
              >
                <div className="w-8 h-8 bg-blue-600 text-white rounded-xl font-black text-base flex items-center justify-center shadow-xs">
                  A
                </div>
                <div>
                  <span className="font-black text-base tracking-wider text-slate-900 dark:text-white">AERO</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Discovery & Catalog</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card (if logged in) */}
            {user ? (
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Akun'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-sm">
                      {(user.displayName || user.email || 'A').substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {user.displayName || 'Pengguna Aero'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        subscriptionPlan === 'premium'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}>
                        {subscriptionPlan === 'premium' ? '👑 Premium' : 'Free'}
                      </span>
                      {userRole === 'developer' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Developer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                <button
                  onClick={() => {
                    onSignIn();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk dengan Google</span>
                </button>
              </div>
            )}

            {/* Main Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {/* Owner Home Badge if Admin/Owner */}
              {isOwnerOrAdmin && (
                <button
                  onClick={() => {
                    onNavigate('owner');
                    onClose();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 mb-2"
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>Owner Home (Control Center)</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded font-black">ADMIN</span>
                </button>
              )}

              {/* Standard Public Nav Items */}
              {navItems.map((item) => {
                const isActive = currentView === item.view;
                const Icon = item.icon;

                return (
                  <button
                    key={item.view}
                    onClick={() => {
                      onNavigate(item.view);
                      onClose();
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-black'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.highlight && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-black">
                        Bebas Iklan
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-200 dark:border-white/10 my-2">
                <p className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Akun & Aktivitas
                </p>

                {/* Notifications Link */}
                <button
                  onClick={() => {
                    onNavigate('notifications');
                    onClose();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span>Notifikasi</span>
                  </div>
                  {unreadNotificationCount > 0 && (
                    <span className="min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Saved Apps */}
                <button
                  onClick={() => {
                    onNavigate('bookmarks');
                    onClose();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span>Aplikasi Tersimpan</span>
                </button>

                {/* Riwayat Download */}
                <button
                  onClick={() => {
                    onNavigate('downloads');
                    onClose();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                >
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Riwayat Download</span>
                </button>

                {/* Pengguna / Profile */}
                <button
                  onClick={() => {
                    onNavigate('profile');
                    onClose();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2.5 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Pengguna & Akun</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer with Theme Toggle & Sign Out */}
            <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between gap-2">
              <button
                onClick={onToggleDarkMode}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>{darkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
              </button>

              {user && (
                <button
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
