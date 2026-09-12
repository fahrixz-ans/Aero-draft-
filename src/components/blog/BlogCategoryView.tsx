import React, { useState, useEffect } from 'react';
import { BlogItem } from '../../types';
import { fetchBlogsByCategory, fetchAllBlogs, getBlogCategoriesFromData } from '../../services/blogService';
import BlogNavbar from './BlogNavbar';
import BlogCategoryBar from './BlogCategoryBar';
import BlogAdvertisement from './BlogAdvertisement';
import BlogDrawer from './BlogDrawer';
import BlogFooter from './BlogFooter';
import LatestBlogCard from './LatestBlogCard';

interface BlogCategoryViewProps {
  categorySlug: string;
  onNavigate: (view: string, slug?: string) => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export default function BlogCategoryView({
  categorySlug,
  onNavigate,
  onOpenAuthModal
}: BlogCategoryViewProps) {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [allBlogs, setAllBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [catData, fullData] = await Promise.all([
        fetchBlogsByCategory(categorySlug),
        fetchAllBlogs()
      ]);
      if (isMounted) {
        setBlogs(catData);
        setAllBlogs(fullData);
        setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [categorySlug]);

  const categories = getBlogCategoriesFromData(allBlogs);
  const activeCat = categories.find(c => c.slug.toLowerCase() === categorySlug.toLowerCase());
  const categoryTitle = activeCat ? activeCat.name : categorySlug;

  const handleSelectCategory = (slug: string) => {
    if (slug === 'all') {
      onNavigate('blog');
    } else {
      onNavigate('blog-category', slug);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <div>
        {/* Navbar */}
        <BlogNavbar
          onBack={() => onNavigate('blog')}
          onOpenSearch={() => onNavigate('blog-search')}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          title={`Kategori: ${categoryTitle}`}
        />

        {/* Categories Bar */}
        <BlogCategoryBar
          categories={categories}
          activeCategorySlug={categorySlug}
          onSelectCategory={handleSelectCategory}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {categoryTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Menampilkan {blogs.length} Blog pilihan dalam kategori ini
              </p>
            </div>
          </div>

          <BlogAdvertisement slotId="cat-top" />

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="w-full h-24 rounded-2xl bg-slate-200 dark:bg-[#1C1C1E] animate-pulse" />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/10 space-y-3">
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                Belum ada Blog dalam kategori ini
              </p>
              <button
                type="button"
                onClick={() => onNavigate('blog')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors btn-press-feedback"
              >
                Lihat Semua Blog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {blogs.map((blog, idx) => (
                <React.Fragment key={blog.id || blog.slug}>
                  <LatestBlogCard
                    blog={blog}
                    onSelect={(slug) => onNavigate('blog-detail', slug)}
                  />
                  {(idx + 1) % 3 === 0 && <BlogAdvertisement slotId={`cat-mid-${idx}`} />}
                </React.Fragment>
              ))}
            </div>
          )}
        </main>
      </div>

      <BlogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onNavigate={onNavigate}
        onOpenAuthModal={onOpenAuthModal}
      />

      <BlogFooter
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onNavigate={onNavigate}
      />
    </div>
  );
}
