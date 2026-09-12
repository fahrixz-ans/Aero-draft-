import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlogItem } from '../types';
import { ARTICLES_DATA } from '../data/articlesData';

/**
 * Transform initial articles collection into BlogItem records with strict Blog terminology
 */
export const INITIAL_BLOG_DATA: BlogItem[] = ARTICLES_DATA.map((item, idx) => ({
  id: item.id || `blog-${idx + 1}`,
  slug: item.slug,
  title: item.title,
  excerpt: item.excerpt,
  content: item.content,
  coverImage: item.coverImage,
  category: item.category,
  author: item.author,
  publishedAt: item.publishedAt,
  readTimeMinutes: item.readTimeMinutes,
  tags: item.tags,
  isFeatured: idx === 0
}));

/**
 * Unique category list derived from active blog data
 */
export function getBlogCategoriesFromData(blogs: BlogItem[]): { name: string; slug: string }[] {
  const categoryMap = new Map<string, string>();
  
  // Base default categories
  const defaults = [
    { name: 'Semua', slug: 'all' },
    { name: 'Update', slug: 'update' },
    { name: 'Tips & Trik', slug: 'tips-trik' },
    { name: 'Berita', slug: 'berita' },
    { name: 'Tutorial', slug: 'tutorial' },
    { name: 'Gaming', slug: 'gaming' }
  ];

  defaults.forEach(c => categoryMap.set(c.slug, c.name));

  blogs.forEach(b => {
    if (b.category) {
      const slug = b.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (!categoryMap.has(slug)) {
        categoryMap.set(slug, b.category);
      }
    }
  });

  return Array.from(categoryMap.entries()).map(([slug, name]) => ({ name, slug }));
}

/**
 * Fetch all published blogs from Firestore 'blogs' collection or fallback to verified catalog
 */
export async function fetchAllBlogs(): Promise<BlogItem[]> {
  const result: BlogItem[] = [];
  const registeredSlugs = new Set<string>();

  try {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.forEach(docSnap => {
        const d = docSnap.data();
        const item: BlogItem = {
          id: docSnap.id,
          slug: d.slug || docSnap.id,
          title: d.title || 'Blog Mod Station',
          excerpt: d.excerpt || d.description || '',
          content: d.content || d.body || '',
          coverImage: d.coverImage || d.image || d.imageUrl || 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800&h=450&fit=crop&q=80',
          category: d.category || 'Berita',
          author: d.author || { name: 'Admin Mod Station', avatar: '', role: 'Editor' },
          publishedAt: d.publishedAt || d.createdAt || '10 Mei 2026',
          readTimeMinutes: d.readTimeMinutes || 4,
          tags: d.tags || [],
          isFeatured: d.isFeatured || false
        };
        result.push(item);
        registeredSlugs.add(item.slug);
      });
    }
  } catch (err) {
    console.warn('Firestore blog fetch warning (using initial fallback):', err);
  }

  // Merge initial baseline blog data to guarantee complete content without dummy data
  INITIAL_BLOG_DATA.forEach(b => {
    if (!registeredSlugs.has(b.slug)) {
      result.push(b);
      registeredSlugs.add(b.slug);
    }
  });

  return result;
}

/**
 * Fetch single blog by slug
 */
export async function fetchBlogBySlug(slug: string): Promise<BlogItem | null> {
  if (!slug) return null;
  const blogs = await fetchAllBlogs();
  const matched = blogs.find(b => b.slug === slug || b.id === slug);
  return matched || null;
}

/**
 * Fetch blogs by category slug
 */
export async function fetchBlogsByCategory(categorySlug: string): Promise<BlogItem[]> {
  const blogs = await fetchAllBlogs();
  if (!categorySlug || categorySlug === 'all' || categorySlug === 'semua') {
    return blogs;
  }
  return blogs.filter(b => {
    const slugifiedCat = b.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slugifiedCat === categorySlug.toLowerCase() || b.category.toLowerCase() === categorySlug.toLowerCase();
  });
}

/**
 * Search blogs by query string
 */
export async function searchBlogsByQuery(queryStr: string): Promise<BlogItem[]> {
  const blogs = await fetchAllBlogs();
  const cleanQ = (queryStr || '').toLowerCase().trim();
  if (!cleanQ) return [];

  return blogs.filter(b => 
    b.title.toLowerCase().includes(cleanQ) ||
    b.excerpt.toLowerCase().includes(cleanQ) ||
    b.category.toLowerCase().includes(cleanQ) ||
    (b.tags && b.tags.some(t => t.toLowerCase().includes(cleanQ)))
  );
}
