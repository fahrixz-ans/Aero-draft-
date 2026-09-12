import React from 'react';
import { BlogItem } from '../../types';

interface FeaturedBlogCardProps {
  blog: BlogItem | null;
  onSelect: (slug: string) => void;
}

export default function FeaturedBlogCard({ blog, onSelect }: FeaturedBlogCardProps) {
  if (!blog) {
    return (
      <div className="w-full max-w-7xl mx-auto my-6 p-8 rounded-3xl bg-slate-100 dark:bg-[#1C1C1E] text-center border border-slate-200/60 dark:border-white/10 select-none">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Belum ada Blog unggulan
        </p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto my-4 sm:my-6 select-none">
      <div 
        onClick={() => onSelect(blog.slug)}
        className="group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer btn-press-feedback"
      >
        {/* 16:9 Image Container */}
        <div className="w-full aspect-[16/9] overflow-hidden bg-slate-900 relative">
          <img
            src={blog.coverImage}
            alt={blog.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
            <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
              {blog.category || 'Unggulan'}
            </span>
          </div>
        </div>

        {/* Info below image */}
        <div className="p-4 sm:p-5 space-y-2">
          <h2 className="text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {blog.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {blog.excerpt}
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{blog.author?.name || 'Mod Station Editor'}</span>
            <span>•</span>
            <span>{blog.publishedAt}</span>
            <span>•</span>
            <span>{blog.readTimeMinutes || 3} menit baca</span>
          </div>
        </div>
      </div>
    </section>
  );
}
