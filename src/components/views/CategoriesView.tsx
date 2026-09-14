import React, { useState, useMemo } from 'react';
import { 
  Users, Music, Camera, CheckSquare, Gamepad2, Wrench, 
  Sparkles, MessageSquare, Film, GraduationCap, Wallet, 
  BookOpen, CloudSun, HeartPulse, ChevronRight, Layers,
  Search, Grid, ShieldCheck, Cpu, Smartphone, Globe, Landmark
} from 'lucide-react';
import { AppData } from '../../types';
import { CATEGORIES_100 } from '../../data/categories100';
import { categoryToSlug, appMatchesCategory } from '../../utils/categoryUtils';
import AdSlot from '../common/AdSlot';

interface CategoriesViewProps {
  apps: AppData[];
  onSelectCategory: (categorySlug: string) => void;
}

// Icon mapper for categories
const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('game')) return Gamepad2;
  if (lower.includes('sosial') || lower.includes('social') || lower.includes('kencan')) return Users;
  if (lower.includes('musik') || lower.includes('audio') || lower.includes('podcast') || lower.includes('radio')) return Music;
  if (lower.includes('foto') || lower.includes('kamera') || lower.includes('galeri')) return Camera;
  if (lower.includes('video') || lower.includes('streaming') || lower.includes('film') || lower.includes('tv')) return Film;
  if (lower.includes('komunikasi') || lower.includes('chat') || lower.includes('pesan')) return MessageSquare;
  if (lower.includes('keuangan') || lower.includes('bank') || lower.includes('investasi') || lower.includes('dompet') || lower.includes('saham') || lower.includes('pembayaran')) return Wallet;
  if (lower.includes('pendidikan') || lower.includes('belajar') || lower.includes('kamus')) return GraduationCap;
  if (lower.includes('buku') || lower.includes('komik') || lower.includes('ensiklopedia') || lower.includes('referensi')) return BookOpen;
  if (lower.includes('cuaca')) return CloudSun;
  if (lower.includes('kesehatan') || lower.includes('medis') || lower.includes('kebugaran')) return HeartPulse;
  if (lower.includes('alat') || lower.includes('kalkulator') || lower.includes('sistem')) return Wrench;
  if (lower.includes('keamanan') || lower.includes('vpn')) return ShieldCheck;
  if (lower.includes('ai') || lower.includes('asisten') || lower.includes('developer') || lower.includes('program')) return Cpu;
  if (lower.includes('pemerintahan')) return Landmark;
  if (lower.includes('peta') || lower.includes('navigasi') || lower.includes('transportasi') || lower.includes('wisata')) return Globe;
  if (lower.includes('smartwatch') || lower.includes('jam') || lower.includes('auto')) return Smartphone;
  if (lower.includes('produktivitas') || lower.includes('catatan') || lower.includes('dokumen') || lower.includes('kalender')) return CheckSquare;
  return Layers;
};

export default function CategoriesView({
  apps,
  onSelectCategory
}: CategoriesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 100 Categories list with dynamic app count
  const categoriesList = useMemo(() => {
    return CATEGORIES_100.map(name => {
      const slug = categoryToSlug(name);
      const count = apps.filter(a => appMatchesCategory(a, name)).length;
      return {
        name,
        slug,
        count,
        icon: getCategoryIcon(name)
      };
    });
  }, [apps]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoriesList;
    const q = searchQuery.toLowerCase().trim();
    return categoriesList.filter(c => c.name.toLowerCase().includes(q));
  }, [categoriesList, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8" id="categories-view-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kategori
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Daftar 100 kategori aplikasi dan game Android terverifikasi aman di Mod Station.
          </p>
        </div>

        {/* Search filter */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kategori..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {/* Strategic Ad Placement for Categories View */}
      <AdSlot page="categories" placement="top-banner" slotId="categories-top-banner" />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;

          return (
            <div
              key={cat.slug}
              onClick={() => onSelectCategory(cat.slug)}
              className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3 select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-[14px] bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {cat.count} Aplikasi
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
