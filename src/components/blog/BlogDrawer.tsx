import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Home, Download, Sparkles, Heart, Compass } from 'lucide-react';
import { CategoryItem } from './BlogCategoryBar';

interface BlogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onSelectCategory: (slug: string) => void;
  onNavigate: (view: string, slug?: string) => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

export default function BlogDrawer({
  isOpen,
  onClose,
  categories = [],
  onSelectCategory,
  onNavigate,
  onOpenAuthModal
}: BlogDrawerProps) {
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide Drawer (iOS style) */}
      <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-white dark:bg-[#1C1C1E] shadow-2xl z-10 flex flex-col overflow-y-auto animate-slide-left border-l border-slate-200/60 dark:border-white/10">
        
        {/* Top Header: Auth Buttons & Close */}
        <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAuthModal) onOpenAuthModal('login');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer btn-press-feedback"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAuthModal) onOpenAuthModal('register');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer btn-press-feedback shadow-xs"
            >
              Daftar
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors btn-close-effect"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content Items */}
        <div className="flex-1 p-4 space-y-4">
          
          {/* Main Links */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('blog');
                const el = document.getElementById('blog-terbaru-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm font-semibold transition-colors btn-press-feedback text-left"
            >
              <Sparkles className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <span>Blog Terbaru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('blog');
                const el = document.getElementById('mungkin-anda-suka-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm font-semibold transition-colors btn-press-feedback text-left"
            >
              <Heart className="w-4.5 h-4.5 text-rose-500" />
              <span>Mungkin Anda Suka</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('home');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-sm font-semibold transition-colors btn-press-feedback text-left"
            >
              <Home className="w-4.5 h-4.5 text-slate-500" />
              <span>Home</span>
            </button>
          </div>

          <div className="w-full h-[1px] bg-slate-200/60 dark:bg-white/10" />

          {/* Expandable Categories Section */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>Kategori Blog</span>
              </span>
              {isCategoryExpanded ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>

            {isCategoryExpanded && (
              <div className="pl-3 space-y-1 animate-fade-in">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectCategory(cat.slug);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left btn-press-feedback"
                  >
                    <span>{cat.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-[1px] bg-slate-200/60 dark:bg-white/10" />

          {/* Download Apps Link */}
          <div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('apps');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-sm font-bold transition-colors btn-press-feedback text-left"
            >
              <Download className="w-4.5 h-4.5" />
              <span>Download Apps</span>
            </button>
          </div>

        </div>

        {/* Footer info in Drawer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
          Mod Station Blog © 2026
        </div>
      </div>
    </div>
  );
}
