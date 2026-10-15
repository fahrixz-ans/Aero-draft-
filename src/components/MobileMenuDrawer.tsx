import React, { useEffect, useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  LayoutGrid, 
  Gamepad2, 
  Search, 
  Repeat, 
  User, 
  Sparkles, 
  FolderTree, 
  BookOpen, 
  Bell, 
  Heart, 
  BookMarked, 
  HeartHandshake, 
  Crown, 
  Settings, 
  Headphones, 
  HelpCircle, 
  Info, 
  ShieldCheck, 
  FileText, 
  Scale, 
  LayoutDashboard, 
  UserCheck, 
  BarChart3, 
  Star, 
  Smartphone, 
  Layers, 
  BookmarkCheck, 
  Layout, 
  Flag, 
  ShieldAlert, 
  ScanLine, 
  TrendingUp, 
  BarChart2, 
  Download, 
  HardDrive, 
  Cpu, 
  Activity, 
  Database, 
  Globe, 
  Brain, 
  Users, 
  Key, 
  History, 
  Send, 
  Instagram, 
  MessageSquare, 
  MessageCircle, 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut,
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { UserRole, SubscriptionPlan, AppData } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  user: any;
  userRole?: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  apps?: AppData[];
}

interface SocialLinks {
  telegram?: string;
  instagram?: string;
  discord?: string;
  whatsapp?: string;
  [key: string]: string | undefined;
}

const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  telegram: 'https://t.me/modstation_official',
  instagram: 'https://instagram.com/modstation.id',
  discord: 'https://discord.gg/modstation',
  whatsapp: 'https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k'
};

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  user,
  userRole = 'user',
  subscriptionPlan = 'free',
  unreadNotificationCount = 0,
  onOpenNotifications,
  darkMode,
  onToggleDarkMode,
  onSignIn,
  onSignOut,
  apps = []
}: MobileMenuDrawerProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputId = useId();

  // Social links live state from Firestore doc(db, 'settings', 'socials')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS);
  const [editingSocialPlatform, setEditingSocialPlatform] = useState<string | null>(null);
  const [editingSocialUrl, setEditingSocialUrl] = useState<string>('');
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialSaveSuccess, setSocialSaveSuccess] = useState(false);

  // Subscribe to real Firestore social links
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      const docRef = doc(db, 'settings', 'socials');
      unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SocialLinks;
          setSocialLinks(prev => ({ ...prev, ...data }));
        }
      }, (err) => {
        console.warn('Social settings offline or permission denied:', err.message);
      });
    } catch (e: any) {
      console.warn('Failed to listen to social links:', e?.message);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Determine Effective Role
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin' || 
    (user && (
      user.email === 'fahriandriansptr@gmail.com' || 
      user.email === 'fantrastore.id@gmail.com' || 
      user.email === 'fahriandriansaputra123@gmail.com' || 
      user.email === 'admin@aeroapk.com'
    ));

  const effectiveRole: 'owner' | 'user' = isOwnerOrAdmin ? 'owner' : 'user';

  // Mode State: 'user' | 'owner'
  const [currentMode, setCurrentMode] = useState<'user' | 'owner'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('modstation_nav_mode');
      if (saved === 'owner' && isOwnerOrAdmin) return 'owner';
      if (saved === 'user') return 'user';
    }
    return isOwnerOrAdmin ? 'owner' : 'user';
  });

  // Keep mode in sync if permissions change
  useEffect(() => {
    if (!isOwnerOrAdmin && currentMode !== 'user') {
      setCurrentMode('user');
    }
  }, [isOwnerOrAdmin, currentMode]);

  // Toggle Mode between User and Owner Console
  const handleSwitchMode = () => {
    if (isOwnerOrAdmin) {
      setCurrentMode(prev => {
        const next = prev === 'user' ? 'owner' : 'user';
        if (typeof window !== 'undefined') sessionStorage.setItem('modstation_nav_mode', next);
        return next;
      });
    }
  };

  // Prefers reduced motion check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Prevent background scroll and compensate for scrollbar width when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const handleItemClick = (view: string, slug?: string) => {
    if (view === 'notifications' && onOpenNotifications) {
      onOpenNotifications();
    } else {
      onNavigate(view, slug);
    }
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', searchQuery.trim());
      onClose();
    } else {
      onNavigate('search');
      onClose();
    }
  };

  // Save Social Link (Owner Only)
  const handleSaveSocial = async () => {
    if (!editingSocialPlatform || !isOwnerOrAdmin) return;
    try {
      setSavingSocial(true);
      const docRef = doc(db, 'settings', 'socials');
      await setDoc(docRef, { [editingSocialPlatform]: editingSocialUrl.trim() }, { merge: true });
      setSocialLinks(prev => ({ ...prev, [editingSocialPlatform]: editingSocialUrl.trim() }));
      setSocialSaveSuccess(true);
      setTimeout(() => {
        setSocialSaveSuccess(false);
        setEditingSocialPlatform(null);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to save social link:', err);
    } finally {
      setSavingSocial(false);
    }
  };

  // Active status check
  const isItemActive = (view: string, slug?: string) => {
    if (view === 'home' && currentView === 'home') return true;
    if (view === 'search' && currentView === 'search') return true;
    if (view === 'apps' && (currentView === 'apps' || (currentView === 'all' && !window.location.hash.includes('cat')))) return true;
    if (view === 'games' && currentView === 'games') return true;
    if (view === 'categories' && (currentView === 'categories' || currentView === 'all-categories')) return true;
    if (view === 'blog' && (currentView === 'blog' || currentView === 'articles')) return true;
    if (view === 'bookmarks' && (currentView === 'bookmarks' || currentView === 'saved')) return true;
    if (view === 'discover' && currentView === 'discover') return true;
    if (view === 'donate' && currentView === 'donate') return true;
    if (view === 'subscription' && currentView === 'subscription') return true;
    if (view === 'settings' && currentView === 'settings') return true;
    if (view === 'customer-service' && (currentView === 'customer-service' || currentView === 'contact')) return true;
    if (view === 'help-center' && currentView === 'help-center') return true;
    if (view === 'about' && currentView === 'about') return true;
    if (view === 'privacy' && currentView === 'privacy') return true;
    if (view === 'dmca' && currentView === 'dmca') return true;
    if (view === 'terms' && currentView === 'terms') return true;
    if (view === 'account' && currentView === 'account') return true;
    if (view === 'today' && currentView === 'today') return true;
    if (view === 'developer-dashboard' && currentView === 'developer-dashboard') return true;
    if (view === 'admin' && currentView === 'admin') return true;
    return currentView === view;
  };

  // Filter actual apps from Fantra
  const fantraApps = apps.filter(app => {
    const dev = (app.developer || '').toLowerCase();
    const name = (app.name || '').toLowerCase();
    return dev.includes('fantra') || dev.includes('mod station') || name.includes('mod station');
  });

  // Animation variants: TOP TO BOTTOM reveal on open, BOTTOM TO TOP collapse on close
  const overlayVariants = {
    closed: {
      y: prefersReducedMotion ? 0 : '-100%',
      opacity: prefersReducedMotion ? 0 : 0.95,
      transition: {
        duration: 0.28,
        ease: [0.32, 0, 0.67, 0] // smooth exit upwards
      }
    },
    open: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1] // smooth enter downwards
      }
    }
  };

  // Nav Button Renderer
  const renderNavButton = (item: { id: string; label: string; view: string; slug?: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const active = isItemActive(item.view, item.slug);
    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item.view, item.slug)}
        id={`menu-item-${item.id}`}
        type="button"
        className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left ${
          active
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
            : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
          <span className="truncate">{item.label}</span>
        </div>
        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
        )}
      </button>
    );
  };

  // Categorized Navigation Items per Blueprint Specification
  const UTAMA_ITEMS = [
    { id: 'home', label: 'Beranda', view: 'home', icon: Home },
    { id: 'apps', label: 'Aplikasi', view: 'apps', icon: LayoutGrid },
    { id: 'games', label: 'Games', view: 'games', icon: Gamepad2 },
    { id: 'search', label: 'Cari', view: 'search', icon: Search },
    { id: 'today', label: 'Hari Ini', view: 'today', icon: Sparkles }
  ];

  const JELAJAH_ITEMS = [
    { id: 'categories', label: 'Kategori', view: 'categories', icon: FolderTree },
    { id: 'all-developers', label: 'Semua Developer', view: 'all-developers', icon: Users },
    { id: 'blog', label: 'Blog', view: 'blog', icon: BookOpen },
    { id: 'bookmarks', label: 'Di Simpan', view: 'bookmarks', icon: Heart },
    { id: 'discover', label: 'Perpustakaan', view: 'discover', icon: BookMarked }
  ];

  const AKUN_ITEMS = [
    { id: 'profile', label: 'Profil', view: 'account', icon: User },
    { id: 'notifications', label: 'Notifikasi', view: 'notifications', icon: Bell },
    { id: 'settings', label: 'Pengaturan', view: 'settings', icon: Settings }
  ];

  const LAYANAN_ITEMS = [
    { id: 'donate', label: 'Donasi', view: 'donate', icon: HeartHandshake },
    { id: 'contact', label: 'Hubungi Kami', view: 'customer-service', icon: Headphones },
    { id: 'help', label: 'Pusat Bantuan', view: 'help-center', icon: HelpCircle }
  ];

  const INFORMASI_ITEMS = [
    { id: 'about', label: 'Tentang Kami', view: 'about', icon: Info },
    { id: 'privacy', label: 'Kebijakan Privasi', view: 'privacy', icon: ShieldCheck },
    { id: 'dmca', label: 'DMCA', view: 'dmca', icon: FileText },
    { id: 'terms', label: 'S&K', view: 'terms', icon: Scale }
  ];

  // Developer Workspace Items
  const DEVELOPER_WORKSPACE_ITEMS = [
    { id: 'dev-dashboard', label: 'Dashboard', view: 'developer-dashboard', icon: LayoutDashboard },
    { id: 'dev-profile', label: 'Profil Developer', view: 'all-developers', icon: UserCheck },
    { id: 'dev-analytics', label: 'Analytic Developer', view: 'developer-dashboard', icon: BarChart3 },
    { id: 'dev-reviews', label: 'Review', view: 'developer-dashboard', icon: Star },
    { id: 'dev-app-list', label: 'Daftar Aplikasi', view: 'developer-dashboard', icon: Smartphone }
  ];

  // Grouped Owner Workspace Items
  const OWNER_CONTENT_ITEMS = [
    { id: 'apps', label: 'Apps', view: 'admin', slug: 'apps', icon: Smartphone },
    { id: 'versions', label: 'Version', view: 'admin', slug: 'versions', icon: Layers },
    { id: 'collections', label: 'Collection', view: 'admin', slug: 'collections', icon: BookmarkCheck },
    { id: 'homepage', label: 'Homepage', view: 'admin', slug: 'homepage', icon: Layout },
    { id: 'recommendations', label: 'Recommendation', view: 'admin', slug: 'recommendations', icon: Sparkles },
    { id: 'ranking-engine', label: 'Ranking & Trending', view: 'admin', slug: 'ranking-engine', icon: BarChart3 },
    { id: 'banners', label: 'Banners', view: 'admin', slug: 'banners', icon: Flag },
    { id: 'featured', label: 'Featured', view: 'admin', slug: 'featured', icon: Star }
  ];

  const OWNER_MODERATION_ITEMS = [
    { id: 'moderation', label: 'Moderation Queue', view: 'admin', slug: 'moderation', icon: ShieldAlert },
    { id: 'reports', label: 'Report', view: 'admin', slug: 'reports', icon: FileText },
    { id: 'reviews', label: 'Review', view: 'admin', slug: 'reviews', icon: Star },
    { id: 'security-center', label: 'Security Center', view: 'admin', slug: 'security-center', icon: ShieldCheck },
    { id: 'security-scans', label: 'APK Scan', view: 'admin', slug: 'security-scans', icon: ScanLine }
  ];

  const OWNER_ANALYTICS_ITEMS = [
    { id: 'analytics-apps', label: 'Analytic', view: 'admin', slug: 'analytics-apps', icon: TrendingUp },
    { id: 'analytics-overview', label: 'Overview', view: 'admin', slug: 'analytics-overview', icon: BarChart2 },
    { id: 'analytics-search', label: 'Search & Traffic', view: 'admin', slug: 'analytics-search', icon: Search },
    { id: 'analytics-downloads', label: 'Download', view: 'admin', slug: 'analytics-downloads', icon: Download },
    { id: 'system-storage', label: 'Storage', view: 'admin', slug: 'system-storage', icon: HardDrive }
  ];

  const OWNER_SYSTEM_ITEMS = [
    { id: 'system-jobs', label: 'Jobs', view: 'admin', slug: 'system-jobs', icon: Cpu },
    { id: 'system-health', label: 'System Health', view: 'admin', slug: 'system-health', icon: Activity },
    { id: 'system-search', label: 'Search Index', view: 'admin', slug: 'system-search', icon: Database },
    { id: 'seo', label: 'SEO Intelligence', view: 'admin', slug: 'seo', icon: Globe },
    { id: 'ai-discovery', label: 'AI Discovery', view: 'admin', slug: 'ai-discovery', icon: Brain }
  ];

  const OWNER_ADMIN_ITEMS = [
    { id: 'access-admins', label: 'Administrators', view: 'admin', slug: 'access-admins', icon: Users },
    { id: 'access-roles', label: 'Role & Permission', view: 'admin', slug: 'access-roles', icon: Key },
    { id: 'access-audit', label: 'Audit Logs', view: 'admin', slug: 'access-audit', icon: History }
  ];

  // Social Media items list
  const SOCIAL_CHANNELS = [
    { id: 'telegram', name: 'Telegram', key: 'telegram', icon: Send, defaultUrl: DEFAULT_SOCIAL_LINKS.telegram },
    { id: 'instagram', name: 'Instagram', key: 'instagram', icon: Instagram, defaultUrl: DEFAULT_SOCIAL_LINKS.instagram },
    { id: 'discord', name: 'Discord', key: 'discord', icon: MessageSquare, defaultUrl: DEFAULT_SOCIAL_LINKS.discord },
    { id: 'whatsapp', name: 'WhatsApp', key: 'whatsapp', icon: MessageCircle, defaultUrl: DEFAULT_SOCIAL_LINKS.whatsapp }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="global-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={t('common.openMenu', 'Menu Navigasi Mod Station')}
          className="fixed inset-0 z-40 pointer-events-auto select-none"
        >
          {/* Subtle backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Full Screen Overlay Surface: 100vw x 100dvh, Top to Bottom reveal */}
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-40 pt-14 bg-[#fbfbfd] dark:bg-[#161617] text-slate-900 dark:text-white flex flex-col w-screen h-[100dvh] overflow-hidden shadow-2xl"
          >
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:px-12 py-5">
              <div className="max-w-4xl mx-auto space-y-6">

                {/* 1. SEARCH INPUT */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <form onSubmit={handleSearchSubmit} className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <label htmlFor={searchInputId} className="sr-only">
                      Cari di Mod Station
                    </label>
                    <input
                      id={searchInputId}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari aplikasi, game, atau developer..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all shadow-2xs"
                    />
                  </form>

                  {/* Controls: Mode Tag, Dark/Light Toggle, Auth Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    
                    {/* Switch / Mode Indicator (Only for OWNER / ADMIN) */}
                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        onClick={handleSwitchMode}
                        id="quick-nav-switch"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all cursor-pointer text-xs font-bold"
                        aria-label="Ganti mode workspace"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Mode: {currentMode === 'owner' ? 'Owner Console' : 'Pengguna'}</span>
                      </button>
                    )}



                    {/* Auth Status / Sign In */}
                    {user ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSignOut();
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold border border-red-200/60 dark:border-red-900/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Keluar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSignIn();
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Masuk</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. CATEGORIZED GENERAL NAVIGATION */}
                {currentMode !== 'owner' && (
                  <div className="space-y-6">
                    
                    {/* UTAMA */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                        UTAMA
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {UTAMA_ITEMS.map(renderNavButton)}
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/80 dark:bg-white/10 my-2" />

                    {/* JELAJAH */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                        JELAJAH
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {JELAJAH_ITEMS.map(renderNavButton)}
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/80 dark:bg-white/10 my-2" />

                    {/* AKUN */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                        AKUN
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {AKUN_ITEMS.map(renderNavButton)}
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/80 dark:bg-white/10 my-2" />

                    {/* LAYANAN */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                        LAYANAN
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {LAYANAN_ITEMS.map(renderNavButton)}
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/80 dark:bg-white/10 my-2" />

                    {/* INFORMASI */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                        INFORMASI
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {INFORMASI_ITEMS.map(renderNavButton)}
                      </div>
                    </div>

                  </div>
                )}

                {/* 3. OWNER WORKSPACE (When Mode = OWNER) */}

                {/* OWNER WORKSPACE (When Mode = OWNER) */}
                {currentMode === 'owner' && (
                  <div className="space-y-6 pt-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        OWNER WORKSPACE
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold">
                        Superadmin
                      </span>
                    </div>
                    
                    {/* Grouped Owner Sections */}
                    <div className="space-y-4">
                      
                      {/* CONTENT */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          KONTEN & DESAIN
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {OWNER_CONTENT_ITEMS.map(renderNavButton)}
                        </div>
                      </div>

                      {/* MODERATION */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          MODERASI & KEAMANAN
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {OWNER_MODERATION_ITEMS.map(renderNavButton)}
                        </div>
                      </div>

                      {/* ANALYTICS */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          ANALYTICS & METRIK
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {OWNER_ANALYTICS_ITEMS.map(renderNavButton)}
                        </div>
                      </div>

                      {/* SYSTEM */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          SISTEM & PERFORMA
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {OWNER_SYSTEM_ITEMS.map(renderNavButton)}
                        </div>
                      </div>

                      {/* ADMINISTRATION */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          ADMINISTRASI & HAK AKSES
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {OWNER_ADMIN_ITEMS.map(renderNavButton)}
                        </div>
                      </div>

                    </div>

                    {/* OWNER SOCIAL MEDIA MANAGEMENT SECTION */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Pengaturan Social Media
                        </h4>
                        <span className="text-[10px] text-slate-400">Data Aktual Firestore</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SOCIAL_CHANNELS.map((ch) => {
                          const Icon = ch.icon;
                          const currentUrl = socialLinks[ch.key] || ch.defaultUrl;
                          const isEditingThis = editingSocialPlatform === ch.key;

                          return (
                            <div 
                              key={ch.id} 
                              className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {ch.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isEditingThis) {
                                      setEditingSocialPlatform(null);
                                    } else {
                                      setEditingSocialPlatform(ch.key);
                                      setEditingSocialUrl(currentUrl || '');
                                    }
                                  }}
                                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-0.5 rounded cursor-pointer"
                                >
                                  {isEditingThis ? 'Batal' : 'Edit'}
                                </button>
                              </div>

                              {isEditingThis ? (
                                <div className="space-y-2 pt-1">
                                  <input
                                    type="url"
                                    value={editingSocialUrl}
                                    onChange={(e) => setEditingSocialUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-black/30 border border-slate-300 dark:border-white/20 rounded-lg text-xs text-slate-900 dark:text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleSaveSocial}
                                    disabled={savingSocial}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                                  >
                                    {savingSocial ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : socialSaveSuccess ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <span>Simpan Link</span>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {currentUrl || 'Belum diatur'}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* 4. DOWNLOAD MOD STATION ACTION CARD */}
                <div className="pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xl shrink-0 text-white">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Download Mod Station
                        </h4>
                        <p className="text-[11px] text-blue-100">
                          Dapatkan aplikasi resmi Mod Station untuk kemudahan akses installer APK & MOD.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const modApp = fantraApps.length > 0 ? fantraApps[0] : null;
                        if (modApp) {
                          handleItemClick('app-detail', modApp.slug || modApp.id);
                        } else {
                          handleItemClick('apps');
                        }
                      }}
                      className="shrink-0 px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-600 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Unduh Aplikasi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 5. SOCIAL MEDIA SECTION (1-2-1 Diamond Layout) */}
                <div className="pt-6 border-t border-slate-200/70 dark:border-white/10 space-y-3 text-center">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      SOCIAL MEDIA
                    </p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Follow Akun Social Media Mod Station
                    </p>
                  </div>

                  {/* Exact 1-2-1 Diamond/Cross Layout */}
                  <div className="flex flex-col items-center gap-2 max-w-xs mx-auto pt-1">
                    {/* TOP: Telegram */}
                    {SOCIAL_CHANNELS.find(c => c.key === 'telegram') && (
                      <a
                        href={socialLinks.telegram || DEFAULT_SOCIAL_LINKS.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="menu-social-telegram"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer w-44 justify-center"
                      >
                        <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Telegram</span>
                      </a>
                    )}

                    {/* MIDDLE: Discord & WhatsApp */}
                    <div className="flex items-center justify-center gap-2 w-full">
                      {SOCIAL_CHANNELS.find(c => c.key === 'discord') && (
                        <a
                          href={socialLinks.discord || DEFAULT_SOCIAL_LINKS.discord}
                          target="_blank"
                          rel="noopener noreferrer"
                          id="menu-social-discord"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer min-w-[125px] justify-center"
                        >
                          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Discord</span>
                        </a>
                      )}
                      {SOCIAL_CHANNELS.find(c => c.key === 'whatsapp') && (
                        <a
                          href={socialLinks.whatsapp || DEFAULT_SOCIAL_LINKS.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          id="menu-social-whatsapp"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer min-w-[125px] justify-center"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {/* BOTTOM: Instagram */}
                    {SOCIAL_CHANNELS.find(c => c.key === 'instagram') && (
                      <a
                        href={socialLinks.instagram || DEFAULT_SOCIAL_LINKS.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="menu-social-instagram"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer w-44 justify-center"
                      >
                        <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <span>Instagram</span>
                      </a>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-3">
                    Mod Station &copy; {new Date().getFullYear()} &bull; Fantra Ecosystem
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
