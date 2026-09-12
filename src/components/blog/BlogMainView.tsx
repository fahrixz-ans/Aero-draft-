import React, { useState, useEffect } from 'react';
import { BlogItem } from '../../types';
import { fetchAllBlogs, getBlogCategoriesFromData } from '../../services/blogService';
import BlogNavbar from './BlogNavbar';
import BlogCategoryBar from './BlogCategoryBar';
import BlogAdvertisement from './BlogAdvertisement';
import BlogDrawer from './BlogDrawer';
import BlogFooter from './BlogFooter';
import FeaturedBlogCard from './FeaturedBlogCard';
import RecommendedBlogCarousel from './RecommendedBlogCarousel';
import LatestBlogCard from './LatestBlogCard';

interface BlogMainViewProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export default function BlogMainView({ onNavigate, onOpenAuthModal }: BlogMainViewProps) {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const data = await fetchAllBlogs();
      if (isMounted) {
        setBlogs(data);
        setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const categories = getBlogCategoriesFromData(blogs);

  // Filtered blogs
  const filteredBlogs = activeCategorySlug === 'all' || activeCategorySlug === ''
    ? blogs
    : blogs.filter(b => {
        const slugifiedCat = b.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return slugifiedCat === activeCategorySlug.toLowerCase();
      });

  const featuredBlog = blogs.find(b => b.isFeatured) || (blogs.length > 0 ? blogs[0] : null);
  const recommendedBlogs = blogs.filter(b => b.id !== featuredBlog?.id).slice(0, 6);
  const latestBlogs = filteredBlogs.filter(b => b.id !== featuredBlog?.id);

  const handleSelectCategory = (catSlug: string) => {
    setActiveCategorySlug(catSlug);
    if (catSlug !== 'all') {
      onNavigate('blog-category', catSlug);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <div>
        {/* Navbar Blog */}
        <BlogNavbar
          onBack={() => onNavigate('home')}
          onOpenSearch={() => onNavigate('blog-search')}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          title="Mod Station Blog"
        />

        {/* Categories Bar */}
        <BlogCategoryBar
          categories={categories}
          activeCategorySlug={activeCategorySlug}
          onSelectCategory={handleSelectCategory}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
          
          {/* Top Advertisement Container */}
          <BlogAdvertisement slotId="top-home" />

          {/* Featured Blog (16:9 Aspect Ratio) */}
          <FeaturedBlogCard
            blog={featuredBlog}
            onSelect={(slug) => onNavigate('blog-detail', slug)}
          />

          {/* Mungkin Anda Suka (1:1 Carousel) */}
          <RecommendedBlogCarousel
            blogs={recommendedBlogs}
            onSelect={(slug) => onNavigate('blog-detail', slug)}
          />

          {/* Blog Terbaru List */}
          <section className="w-full max-w-7xl mx-auto my-6 space-y-4" id="blog-terbaru-section">
            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight px-1">
              Blog Terbaru
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="w-full h-24 rounded-2xl bg-slate-200 dark:bg-[#1C1C1E] animate-pulse" />
                ))}
              </div>
            ) : latestBlogs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Belum ada Blog dalam kategori ini
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {latestBlogs.map((blog, idx) => (
                  <React.Fragment key={blog.id || blog.slug}>
                    <LatestBlogCard
                      blog={blog}
                      onSelect={(slug) => onNavigate('blog-detail', slug)}
                    />
                    {/* Interspersed Advertisement */}
                    {(idx + 1) % 3 === 0 && (
                      <BlogAdvertisement slotId={`mid-list-${idx}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>

      {/* Blog Drawer */}
      <BlogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onNavigate={onNavigate}
        onOpenAuthModal={onOpenAuthModal}
      />

      {/* Footer Blog (SCOPED ONLY TO BLOG PAGES!) */}
      <BlogFooter
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onNavigate={onNavigate}
      />
    </div>
  );
}
