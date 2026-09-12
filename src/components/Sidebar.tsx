import React from 'react';
import { 
  Home, 
  LayoutGrid, 
  Gamepad2, 
  Grid, 
  TrendingUp, 
  Sparkles, 
  Heart, 
  Download, 
  BookOpen, 
  User, 
  Settings, 
  Info,
  ShieldCheck,
  Code2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../types';
import { STORE_NAV_ITEMS, LIBRARY_NAV_ITEMS, SYSTEM_NAV_ITEMS } from '../config/navigation';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  userRole?: UserRole;
  user?: any;
  unreadNotificationCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  userRole = 'user',
  user,
  unreadNotificationCount = 0,
  collapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const { t } = useLanguage();
  
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin' || 
    (user && (
      user.email === 'fahriandriansptr@gmail.com' || 
      user.email === 'fantrastore.id@gmail.com' || 
      user.email === 'fahriandriansaputra123@gmail.com' || 
      user.email === 'admin@aeroapk.com'
    ));

  const isDeveloper = userRole === 'developer' || isOwnerOrAdmin;

  // Function to calculate active route
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
    if (view === 'profile' && (currentView === 'profile' || currentView === 'account' || currentView === 'saya')) return true;
    if (view === 'settings-security' && (currentView === 'settings-security' || currentView === 'settings')) return true;
    if (view === 'about' && currentView === 'about') return true;
    return currentView === view;
  };

  const getNavItemLabel = (item: any) => {
    if (item.id === 'account') return t('nav.profile', 'Profil');
    return t('nav.' + item.id, item.label);
  };

  return (
    <aside 
      id="aero-desktop-sidebar"
      className={`hidden md:flex flex-col shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-[#ffffff] dark:bg-[#161617] transition-all duration-200 select-none sticky top-14 h-[calc(100vh-3.5rem)] z-30 ${
        collapsed ? 'w-16' : 'w-56 lg:w-60'
      }`}
    >
      {/* Scrollable Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar">
        
        {/* Section 1: Store / Discovery */}
        <div>
          <nav className="space-y-1">
            {STORE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.view);
              const label = getNavItemLabel(item);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.view)}
                  id={`sidebar-nav-${item.id}`}
                  title={collapsed ? label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group cursor-pointer ${
                    active
                      ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform ${
                    active 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Subtle Apple-style divider */}
        <div className="border-t border-slate-200/70 dark:border-white/10 my-2" />

        {/* Section 2: Personal / Library */}
        <div>
          <nav className="space-y-1">
            {LIBRARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.view);
              const label = getNavItemLabel(item);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.view)}
                  id={`sidebar-nav-${item.id}`}
                  title={collapsed ? label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group cursor-pointer ${
                    active
                      ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform ${
                    active 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Subtle Apple-style divider */}
        <div className="border-t border-slate-200/70 dark:border-white/10 my-2" />

        {/* Section 3: Account & System */}
        <div>
          <nav className="space-y-1">
            {SYSTEM_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.view);
              const label = getNavItemLabel(item);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.view)}
                  id={`sidebar-nav-${item.id}`}
                  title={collapsed ? label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group cursor-pointer ${
                    active
                      ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform ${
                    active 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </button>
              );
            })}

            {/* Developer Portal shortcut if developer */}
            {isDeveloper && (
              <button
                onClick={() => onNavigate('developer-dashboard')}
                id="sidebar-nav-developer"
                title={collapsed ? t('nav.developerConsole', 'Developer Console') : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group cursor-pointer ${
                  currentView === 'developer-dashboard'
                    ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <Code2 className="w-4.5 h-4.5 shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                {!collapsed && <span className="truncate">{t('nav.developerConsole', 'Developer Console')}</span>}
              </button>
            )}

            {/* Admin Management Section */}
            {isOwnerOrAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                id="sidebar-nav-admin"
                title={collapsed ? t('nav.ownerConsole', 'Owner Console') : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group cursor-pointer ${
                  currentView === 'admin' || currentView === 'owner'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/20'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-amber-600 dark:text-amber-400" />
                {!collapsed && <span className="truncate">{t('nav.ownerConsole', 'Owner Console')}</span>}
              </button>
            )}
          </nav>
        </div>

      </div>

      {/* Bottom Sidebar Collapse Toggle */}
      {onToggleCollapse && (
        <div className="p-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-end">
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? t('common.seeMore', 'Perluas Sidebar') : t('common.close', 'Ciutkan Sidebar')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      )}
    </aside>
  );
}
