import React, { useState } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScreenshotGalleryProps {
  screenshots: string[];
  appName: string;
}

export default function ScreenshotGallery({ screenshots, appName }: ScreenshotGalleryProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((activeIdx + 1) % screenshots.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx !== null) {
      setActiveIdx((activeIdx - 1 + screenshots.length) % screenshots.length);
    }
  };

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" id="screenshot-gallery">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Tangkapan Layar
        </h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Rasio asli • Klik untuk memperbesar
        </span>
      </div>

      {/* Horizontal Scrollable Row preserving native aspect ratios */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 snap-x snap-mandatory">
        {screenshots.map((url, idx) => (
          <div
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className="relative flex-none h-60 sm:h-72 w-auto max-w-[420px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 snap-start cursor-zoom-in group shadow-xs bg-slate-950 flex items-center justify-center"
          >
            <img
              src={url}
              alt={`${appName} Screenshot ${idx + 1}`}
              referrerPolicy="no-referrer"
              className="h-full w-auto max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-300 select-none"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Hover zoom overlay indicator */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <div className="p-2.5 bg-white/90 rounded-full text-slate-800 shadow">
                <Maximize2 className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Lightbox Modal overlay */}
      {activeIdx !== null && (
        <div
          onClick={() => setActiveIdx(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-fade-in"
          id="lightbox-overlay"
        >
          {/* Close button */}
          <button
            onClick={() => setActiveIdx(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            aria-label="Tutup preview"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Controls */}
          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer hidden sm:block"
            aria-label="Tangkapan layar sebelumnya"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Image wrapper preserving native aspect ratio */}
          <div className="relative max-w-[92vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
            <img
              src={screenshots[activeIdx]}
              alt={`${appName} Zoomed Screenshot ${activeIdx + 1}`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain select-none"
            />
          </div>

          <button
            onClick={handleNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer hidden sm:block"
            aria-label="Tangkapan layar selanjutnya"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-mono">
            {activeIdx + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </div>
  );
}
