import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, User, ChevronRight, ArrowRight } from 'lucide-react';
import { ARTICLES_DATA, ArticleItem } from '../../data/articlesData';

interface ArticlesViewProps {
  onSelectArticle: (slug: string) => void;
}

export default function ArticlesView({ onSelectArticle }: ArticlesViewProps) {
  const [selectedTag, setSelectedTag] = useState<string>('Semua');

  const allTags = ['Semua', 'WhatsApp', 'Tips & Trik', 'Android', 'Produktivitas', 'Troubleshoot'];

  const filteredArticles = selectedTag === 'Semua'
    ? ARTICLES_DATA
    : ARTICLES_DATA.filter(art => art.tags.includes(selectedTag) || art.category === selectedTag);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="articles-view-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2 border border-blue-500/20">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pusat Panduan & Berita Android</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Artikel & Tips Aplikasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kumpulan panduan praktis, tips keamanan data, dan tutorial memaksimalkan fitur aplikasi smartphone.
          </p>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((art) => (
          <article
            key={art.id}
            onClick={() => onSelectArticle(art.slug)}
            className="rounded-2xl overflow-hidden bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              {/* Cover Image */}
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={art.coverImage}
                  alt={art.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    {art.category}
                  </span>
                </div>
              </div>

              {/* Content Box */}
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {art.publishedAt}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {art.readTimeMinutes} menit baca
                  </span>
                </div>

                <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                  {art.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>
            </div>

            {/* Author Footer */}
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={art.author.avatar}
                  alt={art.author.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {art.author.name}
                </span>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Baca Selengkapnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
