import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Clock, Calendar, User, ChevronRight, Bookmark } from 'lucide-react';
import { BlogItem } from '../../types';
import { fetchBlogBySlug, fetchAllBlogs, getBlogCategoriesFromData } from '../../services/blogService';
import BlogNavbar from './BlogNavbar';
import BlogAdvertisement from './BlogAdvertisement';
import BlogDrawer from './BlogDrawer';
import BlogFooter from './BlogFooter';
import SeeAlsoBlogCard from './SeeAlsoBlogCard';
import RecommendedBlogCarousel from './RecommendedBlogCarousel';

interface BlogDetailViewProps {
  slug: string;
  onNavigate: (view: string, slug?: string) => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export default function BlogDetailView({
  slug,
  onNavigate,
  onOpenAuthModal
}: BlogDetailViewProps) {
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [allBlogs, setAllBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [b, full] = await Promise.all([
        fetchBlogBySlug(slug),
        fetchAllBlogs()
      ]);
      if (isMounted) {
        setBlog(b);
        setAllBlogs(full);
        setIsLoading(false);
      }
    }
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { isMounted = false; };
  }, [slug]);

  const categories = getBlogCategoriesFromData(allBlogs);

  // Filter related blogs by category
  const relatedBlogs = blog
    ? allBlogs.filter(b => b.slug !== blog.slug && b.category === blog.category)
    : [];
  
  // See Also blogs (4:5 ratio cards)
  const seeAlsoBlogs = allBlogs.filter(b => b.slug !== blog?.slug).slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title || 'Mod Station Blog',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleSelectCategory = (catSlug: string) => {
    if (catSlug === 'all') {
      onNavigate('blog');
    } else {
      onNavigate('blog-category', catSlug);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white flex flex-col justify-between">
        <BlogNavbar onBack={() => onNavigate('blog')} />
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 w-full">
          <div className="w-full h-8 bg-slate-200 dark:bg-[#1C1C1E] rounded-xl animate-pulse" />
          <div className="w-full aspect-[16/9] bg-slate-200 dark:bg-[#1C1C1E] rounded-2xl animate-pulse" />
          <div className="space-y-3">
            <div className="w-full h-4 bg-slate-200 dark:bg-[#1C1C1E] rounded-md animate-pulse" />
            <div className="w-5/6 h-4 bg-slate-200 dark:bg-[#1C1C1E] rounded-md animate-pulse" />
            <div className="w-4/6 h-4 bg-slate-200 dark:bg-[#1C1C1E] rounded-md animate-pulse" />
          </div>
        </div>
        <BlogFooter categories={categories} onSelectCategory={handleSelectCategory} onNavigate={onNavigate} />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white flex flex-col justify-between">
        <BlogNavbar onBack={() => onNavigate('blog')} />
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-xl font-bold">Blog tidak ditemukan</h1>
          <p className="text-xs text-slate-500">Blog yang Anda cari mungkin telah dipindahkan atau dihapus.</p>
          <button
            type="button"
            onClick={() => onNavigate('blog')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Kembali ke Mod Station Blog
          </button>
        </div>
        <BlogFooter categories={categories} onSelectCategory={handleSelectCategory} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <div>
        {/* Navbar */}
        <BlogNavbar
          onBack={() => onNavigate('blog')}
          onOpenSearch={() => onNavigate('blog-search')}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          title={blog.title}
        />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          
          {/* Top Advertisement Container */}
          <BlogAdvertisement slotId="detail-top" />

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium select-none overflow-x-auto whitespace-nowrap">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button
              type="button"
              onClick={() => onNavigate('blog')}
              className="hover:text-blue-600 dark:hover:text-white transition-colors"
            >
              Blog
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button
              type="button"
              onClick={() => {
                const catSlug = blog.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                onNavigate('blog-category', catSlug);
              }}
              className="hover:text-blue-600 dark:hover:text-white transition-colors font-bold text-slate-700 dark:text-slate-300"
            >
              {blog.category}
            </button>
          </nav>

          {/* Title & Article Metadata */}
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              {blog.category}
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {blog.title}
            </h1>

            {/* Author info & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-4 border-b border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <img
                  src={blog.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&q=80'}
                  alt={blog.author?.name || 'Author'}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {blog.author?.name || 'Mod Station Editor'}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{blog.author?.role || 'Technical Writer'}</span>
                    <span>•</span>
                    <span>{blog.publishedAt}</span>
                    <span>•</span>
                    <span>{blog.readTimeMinutes || 3} min baca</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer btn-press-feedback ${
                    isBookmarked
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  aria-label="Simpan Blog"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer btn-press-feedback relative"
                  aria-label="Bagikan Blog"
                >
                  <Share2 className="w-4 h-4" />
                  {copyFeedback && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black text-white text-[10px] font-bold whitespace-nowrap shadow-xs">
                      Tautan Disalin!
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hero Image (16:9 Aspect Ratio) + Caption */}
          <div className="space-y-2">
            <div className="w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200/80 dark:border-white/10 relative">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 italic">
              Gambar: {blog.title} — Dokumentasi resmi Mod Station Blog
            </p>
          </div>

          {/* Blog Content Body */}
          <article className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 py-2">
            {blog.content ? (
              blog.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white pt-4 pb-1 border-b border-slate-200/60 dark:border-white/10">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white pt-3 pb-1">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n- ');
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1.5 my-3">
                      {items.map((item, i) => (
                        <li key={i}>{item.replace(/^- /, '')}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={idx} className="leading-relaxed">{paragraph}</p>;
              })
            ) : (
              <p>{blog.excerpt}</p>
            )}
          </article>

          {/* Middle Advertisement */}
          <BlogAdvertisement slotId="detail-mid" />

          {/* Additional Media 16:9 */}
          <div className="space-y-2 py-2">
            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-white/10 relative">
              <img
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop&q=80"
                alt="Media Mod Station"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center text-[11px] sm:text-xs text-slate-500 italic">
              Media Tambahan — 16:9 Aspect Ratio Media Visual Mod Station
            </p>
          </div>

          {/* Lihat Juga Section (4:5 Ratio Cards) */}
          <section className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Lihat Juga
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {seeAlsoBlogs.map((item) => (
                <SeeAlsoBlogCard
                  key={item.id || item.slug}
                  blog={item}
                  onSelect={(s) => onNavigate('blog-detail', s)}
                />
              ))}
            </div>
          </section>

          {/* Penutup Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
              Penutup
            </h4>
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              Demikianlah pembahasan lengkap dari Mod Station Blog. Selalu pastikan aplikasi Android Anda diperbarui melalui Mod Station untuk perlindungan keamanan maksimal dan fitur terbaru.
            </p>
          </div>

          {/* Blog Terkait Carousel */}
          {relatedBlogs.length > 0 && (
            <RecommendedBlogCarousel
              blogs={relatedBlogs}
              onSelect={(s) => onNavigate('blog-detail', s)}
            />
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
