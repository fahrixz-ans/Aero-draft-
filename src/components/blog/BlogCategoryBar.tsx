import React from 'react';

export interface CategoryItem {
  name: string;
  slug: string;
}

interface BlogCategoryBarProps {
  categories: CategoryItem[];
  activeCategorySlug: string;
  onSelectCategory: (slug: string) => void;
}

export default function BlogCategoryBar({
  categories = [],
  activeCategorySlug = 'all',
  onSelectCategory
}: BlogCategoryBarProps) {
  return (
    <nav className="w-full bg-slate-50/80 dark:bg-[#151517] border-b border-slate-200/60 dark:border-white/5 py-2.5 select-none overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 whitespace-nowrap">
          {categories.map((cat) => {
            const isActive = activeCategorySlug === cat.slug || (activeCategorySlug === '' && cat.slug === 'all');
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer active:scale-95 btn-press-feedback ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/15'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
