import React from 'react';
import { X, LogIn, Bookmark } from 'lucide-react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  title?: string;
  description?: string;
}

export default function LoginPromptModal({
  isOpen,
  onClose,
  onLogin,
  title = 'Masuk untuk menyimpan aplikasi',
  description = 'Dengan masuk, kamu bisa membuat daftar aplikasi yang ingin kamu akses kembali nanti.'
}: LoginPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Tutup dialog masuk"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800/40">
          <Bookmark className="w-7 h-7" />
        </div>

        <h3 id="login-prompt-title" className="text-lg font-black text-slate-900 dark:text-white mb-2">
          {title}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              onLogin();
            }}
            aria-label="Masuk dengan akun Google"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <LogIn className="w-5 h-5" />
            <span>Masuk</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Batal dan tutup"
            className="w-full py-2.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            Lain kali
          </button>
        </div>
      </div>
    </div>
  );
}
