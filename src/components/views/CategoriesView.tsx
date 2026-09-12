import React from 'react';
import { 
  Users, Music, Camera, CheckSquare, Gamepad2, Wrench, 
  Sparkles, MessageSquare, Film, GraduationCap, Wallet, 
  BookOpen, CloudSun, HeartPulse, ChevronRight, Layers 
} from 'lucide-react';
import { AppData } from '../../types';

interface CategoriesViewProps {
  apps: AppData[];
  onSelectCategory: (categoryName: string) => void;
}

export const CATEGORIES_METADATA = [
  { name: 'Komunikasi', icon: MessageSquare, count: 48, description: 'Aplikasi chat, video call, dan pesan instan' },
  { name: 'Sosial', icon: Users, count: 52, description: 'Media sosial, berbagi status, dan komunitas' },
  { name: 'Games', icon: Gamepad2, count: 120, description: 'Game aksi, RPG, strategi, dan petualangan' },
  { name: 'Musik & Audio', icon: Music, count: 36, description: 'Streaming musik, podcast, dan equalizer' },
  { name: 'Fotografi', icon: Camera, count: 42, description: 'Kamera HD, filter estetik, dan retouch foto' },
  { name: 'Video', icon: Film, count: 30, description: 'Editor video reels/tiktok dan pemutar media' },
  { name: 'Produktivitas', icon: CheckSquare, count: 64, description: 'Manajemen tugas, catatan, dan dokumen kantor' },
  { name: 'Alat', icon: Wrench, count: 58, description: 'Utilitas sistem, file manager, dan antivirus' },
  { name: 'Pendidikan', icon: GraduationCap, count: 28, description: 'Belajar bahasa, kursus, dan referensi akademik' },
  { name: 'Keuangan', icon: Wallet, count: 34, description: 'Dompet digital, perbankan, dan pencatat anggaran' },
  { name: 'Buku & Referensi', icon: BookOpen, count: 22, description: 'E-book reader, kamus, dan panduan belajar' },
  { name: 'Kesehatan', icon: HeartPulse, count: 18, description: 'Pelacak kebugaran, diet, dan meditasi' }
];

export default function CategoriesView({
  apps,
  onSelectCategory
}: CategoriesViewProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8" id="categories-view-container">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Kategori
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Temukan aplikasi dan game berdasarkan fungsi serta preferensi kebutuhan Anda.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORIES_METADATA.map((cat) => {
          const Icon = cat.icon;
          const dynamicCount = apps.filter(a => a.category?.toLowerCase() === cat.name.toLowerCase()).length;
          const displayCount = dynamicCount > 0 ? dynamicCount : cat.count;

          return (
            <div
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between gap-4 select-none"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-[14px] bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {displayCount} Aplikasi
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
