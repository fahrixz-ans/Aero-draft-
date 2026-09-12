import React from 'react';
import { BlogItem } from '../../types';

interface RecommendedBlogCarouselProps {
  blogs: BlogItem[];
  onSelect: (slug: string) => void;
}

export default function RecommendedBlogCarousel({ blogs = [], onSelect }: RecommendedBlogCarouselProps) {
  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto my-6 select-none" id="mungkin-anda-suka-section">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Mungkin Anda Suka
        </h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Geser &rarr;
        </span>
      </div>

      <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-1 px-1">
        {blogs.map((blog) => (
          <div
            key={blog.id || blog.slug}
            onClick={() => onSelect(blog.slug)}
            className="group shrink-0 w-36 sm:w-44 md:w-52 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer btn-press-feedback flex flex-col justify-between"
          >
            {/* 1:1 Image Aspect Ratio */}
            <div className="w-full aspect-square overflow-hidden bg-slate-900 relative">
              <img
                src={blog.coverImage}
                alt={blog.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white uppercase tracking-wider">
                {blog.category}
              </span>
            </div>

            {/* Title below image */}
            <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                {blog.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                {blog.publishedAt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
