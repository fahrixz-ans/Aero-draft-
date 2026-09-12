import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Download, Image as ImageIcon } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { AppData } from '../../types';

interface AppScreenshotsViewProps {
  app: AppData;
  onBack: () => void;
}

export default function AppScreenshotsView({
  app,
  onBack
}: AppScreenshotsViewProps) {
  const screenshots = app.screenshots && app.screenshots.length > 0
    ? app.screenshots
    : [
        'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=1200&h=800&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=800&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200&h=800&fit=crop&q=80'
      ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="app-screenshots-gallery-view">
      {/* Back button */}
      <BackButton onBack={onBack} label={`Kembali ke Detail ${app.name}`} showText={true} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Galeri Cuplikan Layar {app.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tampilan antarmuka resmi aplikasi dalam resolusi tinggi.
          </p>
        </div>

        <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
          {currentIndex + 1} / {screenshots.length}
        </div>
      </div>

      {/* Main Large Viewer */}
      <div className="relative w-full h-[400px] sm:h-[550px] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-xl border border-slate-800">
        <img
          src={screenshots[currentIndex]}
          alt={`Screenshot ${currentIndex + 1}`}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-full object-contain select-none"
        />

        {/* Prev / Next Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-all hover:scale-110"
          aria-label="Screenshot Sebelumnya"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-all hover:scale-110"
          aria-label="Screenshot Selanjutnya"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex items-center justify-center gap-3 overflow-x-auto py-2 no-scrollbar">
        {screenshots.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative rounded-xl overflow-hidden shrink-0 w-20 h-14 sm:w-28 sm:h-18 border-2 transition-all cursor-pointer ${
              currentIndex === idx
                ? 'border-blue-500 scale-105 shadow-md ring-2 ring-blue-500/20'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img
              src={img}
              alt={`Thumb ${idx + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
