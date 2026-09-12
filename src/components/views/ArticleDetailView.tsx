import React from 'react';
import { Calendar, Clock, User, Share2, Bookmark, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { ARTICLES_DATA, ArticleItem } from '../../data/articlesData';
import BackButton from '../navigation/BackButton';

interface ArticleDetailViewProps {
  slug: string;
  onBack: () => void;
  onSelectArticle: (slug: string) => void;
}

export default function ArticleDetailView({
  slug,
  onBack,
  onSelectArticle
}: ArticleDetailViewProps) {
  const article = ARTICLES_DATA.find(a => a.slug === slug) || ARTICLES_DATA[0];
  const relatedArticles = ARTICLES_DATA.filter(a => a.slug !== article.slug).slice(0, 3);
  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="article-detail-view">
      {/* Back Button */}
      <BackButton onBack={onBack} label="Kembali ke Daftar Artikel" showText={true} className="mb-6" />

      {/* Article Header */}
      <header className="mb-6">
        <div className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3 border border-blue-500/20">
          {article.category}
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover shadow-xs"
            />
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {article.author.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {article.author.role} • {article.publishedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Disalin!' : 'Bagikan'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="rounded-2xl overflow-hidden mb-8 shadow-md border border-slate-200/80 dark:border-white/10">
        <img
          src={article.coverImage}
          alt={article.title}
          referrerPolicy="no-referrer"
          className="w-full h-64 sm:h-96 object-cover"
        />
      </div>

      {/* Article Content Render */}
      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
        {article.content.split('\n\n').map((paragraph, index) => {
          if (paragraph.startsWith('## ')) {
            return (
              <h2 key={index} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-6 mb-3">
                {paragraph.replace('## ', '')}
              </h2>
            );
          }
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={index} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          return (
            <p key={index} className="leading-relaxed whitespace-pre-line">
              {paragraph}
            </p>
          );
        })}
      </div>

      {/* Tags */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400">Tag Terkait:</span>
        {article.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Related Articles Section */}
      <section className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
          Artikel Lainnya yang Wajib Dibaca
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {relatedArticles.map((rel) => (
            <div
              key={rel.id}
              onClick={() => onSelectArticle(rel.slug)}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <img
                  src={rel.coverImage}
                  alt={rel.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-28 rounded-xl object-cover mb-2.5"
                />
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {rel.title}
                </h4>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>{rel.publishedAt}</span>
                <ArrowRight className="w-3 h-3 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
