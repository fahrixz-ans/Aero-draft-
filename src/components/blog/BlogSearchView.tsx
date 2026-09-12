import React, { useState, useEffect } from 'react';
import { Search, X, History, Trash2, ArrowLeft } from 'lucide-react';
import { BlogItem } from '../../types';
import { searchBlogsByQuery, fetchAllBlogs, getBlogCategoriesFromData } from '../../services/blogService';
import BlogNavbar from './BlogNavbar';
import BlogDrawer from './BlogDrawer';
import BlogFooter from './BlogFooter';
import LatestBlogCard from './LatestBlogCard';

interface BlogSearchViewProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

const SEARCH_HISTORY_KEY = 'modstation_blog_search_history';

export default function BlogSearchView({ onNavigate, onOpenAuthModal }: BlogSearchViewProps) {
  const [queryStr, setQueryStr] = useState('');
  const [searchResults, setSearchResults] = useState<BlogItem[]>([]);
  const [allBlogs, setAllBlogs] = useState<BlogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load blog search history:', e);
    }

    async function loadData() {
      const data = await fetchAllBlogs();
      setAllBlogs(data);
    }
    loadData();
  }, []);

  const categories = getBlogCategoriesFromData(allBlogs);

  const saveHistoryItem = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const filtered = searchHistory.filter(h => h.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...filtered].slice(0, 10);
    setSearchHistory(updated);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save search history:', e);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      console.warn('Failed to clear search history:', e);
    }
  };

  const handleExecuteSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    saveHistoryItem(clean);

    const results = await searchBlogsByQuery(clean);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(queryStr);
  };

  const handleSelectHistory = (term: string) => {
    setQueryStr(term);
    handleExecuteSearch(term);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <div>
        {/* Navbar */}
        <BlogNavbar
          onBack={() => onNavigate('blog')}
          onOpenSearch={() => {}}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          title="Pencarian Blog"
        />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          
          {/* iOS-Style Search Header Form */}
          <form onSubmit={handleSubmit} className="w-full relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={queryStr}
                onChange={(e) => {
                  setQueryStr(e.target.value);
                  if (!e.target.value.trim()) {
                    setSearchResults([]);
                    setHasSearched(false);
                  }
                }}
                placeholder="Cari Blog di Mod Station..."
                className="w-full pl-11 pr-10 py-3 sm:py-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/50 shadow-xs transition-all"
                autoFocus
              />
              {queryStr && (
                <button
                  type="button"
                  onClick={() => {
                    setQueryStr('');
                    setSearchResults([]);
                    setHasSearched(false);
                  }}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="Hapus teks"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* If No Query Typed Yet */}
          {!hasSearched && (
            <div className="space-y-6 animate-fade-in">
              {/* Search History */}
              {searchHistory.length > 0 ? (
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <History className="w-4 h-4" />
                      <span>Riwayat Pencarian</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Semua</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {searchHistory.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectHistory(item)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer btn-press-feedback"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/10">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Belum ada riwayat pencarian. Ketik kata kunci di atas untuk mencari Blog.
                  </p>
                </div>
              )}

              {/* Popular Categories suggestions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  Kategori Populer
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => onNavigate('blog-category', cat.slug)}
                      className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer btn-press-feedback"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Results Display */}
          {hasSearched && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Hasil Pencarian ({searchResults.length})
                </h2>
                <span className="text-xs text-slate-500">Kata kunci: "{queryStr}"</span>
              </div>

              {isSearching ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="w-full h-24 rounded-2xl bg-slate-200 dark:bg-[#1C1C1E] animate-pulse" />
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/10 space-y-3">
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Tidak ada Blog yang ditemukan
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Coba kata kunci lain seperti "WhatsApp", "Tips", atau "Update".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((blog) => (
                    <LatestBlogCard
                      key={blog.id || blog.slug}
                      blog={blog}
                      onSelect={(slug) => onNavigate('blog-detail', slug)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      <BlogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categories={categories}
        onSelectCategory={(slug) => onNavigate('blog-category', slug)}
        onNavigate={onNavigate}
        onOpenAuthModal={onOpenAuthModal}
      />

      <BlogFooter
        categories={categories}
        onSelectCategory={(slug) => onNavigate('blog-category', slug)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
