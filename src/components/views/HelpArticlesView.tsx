import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  Code2, 
  Crown, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  User as UserIcon, 
  X,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { 
  HELP_CATEGORIES, 
  HELP_ARTICLES, 
  HelpArticle 
} from '../../data/helpCenterData';

interface HelpArticlesViewProps {
  initialSlug?: string;
  onNavigate: (view: string, slug?: string) => void;
  onBack?: () => void;
}

export default function HelpArticlesView({
  initialSlug,
  onNavigate,
  onBack
}: HelpArticlesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(() => {
    if (initialSlug) {
      return HELP_ARTICLES.find(a => a.slug === initialSlug) || null;
    }
    return null;
  });

  const handleBackClick = () => {
    if (activeArticle) {
      setActiveArticle(null);
    } else if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('help-center');
    }
  };

  const filteredArticles = useMemo(() => {
    return HELP_ARTICLES.filter((art) => {
      const matchesCategory = selectedCategory === 'all' || art.categoryId === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return Sparkles;
      case 'AlertCircle': return AlertCircle;
      case 'Code2': return Code2;
      case 'Crown': return Crown;
      case 'HelpCircle': return HelpCircle;
      case 'Layers': return Layers;
      case 'ShieldCheck': return ShieldCheck;
      case 'User': return UserIcon;
      default: return BookOpen;
    }
  };

  // If viewing single article detail
  if (activeArticle) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="help-article-detail-root">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BackButton onBack={handleBackClick} label="Artikel Bantuan" showText={true} />
        </div>

        {/* Article Container */}
        <article className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] p-5 sm:p-7 space-y-5">
          <div className="space-y-2 border-b border-[#D2D2D7]/50 dark:border-[#38383A] pb-4">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              {activeArticle.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              {activeArticle.title}
            </h1>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              Pembaruan terakhir: {activeArticle.updatedAt}
            </p>
          </div>

          <div className="text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed whitespace-pre-line space-y-4">
            {activeArticle.content}
          </div>

          {activeArticle.media && activeArticle.media.length > 0 && (
            <div className="space-y-3 pt-2">
              {activeArticle.media.map((med, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-[#D2D2D7]/60 dark:border-[#38383A] bg-white dark:bg-black/30">
                  <img
                    src={med.url}
                    alt={med.caption}
                    className="w-full h-auto object-cover max-h-80"
                    referrerPolicy="no-referrer"
                  />
                  {med.caption && (
                    <p className="p-2 text-center text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                      {med.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Related Questions */}
          {activeArticle.relatedQuestions && activeArticle.relatedQuestions.length > 0 && (
            <div className="pt-4 border-t border-[#D2D2D7]/50 dark:border-[#38383A] space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                Pertanyaan Terkait
              </h2>
              <div className="space-y-1.5">
                {activeArticle.relatedQuestions.map((rq, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate('help-ai-assistant', rq)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-left text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between gap-2 border border-[#D2D2D7]/40 dark:border-[#38383A] transition-colors cursor-pointer"
                  >
                    <span>{rq}</span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    );
  }

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="help-articles-root">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton onBack={handleBackClick} label="Artikel Bantuan" showText={true} />
        {isSearchActive && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E6E73] dark:text-[#A1A1A6]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari artikel bantuan..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#6E6E73] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-[#F5F5F7] dark:bg-[#1C1C1E] text-[#6E6E73] dark:text-[#A1A1A6] border border-[#D2D2D7]/50 dark:border-[#38383A] hover:text-[#1D1D1F]'
          }`}
        >
          Semua
        </button>
        {HELP_CATEGORIES.map((cat) => {
          const Icon = getCategoryIcon(cat.iconName);
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#F5F5F7] dark:bg-[#1C1C1E] text-[#6E6E73] dark:text-[#A1A1A6] border border-[#D2D2D7]/50 dark:border-[#38383A] hover:text-[#1D1D1F]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Articles Accordion List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
            {isSearchActive ? 'Hasil Pencarian' : 'Baru di Mod Station'}
          </h2>
          <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
            {filteredArticles.length} artikel
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] p-8 text-center space-y-3">
            <HelpCircle className="w-8 h-8 text-[#6E6E73] mx-auto opacity-50" />
            <h3 className="font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
              Tidak ada artikel ditemukan
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] max-w-xs mx-auto">
              Cari dengan kata kunci lain atau tanyakan langsung pada Asisten AI kami.
            </p>
            <button
              onClick={() => onNavigate('help-ai-assistant', searchQuery)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tanya Asisten AI</span>
            </button>
          </div>
        ) : (
          filteredArticles.map((art) => {
            const isExpanded = expandedArticleId === art.id;
            return (
              <div
                key={art.id}
                className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                  className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium shrink-0">
                      [{art.category}]
                    </span>
                    <span className="line-clamp-1">{art.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6] shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#D2D2D7]/40 dark:border-[#38383A] space-y-3 text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
                    <p className="leading-relaxed">
                      {art.excerpt}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        {art.updatedAt}
                      </span>
                      <button
                        onClick={() => setActiveArticle(art)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Baca Selengkapnya</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

