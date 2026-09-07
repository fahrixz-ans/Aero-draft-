import React, { useState } from 'react';
import { 
  LayoutDashboard, Smartphone, Layers, FolderTree, BookmarkCheck,
  Layout, Flag, Sparkles, ShieldAlert, FileText, Star,
  ShieldCheck, ScanLine, AlertTriangle, BarChart3, TrendingUp,
  Download, Search, HardDrive, Cpu, Database, Activity,
  Users, Key, History, Settings, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft
} from 'lucide-react';

export interface AdminSidebarProps {
  activeRoute: string;
  onNavigateRoute: (route: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  pendingModerationCount?: number;
  securityAlertCount?: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function AdminSidebar({
  activeRoute,
  onNavigateRoute,
  collapsed,
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  pendingModerationCount = 0,
  securityAlertCount = 0
}: AdminSidebarProps) {
  
  // Section collapse state for nested groups if needed
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'OVERVIEW': true,
    'CATALOG': true,
    'CONTENT': true,
    'MODERATION': true,
    'SECURITY': true,
    'ANALYTICS': true,
    'SYSTEM': true,
    'ACCESS': true,
    'SETTINGS': true,
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const MENU_SECTIONS: MenuSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { id: 'apps', label: 'Apps', icon: Smartphone },
        { id: 'versions', label: 'Versions', icon: Layers },
        { id: 'categories', label: 'Categories', icon: FolderTree },
        { id: 'collections', label: 'Collections', icon: BookmarkCheck }
      ]
    },
    {
      title: 'CONTENT',
      items: [
        { id: 'homepage', label: 'Homepage', icon: Layout },
        { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
        { id: 'ranking-engine', label: 'Ranking & Trending', icon: BarChart3 },
        { id: 'banners', label: 'Banners', icon: Flag },
        { id: 'featured', label: 'Featured', icon: Sparkles }
      ]
    },
    {
      title: 'MODERATION',
      items: [
        { 
          id: 'moderation', 
          label: 'Moderation Queue', 
          icon: ShieldAlert,
          badge: pendingModerationCount > 0 ? pendingModerationCount : undefined,
          badgeColor: 'bg-amber-500 text-white'
        },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'reviews', label: 'Reviews', icon: Star }
      ]
    },
    {
      title: 'SECURITY',
      items: [
        { id: 'security-center', label: 'Security Center', icon: ShieldCheck },
        { id: 'security-scans', label: 'APK Scans', icon: ScanLine },
        { 
          id: 'security-alerts', 
          label: 'Security Alerts', 
          icon: AlertTriangle,
          badge: securityAlertCount > 0 ? securityAlertCount : undefined,
          badgeColor: 'bg-red-500 text-white'
        }
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'analytics-overview', label: 'Overview', icon: BarChart3 },
        { id: 'analytics-apps', label: 'Apps Analytics', icon: TrendingUp },
        { id: 'analytics-downloads', label: 'Downloads', icon: Download },
        { id: 'analytics-search', label: 'Search & Traffic', icon: Search }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'system-storage', label: 'Storage', icon: HardDrive },
        { id: 'system-jobs', label: 'Jobs', icon: Cpu },
        { id: 'system-search', label: 'Search Index', icon: Database },
        { id: 'system-health', label: 'System Health', icon: Activity }
      ]
    },
    {
      title: 'ACCESS',
      items: [
        { id: 'access-admins', label: 'Administrators', icon: Users },
        { id: 'access-roles', label: 'Roles & Permissions', icon: Key },
        { id: 'access-audit', label: 'Audit Logs', icon: History }
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'settings-general', label: 'General Settings', icon: Settings }
      ]
    }
  ];

  const isCompact = collapsed && !isMobileDrawer;

  return (
    <aside
      className={`
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        flex flex-col h-full transition-all duration-200 select-none
        ${isCompact ? 'w-[72px]' : 'w-[250px]'}
      `}
    >
      {/* Top Sidebar Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            A
          </div>
          {!isCompact && (
            <div className="truncate">
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white block">
                AEROAPK
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block -mt-0.5">
                Control Center v8.1
              </span>
            </div>
          )}
        </div>

        {!isMobileDrawer && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {MENU_SECTIONS.map((section) => {
          const isOpen = openSections[section.title] ?? true;

          return (
            <div key={section.title} className="space-y-1">
              {!isCompact && (
                <div 
                  onClick={() => toggleSection(section.title)}
                  className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between cursor-pointer hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <span>{section.title}</span>
                  <span className="text-[10px]">
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                </div>
              )}

              {(isOpen || isCompact) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    // Route match checking
                    const isActive = activeRoute === item.id || 
                      (item.id === 'apps' && (activeRoute.startsWith('apps') || activeRoute === 'applications')) ||
                      (item.id === 'moderation' && activeRoute === 'reports-hub') ||
                      (item.id === 'security-center' && activeRoute === 'apk-security');

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigateRoute(item.id);
                          if (isMobileDrawer && onCloseMobileDrawer) {
                            onCloseMobileDrawer();
                          }
                        }}
                        title={isCompact ? item.label : undefined}
                        className={`
                          w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800/40' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                          }
                          ${isCompact ? 'justify-center px-0' : ''}
                        `}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        
                        {!isCompact && (
                          <span className="truncate flex-1">
                            {item.label}
                          </span>
                        )}

                        {!isCompact && item.badge !== undefined && (
                          <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${item.badgeColor || 'bg-blue-500 text-white'}`}>
                            {item.badge}
                          </span>
                        )}

                        {isCompact && item.badge !== undefined && (
                          <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / Status indicator */}
      {!isCompact && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">System Healthy</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Production</span>
        </div>
      )}
    </aside>
  );
}
