import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AppData, SubscriptionPlan } from '../types';

interface DownloadInterstitialModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppData | null;
  downloadType: 'apk' | 'official_link';
  onProceedDownload: () => void;
  onGoToSubscription: () => void;
}

export default function DownloadInterstitialModal({
  isOpen,
  onClose,
  app,
  downloadType,
  onProceedDownload,
  onGoToSubscription
}: DownloadInterstitialModalProps) {
  const [countdown, setCountdown] = useState(3);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setIsReady(false);
      return;
    }

    setCountdown(3);
    setIsReady(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !app) return null;

  const handleDownloadNow = () => {
    onProceedDownload();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" id="download-interstitial-modal">
      <div className="relative w-full max-w-md bg-white dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Target Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
          <img
            src={app.iconUrl || app.icon}
            alt={app.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
              {app.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {app.developer} · v{app.version}
            </p>
          </div>
        </div>

        {/* Advertisement Slot */}
        <div className="my-5 p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center space-y-2">
          <div className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
            IKLAN / ADVERTISEMENT
          </div>

          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Mendukung Server APK Bebas Iklan Palsu
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Aero menyediakan berkas APK yang telah dipindai SHA-256 dan bebas malware untuk komunitas.
          </p>

          <div className="pt-1">
            <button
              onClick={() => {
                onClose();
                onGoToSubscription();
              }}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Hilangkan Iklan & Dapatkan Download Instan</span>
            </button>
          </div>
        </div>

        {/* Action Button & Countdown */}
        <div className="space-y-3">
          {isReady ? (
            <button
              onClick={handleDownloadNow}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              id="interstitial-proceed-download-btn"
            >
              <Download className="w-4 h-4" />
              <span>{downloadType === 'apk' ? 'Download APK Sekarang' : 'Download Apk At Link'}</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 px-4 bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span>Menyiapkan Unduhan ({countdown}s)...</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Terverifikasi aman dan dipindai antivirus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
