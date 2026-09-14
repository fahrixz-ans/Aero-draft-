import React from 'react';
import { ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type StepStatus = 'completed' | 'in_progress' | 'pending' | 'failed';

export interface AIProcessStep {
  id: string;
  label: string;
  status: StepStatus;
}

export type MediaCategory = 'text' | 'image' | 'video' | 'document' | 'multi';

export function buildProcessSteps(mediaType: MediaCategory = 'text'): AIProcessStep[] {
  switch (mediaType) {
    case 'image':
      return [
        { id: '1', label: 'Menerima pertanyaan dan media...', status: 'pending' },
        { id: '2', label: 'Menganalisis media...', status: 'pending' },
        { id: '3', label: 'Mengevaluasi dimensi dan detail pada gambar...', status: 'pending' },
        { id: '4', label: 'Memahami permintaan pengguna...', status: 'pending' },
        { id: '5', label: 'Saya perlu mencari data yang sesuai untuk menyiapkan jawaban...', status: 'pending' },
        { id: '6', label: 'Meninjau informasi yang tersedia...', status: 'pending' },
        { id: '7', label: 'Mencari jawaban di server...', status: 'pending' },
        { id: '8', label: 'Membandingkan informasi yang ditemukan dengan media...', status: 'pending' },
        { id: '9', label: 'Memvalidasi informasi...', status: 'pending' },
        { id: '10', label: 'Menyiapkan jawaban...', status: 'pending' },
        { id: '11', label: 'Jawaban ditemukan.', status: 'pending' },
        { id: '12', label: 'Berhasil.', status: 'pending' }
      ];
    case 'video':
      return [
        { id: '1', label: 'Menerima pertanyaan dan media...', status: 'pending' },
        { id: '2', label: 'Menganalisis video...', status: 'pending' },
        { id: '3', label: 'Mengevaluasi durasi, dimensi, dan detail yang relevan...', status: 'pending' },
        { id: '4', label: 'Memahami permintaan pengguna...', status: 'pending' },
        { id: '5', label: 'Saya perlu mencari data yang sesuai untuk menyiapkan jawaban...', status: 'pending' },
        { id: '6', label: 'Meninjau informasi yang tersedia...', status: 'pending' },
        { id: '7', label: 'Mencari jawaban di server...', status: 'pending' },
        { id: '8', label: 'Menganalisis informasi yang relevan dari video...', status: 'pending' },
        { id: '9', label: 'Memvalidasi informasi...', status: 'pending' },
        { id: '10', label: 'Menyiapkan jawaban...', status: 'pending' },
        { id: '11', label: 'Jawaban ditemukan.', status: 'pending' },
        { id: '12', label: 'Berhasil.', status: 'pending' }
      ];
    case 'document':
      return [
        { id: '1', label: 'Menerima pertanyaan dan dokumen...', status: 'pending' },
        { id: '2', label: 'Menganalisis dokumen...', status: 'pending' },
        { id: '3', label: 'Mengevaluasi format, struktur, dan informasi yang relevan...', status: 'pending' },
        { id: '4', label: 'Memahami permintaan pengguna...', status: 'pending' },
        { id: '5', label: 'Saya perlu mencari data yang sesuai untuk menyiapkan jawaban...', status: 'pending' },
        { id: '6', label: 'Meninjau informasi yang tersedia...', status: 'pending' },
        { id: '7', label: 'Mencari jawaban di server...', status: 'pending' },
        { id: '8', label: 'Memeriksa informasi yang relevan dari dokumen...', status: 'pending' },
        { id: '9', label: 'Memvalidasi informasi...', status: 'pending' },
        { id: '10', label: 'Menyiapkan jawaban...', status: 'pending' },
        { id: '11', label: 'Jawaban ditemukan.', status: 'pending' },
        { id: '12', label: 'Berhasil.', status: 'pending' }
      ];
    case 'multi':
      return [
        { id: '1', label: 'Menerima pertanyaan dan media...', status: 'pending' },
        { id: '2', label: 'Menganalisis media...', status: 'pending' },
        { id: '3', label: 'Mengevaluasi dimensi, format, struktur, dan detail yang relevan...', status: 'pending' },
        { id: '4', label: 'Mengekstrak informasi yang relevan...', status: 'pending' },
        { id: '5', label: 'Memahami permintaan pengguna...', status: 'pending' },
        { id: '6', label: 'Saya perlu mencari data yang sesuai untuk menyiapkan jawaban...', status: 'pending' },
        { id: '7', label: 'Meninjau informasi yang tersedia...', status: 'pending' },
        { id: '8', label: 'Mencari jawaban di server...', status: 'pending' },
        { id: '9', label: 'Membandingkan informasi yang ditemukan dengan media...', status: 'pending' },
        { id: '10', label: 'Memvalidasi informasi...', status: 'pending' },
        { id: '11', label: 'Menyiapkan jawaban...', status: 'pending' },
        { id: '12', label: 'Jawaban ditemukan.', status: 'pending' },
        { id: '13', label: 'Berhasil.', status: 'pending' }
      ];
    case 'text':
    default:
      return [
        { id: '1', label: 'Menerima pertanyaan...', status: 'pending' },
        { id: '2', label: 'Memahami permintaan pengguna...', status: 'pending' },
        { id: '3', label: 'Saya perlu mencari data yang sesuai untuk menyiapkan jawaban...', status: 'pending' },
        { id: '4', label: 'Meninjau informasi yang tersedia...', status: 'pending' },
        { id: '5', label: 'Mencari jawaban di server...', status: 'pending' },
        { id: '6', label: 'Memeriksa informasi yang ditemukan...', status: 'pending' },
        { id: '7', label: 'Memvalidasi informasi...', status: 'pending' },
        { id: '8', label: 'Menyiapkan jawaban...', status: 'pending' },
        { id: '9', label: 'Memproses jawaban...', status: 'pending' },
        { id: '10', label: 'Jawaban ditemukan.', status: 'pending' },
        { id: '11', label: 'Berhasil.', status: 'pending' }
      ];
  }
}

interface SingleProcessBannerProps {
  steps: AIProcessStep[];
  onOpenDetail: () => void;
}

export function SingleProcessBanner({ steps, onOpenDetail }: SingleProcessBannerProps) {
  if (!steps || steps.length === 0) return null;

  // Find active step (first step with in_progress, or last step with completed/failed)
  const activeStep = steps.find(s => s.status === 'in_progress') 
    || [...steps].reverse().find(s => s.status === 'completed' || s.status === 'failed') 
    || steps[0];

  return (
    <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 w-fit my-1.5 shadow-2xs h-8 overflow-hidden relative select-none">
      <div className="relative h-5 flex items-center overflow-hidden min-w-[200px] max-w-[280px] sm:max-w-md">
        <AnimatePresence mode="wait">
          <motion.span
            key={activeStep.id + '-' + activeStep.label}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-medium truncate absolute inset-0 flex items-center"
          >
            {activeStep.label}
          </motion.span>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={onOpenDetail}
        className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/20 font-bold text-blue-600 dark:text-blue-400 transition-colors cursor-pointer flex items-center justify-center shrink-0 z-10"
        title="Buka detail proses"
        aria-label="Detail proses"
        id="btn-open-process-detail"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ProcessDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: AIProcessStep[];
}

export function ProcessDetailModal({ isOpen, onClose, steps }: ProcessDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161617] border border-slate-200 dark:border-white/15 p-5 sm:p-6 space-y-4 shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Proses</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {steps.map((step) => {
            return (
              <div key={step.id} className="flex items-start gap-3 py-1 text-xs">
                <div className="mt-0.5 shrink-0 w-4 h-4 flex items-center justify-center">
                  {step.status === 'completed' && (
                    <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">✓</span>
                  )}
                  {step.status === 'in_progress' && (
                    <span className="text-blue-500 dark:text-blue-400 animate-pulse text-sm">●</span>
                  )}
                  {step.status === 'pending' && (
                    <span className="text-slate-300 dark:text-slate-600 text-sm">○</span>
                  )}
                  {step.status === 'failed' && (
                    <span className="text-rose-500 font-bold text-sm">✕</span>
                  )}
                </div>
                <span className={`leading-relaxed ${
                  step.status === 'completed'
                    ? 'text-slate-700 dark:text-slate-300'
                    : step.status === 'in_progress'
                    ? 'font-bold text-blue-600 dark:text-blue-400'
                    : step.status === 'failed'
                    ? 'font-bold text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
