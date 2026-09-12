import React from 'react';
import { SECONDARY_NAV_ITEMS } from '../config/navigation';

interface SecondaryNavProps {
  activeTab: string;
  onTabChange: (tabId: string, view?: string, category?: string) => void;
  className?: string;
}

export default function SecondaryNav({
  activeTab,
  onTabChange,
  className = ''
}: SecondaryNavProps) {
  return (
    <nav 
      aria-label="Filter Kategori Sekunder"
      id="aero-secondary-nav"
      className={`w-full border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#0e131f]/80 backdrop-blur-xs transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 no-scrollbar scroll-smooth">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id || activeTab === item.view;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id, item.view, item.category)}
                id={`secondary-nav-${item.id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                }`}
              >
                {Icon && (
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
