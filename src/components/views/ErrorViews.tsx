import React from 'react';
import { AlertTriangle, ShieldAlert, ServerCrash, WifiOff, Home, RefreshCw } from 'lucide-react';

interface ErrorViewProps {
  type: '404' | '403' | '500' | 'offline';
  onNavigateHome: () => void;
  onRetry?: () => void;
}

export default function ErrorViews({
  type,
  onNavigateHome,
  onRetry
}: ErrorViewProps) {
  const configs = {
    '404': {
      icon: AlertTriangle,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-500/20',
      title: 'Halaman Tidak Ditemukan',
      subtitle: 'Maaf, tautan aplikasi atau halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia di server Mod Station.',
      showHome: true,
      showRetry: false
    },
    '403': {
      icon: ShieldAlert,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-500/20',
      title: 'Akses Terbatas (403 Forbidden)',
      subtitle: 'Anda tidak memiliki izin untuk mengakses direktori atau modul administrasi ini. Silakan masuk menggunakan akun resmi berwenang.',
      showHome: true,
      showRetry: false
    },
    '500': {
      icon: ServerCrash,
      color: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-500/20',
      title: 'Terjadi Kesalahan Server (500)',
      subtitle: 'Sistem sedang mengalami gangguan sementara saat memproses permintaan data Anda. Tim teknis kami sedang memperbaikinya.',
      showHome: true,
      showRetry: true
    },
    'offline': {
      icon: WifiOff,
      color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
      title: 'Koneksi Internet Terputus',
      subtitle: 'Perangkat Anda tidak terhubung ke jaringan internet. Silakan periksa koneksi data seluler atau Wi-Fi Anda.',
      showHome: false,
      showRetry: true
    }
  };

  const current = configs[type] || configs['404'];
  const Icon = current.icon;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-16 text-center select-none" id="error-view-container">
      <div className={`w-20 h-20 rounded-3xl ${current.color} flex items-center justify-center mx-auto mb-6 shadow-sm border`}>
        <Icon className="w-10 h-10" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        {current.title}
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
        {current.subtitle}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        {current.showRetry && (
          <button
            onClick={onRetry || (() => window.location.reload())}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Halaman</span>
          </button>
        )}

        {current.showHome && (
          <button
            onClick={onNavigateHome}
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        )}
      </div>
    </div>
  );
}
