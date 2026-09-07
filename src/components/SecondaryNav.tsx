import React from 'react';
import { Sparkles, Flame, LayoutGrid, Gamepad2, Baby, Compass } from 'lucide-react';

export interface SecondaryNavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  view?: string;
  category?: string;
  badge?: string;
}

interface SecondaryNavProps {
  activeTab: string;
  onTabChange: (tabId: string, view?: string, category?: string) => void;
  className?: string;
}

export const DEFAULT_SECONDARY_NAV_ITEMS: SecondaryNavItem[] = [
  { id: 'for-you', label: 'Untuk Anda', icon: Sparkles, view: 'home' },
  { id: 'popular', label: 'Paling Populer', icon: Flame, view: 'home' },
  { id: 'apps', label: 'Aplikasi', icon: LayoutGrid, view: 'apps' },
  { id: 'games', label: 'Games', icon: Gamepad2, view: 'games' },
  { id: 'kids', label: 'Anak-anak', icon: Baby, view: 'home', category: 'Pendidikan' },
  { id: 'categories', label: 'Kategori', icon: Compass, view: 'categories' }
];

export default function SecondaryNav({
  activeTab,
  onTabChange,
  className = ''
}: SecondaryNavProps) {
  return (
    <div className={`w-full border-b border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#0d1117]/60 backdrop-blur-xs transition-colors ${className}`} id="secondary-navigation-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {DEFAULT_SECONDARY_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id, item.view, item.category)}
                id={`secondary-nav-${item.id}`}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
