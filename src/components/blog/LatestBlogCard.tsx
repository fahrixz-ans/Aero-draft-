import React from 'react';
import { BlogItem } from '../../types';

interface LatestBlogCardProps {
  key?: string;
  blog: BlogItem;
  onSelect: (slug: string) => void;
}

export default function LatestBlogCard({ blog, onSelect }: LatestBlogCardProps) {
  return (
    <div
      onClick={() => onSelect(blog.slug)}
      className="group w-full rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer btn-press-feedback select-none"
    >
      {/* 1:1 Thumbnail */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-900 aspect-square relative">
        <img
          src={blog.coverImage}
          alt={blog.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info on right */}
      <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {blog.category}
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            {blog.publishedAt}
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {blog.title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 hidden sm:block">
          {blog.excerpt}
        </p>

        <div className="text-[11px] text-slate-400 font-medium sm:hidden">
          {blog.publishedAt} • {blog.readTimeMinutes || 3} min
        </div>
      </div>
    </div>
  );
}
