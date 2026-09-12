import React from 'react';
import { CategoryItem } from './BlogCategoryBar';

interface BlogFooterProps {
  categories: CategoryItem[];
  onSelectCategory: (slug: string) => void;
  onNavigate: (view: string, slug?: string) => void;
}

export default function BlogFooter({
  categories = [],
  onSelectCategory,
  onNavigate
}: BlogFooterProps) {
  return (
    <footer className="w-full bg-slate-100 dark:bg-[#151517] text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-white/10 mt-12 py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Header: Brand Logo & Title */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-white/10 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              M
            </div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
              Mod Station Blog
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Pusat berita resmi, tips, panduan aplikasi Android, dan kabar pembaruan sistem Mod Station.
          </p>
        </div>

        {/* Category Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 py-2">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelectCategory(cat.slug)}
              className="text-left text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors py-1 truncate cursor-pointer btn-press-feedback"
            >
              • {cat.name}
            </button>
          ))}
        </div>

        <div className="w-full h-[1px] bg-slate-200/80 dark:bg-white/10" />

        {/* Social Media SVG Icons */}
        <div className="flex items-center justify-center gap-4 py-2">
          {/* Discord SVG */}
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-slate-200/80 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            aria-label="Discord"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>

          {/* WhatsApp SVG */}
          <a
            href="https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-slate-200/80 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            aria-label="WhatsApp Channel"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
          </a>

          {/* Instagram SVG */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-slate-200/80 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-pink-600 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            aria-label="Instagram"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

          {/* Telegram SVG */}
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-slate-200/80 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-sky-500 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            aria-label="Telegram"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.422-.169.565-.38.754-.582.772-.44.04-.774-.291-1.2-.57-.667-.437-1.044-.708-1.692-1.135-.749-.494-.264-.766.163-1.21.112-.116 2.053-1.88 2.091-2.042.005-.02.01-.097-.036-.138-.045-.041-.112-.027-.161-.016-.07.016-1.182.752-3.336 2.207-.315.216-.601.323-.857.317-.282-.007-.825-.16-1.229-.291-.495-.161-.889-.247-.855-.521.018-.143.214-.29.589-.442 2.308-1.006 3.848-1.67 4.62-1.992 2.199-.915 2.656-1.074 2.955-1.079.066 0 .213.016.308.094.08.066.102.155.111.217.009.062.02.205.011.317z"/>
            </svg>
          </a>
        </div>

        <div className="w-full h-[1px] bg-slate-200/80 dark:bg-white/10" />

        {/* Copyright Notice */}
        <p className="text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
          ©2026 Fantra, Mod Station Blog, logo and all associated elements (R) and © 2026 Blog for Mod Station, Inc. All rights reserved. displayed with permission.
        </p>

        {/* Policy & Information Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-600 dark:text-slate-400 pt-1">
          <button 
            type="button" 
            onClick={() => onNavigate('about')} 
            className="hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            Tentang Kami
          </button>
          <span>|</span>
          <button 
            type="button" 
            onClick={() => onNavigate('privacy')} 
            className="hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            Kebijakan Privasi
          </button>
          <span>|</span>
          <button 
            type="button" 
            onClick={() => onNavigate('donate')} 
            className="hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            Donasi
          </button>
          <span>|</span>
          <button 
            type="button" 
            onClick={() => onNavigate('dmca')} 
            className="hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            DMCA
          </button>
        </div>

      </div>
    </footer>
  );
}
