import React from 'react';
import { BlogItem } from '../../types';

interface SeeAlsoBlogCardProps {
  key?: string;
  blog: BlogItem;
  onSelect: (slug: string) => void;
}

export default function SeeAlsoBlogCard({ blog, onSelect }: SeeAlsoBlogCardProps) {
  return (
    <div
      onClick={() => onSelect(blog.slug)}
      className="group w-full rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200/60 dark:border-white/10 p-3 flex items-center gap-3 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer btn-press-feedback select-none"
    >
      {/* 4:5 Image Aspect Ratio */}
      <div className="w-16 h-20 sm:w-20 sm:h-25 shrink-0 rounded-xl overflow-hidden bg-slate-900 aspect-[4/5] relative">
        <img
          src={blog.coverImage}
          alt={blog.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          {blog.category}
        </span>
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {blog.title}
        </h4>
        <span className="text-[10px] text-slate-400 font-medium block">
          {blog.readTimeMinutes || 3} min baca
        </span>
      </div>
    </div>
  );
}
