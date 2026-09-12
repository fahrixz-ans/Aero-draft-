import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  ShieldAlert,
  Code2,
  ChevronRight,
  HeartHandshake,
  Share2,
  Headphones,
  HelpCircle,
  Crown,
  FileText,
  Scale,
  ShieldCheck,
  Home,
  Sparkles,
  LayoutGrid,
  Gamepad2,
  Grid,
  TrendingUp,
  Layers,
  Search,
  Heart,
  History,
  BookOpen,
  User,
  Settings,
  Info,
  Download
} from 'lucide-react';
import { UserRole, SubscriptionPlan } from '../types';
import { useLanguage } from '../context/LanguageContext';

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
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
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
    (user && (
      user.email === 'fahriandriansptr@gmail.com' || 
      user.email === 'fantrastore.id@gmail.com' || 
      user.email === 'fahriandriansaputra123@gmail.com' || 
      user.email === 'admin@aeroapk.com'
    ));

  const isDeveloper = userRole === 'developer' || isOwnerOrAdmin;

  const handleItemClick = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search-results', searchQuery.trim());
      onClose();
    } else {
      onNavigate('search');
      onClose();
    }
  };

  const isItemActive = (view: string) => {
    if (view === 'home' && currentView === 'home') return true;
    if (view === 'search' && currentView === 'search') return true;
    if (view === 'apps' && (currentView === 'apps' || (currentView === 'all' && !window.location.hash.includes('cat')))) return true;
    if (view === 'games' && currentView === 'games') return true;
    if (view === 'categories' && (currentView === 'categories' || currentView === 'all-categories')) return true;
    if (view === 'top-charts' && (currentView === 'top-charts' || currentView === 'popular')) return true;
    if (view === 'for-you' && currentView === 'for-you') return true;
    if (view === 'blog' && (currentView === 'blog' || currentView === 'blog-category' || currentView === 'blog-detail' || currentView === 'blog-search' || currentView === 'articles' || currentView === 'article-detail')) return true;
    if (view === 'bookmarks' && (currentView === 'bookmarks' || currentView === 'saved' || currentView === 'favorites')) return true;
    if (view === 'downloads' && currentView === 'downloads') return true;
    if (view === 'discover' && (currentView === 'discover' || currentView === 'all')) return true;
    if (view === 'donate' && currentView === 'donate') return true;
    if (view === 'social-media' && (currentView === 'social-media' || currentView === 'follow')) return true;
    if (view === 'customer-service' && (currentView === 'customer-service' || currentView === 'contact')) return true;
    if (view === 'help-center' && (currentView === 'help-center' || currentView === 'faq' || currentView === 'help-ai-assistant' || currentView === 'help-articles')) return true;
    if (view === 'subscription' && (currentView === 'subscription' || currentView === 'premium')) return true;
    if (view === 'dmca' && currentView === 'dmca') return true;
    if (view === 'terms' && currentView === 'terms') return true;
    if (view === 'privacy' && currentView === 'privacy') return true;
    if (view === 'admin' && (currentView === 'admin' || currentView === 'owner-console')) return true;
    if (view === 'developer-dashboard' && (currentView === 'developer-dashboard' || currentView === 'developer-console')) return true;
    if (view === 'account' && currentView === 'account') return true;
    if (view === 'settings' && currentView === 'settings') return true;
    return currentView === view;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex" id="mobile-menu-drawer-container">
          {/* Backdrop with Apple-style smooth blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Slide-in Menu Panel - iOS Style (85% width on mobile, rounded right corners) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[85%] max-w-sm sm:max-w-md h-full bg-[#fbfbfd] dark:bg-[#161617] text-slate-900 dark:text-white flex flex-col z-10 overflow-y-auto border-r border-slate-200/80 dark:border-white/10 shadow-2xl rounded-r-2xl sm:rounded-r-3xl"
            role="dialog"
            aria-modal="true"
            aria-label={t('common.openMenu', 'Menu Navigasi Mod Station')}
          >
            {/* Top Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#fbfbfd]/95 dark:bg-[#161617]/95 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10">
              <div 
                className="flex items-center gap-2.5 cursor-pointer select-none"
                onClick={() => handleItemClick('home')}
              >
                <img
                  src="/assets/mod-station-logo.svg"
                  alt="Mod Station"
                  className="w-6 h-6 object-contain shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white uppercase">
                  MOD STATION
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleDarkMode}
                  className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 btn-press-feedback cursor-pointer"
                  aria-label={darkMode ? t('settings.theme.light', 'Terang') : t('settings.theme.dark', 'Gelap')}
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 btn-close-effect cursor-pointer"
                  aria-label={t('common.close', 'Tutup menu')}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Menu Content Container */}
            <div className="flex-1 px-4 py-3 space-y-4 text-sm">
              
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari di Mod Station..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </form>

              {/* SECTION: UTAMA */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  UTAMA
                </p>
                <nav className="space-y-0.5">
                  {[
                    { id: 'home', label: 'Beranda', view: 'home', icon: Home },
                    { id: 'today', label: 'Hari Ini', view: 'articles', icon: Sparkles },
                    { id: 'apps', label: 'Aplikasi', view: 'apps', icon: LayoutGrid },
                    { id: 'games', label: 'Game', view: 'games', icon: Gamepad2 },
                    { id: 'blog', label: 'Blog', view: 'blog', icon: BookOpen },
                    { id: 'categories', label: 'Kategori', view: 'categories', icon: Grid },
                    { id: 'charts', label: 'Bagan', view: 'top-charts', icon: TrendingUp },
                    { id: 'collections', label: 'Koleksi', view: 'for-you', icon: Layers },
                    { id: 'search', label: 'Cari', view: 'search', icon: Search }
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.view);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.view)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* SECTION: AKTIVITAS */}
              <div className="space-y-1 pt-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  AKTIVITAS
                </p>
                <nav className="space-y-0.5">
                  {[
                    { id: 'saved', label: 'Disimpan', view: 'bookmarks', icon: Heart },
                    { id: 'downloads', label: 'Riwayat Unduhan', view: 'downloads', icon: History },
                    { id: 'library', label: 'Perpustakaan', view: 'discover', icon: BookOpen }
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.view);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.view)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* SECTION: MOD STATION (Role-Based Consoles) */}
              {(isOwnerOrAdmin || isDeveloper) && (
                <div className="space-y-1 pt-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    MOD STATION
                  </p>
                  <nav className="space-y-0.5">
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => handleItemClick('admin')}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                          isItemActive('admin')
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>Owner Console</span>
                        </div>
                      </button>
                    )}

                    {isDeveloper && (
                      <button
                        onClick={() => handleItemClick('developer-dashboard')}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                          isItemActive('developer-dashboard')
                            ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Code2 className="w-4 h-4 shrink-0" />
                          <span>Developer Console</span>
                        </div>
                      </button>
                    )}
                  </nav>
                </div>
              )}

              {/* SECTION: LAYANAN */}
              <div className="space-y-1 pt-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  LAYANAN
                </p>
                <nav className="space-y-0.5">
                  {[
                    { id: 'donate', label: 'Donasi', view: 'donate', icon: HeartHandshake },
                    { id: 'social', label: 'Media Sosial', view: 'social-media', icon: Share2 },
                    { id: 'contact', label: 'Hubungi Kami', view: 'customer-service', icon: Headphones },
                    { id: 'help', label: 'Pusat Bantuan', view: 'help-center', icon: HelpCircle },
                    { id: 'premium', label: 'Premium', view: 'subscription', icon: Crown }
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.view);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.view)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* SECTION: AKUN */}
              <div className="space-y-1 pt-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  AKUN
                </p>
                <nav className="space-y-0.5">
                  {[
                    { id: 'account', label: 'Profil', view: 'account', icon: User },
                    { id: 'settings', label: 'Pengaturan', view: 'settings', icon: Settings }
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.view);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.view)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* SECTION: INFORMASI */}
              <div className="space-y-1 pt-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  INFORMASI
                </p>
                <nav className="space-y-0.5">
                  {[
                    { id: 'about', label: 'Tentang Kami', view: 'about', icon: Info },
                    { id: 'dmca', label: 'DMCA', view: 'dmca', icon: FileText },
                    { id: 'terms', label: 'Syarat & Ketentuan', view: 'terms', icon: Scale },
                    { id: 'privacy', label: 'Kebijakan Privasi', view: 'privacy', icon: ShieldCheck }
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.view);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.view)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* SECTION: DOWNLOAD CARD */}
              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2.5 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Mod Station untuk Android
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Akses lebih cepat di perangkat
                  </p>
                </div>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/api/public/download-modstation-client';
                    link.setAttribute('download', 'mod-station.apk');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Unduh Aplikasi</span>
                </button>
              </div>

              {/* Authentication Status CTA */}
              <div className="pt-1 pb-4">
                {user ? (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Akun'}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/10"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {(user.displayName || user.email || 'M').substring(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.displayName || 'Pengguna'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSignOut();
                        onClose();
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onSignIn();
                      onClose();
                    }}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk</span>
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
