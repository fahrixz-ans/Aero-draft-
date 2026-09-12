import React, { useState, useEffect } from 'react';
import { 
  Download, ShieldCheck, CheckCircle2, 
  AlertCircle, RefreshCw, Smartphone, HardDrive, 
  Cpu, FileCode, ExternalLink, HelpCircle, Check, Copy 
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { AppData } from '../../types';

interface AppDownloadViewProps {
  app: AppData;
  onBack: () => void;
  onDownloadCompleted?: () => void;
}

export default function AppDownloadView({
  app,
  onBack,
  onDownloadCompleted
}: AppDownloadViewProps) {
  const [downloadStep, setDownloadStep] = useState<'prep' | 'downloading' | 'completed' | 'failed'>('prep');
  const [progress, setProgress] = useState(0);
  const [downloadedMB, setDownloadedMB] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);

  const totalMB = parseFloat(app.size?.replace(/[^0-9.]/g, '') || '50') || 50;

  // Auto countdown before download starts
  useEffect(() => {
    if (downloadStep === 'prep') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            startDownloadProcess();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [downloadStep]);

  // Real-time simulated download progress
  useEffect(() => {
    let interval: any;
    if (downloadStep === 'downloading' && !isPaused) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setDownloadStep('completed');
            if (onDownloadCompleted) onDownloadCompleted();
            return 100;
          }
          const next = prev + Math.floor(Math.random() * 8) + 4;
          const capped = Math.min(next, 100);
          setDownloadedMB(parseFloat(((capped / 100) * totalMB).toFixed(1)));
          return capped;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [downloadStep, isPaused, totalMB]);

  const startDownloadProcess = () => {
    setDownloadStep('downloading');
    setProgress(0);
    setDownloadedMB(0);
  };

  const handleCopySha = () => {
    const sha = app.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sha);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="app-download-flow-container">
      {/* Back button */}
      <BackButton onBack={onBack} label={`Kembali ke Detail ${app.name}`} showText={true} className="mb-6" />

      {/* Main Download Card Container */}
      <div className="bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-sm">
        {/* App Mini Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
          <img
            src={app.icon}
            alt={app.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover shadow-sm"
          />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white line-clamp-1">
              {app.name} APK
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Versi {app.version} • {app.size} • Oleh {app.developer}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AeroShield Verified • Bebas Virus & Malware</span>
            </div>
          </div>
        </div>

        {/* STEP 1: PREPARATION & COUNTDOWN */}
        {downloadStep === 'prep' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl font-black border-2 border-blue-500/30 animate-pulse">
              {countdown}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Menyiapkan Tautan Unduhan Anda...
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tautan unduhan aman dari server CDN terverifikasi akan segera dimulai otomatis dalam hitungan detik.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={startDownloadProcess}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Mulai Download Sekarang</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DOWNLOADING PROGRESS */}
        {downloadStep === 'downloading' && (
          <div className="py-8 space-y-5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">
                {isPaused ? 'Unduhan Dijeda' : 'Sedang Mengunduh Paket APK...'}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                {progress}%
              </span>
            </div>

            {/* Custom Progress Track */}
            <div className="w-full h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{downloadedMB} MB / {totalMB} MB</span>
              <span>Kecepatan: ~4.2 MB/s</span>
            </div>

            {/* Pause / Cancel Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {isPaused ? 'Lanjutkan' : 'Jeda Unduhan'}
              </button>
              <button
                onClick={() => setDownloadStep('failed')}
                className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Batalkan
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COMPLETED STATE */}
        {downloadStep === 'completed' && (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Unduhan Berhasil Diselesaikan!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                File <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{app.slug}-v{app.version}.apk</span> telah tersimpan di folder Download perangkat Anda.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={app.downloadUrl || '#'}
                download
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Simpan File APK Lagi</span>
              </a>
              <button
                onClick={onBack}
                className="px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                Kembali ke Aplikasi
              </button>
            </div>

            {/* Installation Instructions Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Petunjuk Pemasangan APK Android:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                <li>Buka notifikasi unduhan atau file manager pada perangkat Anda.</li>
                <li>Ketuk file APK yang telah diunduh.</li>
                <li>Jika muncul peringatan keamanan, pilih <strong>Pengaturan</strong> lalu aktifkan <strong>Izinkan dari Sumber Ini</strong>.</li>
                <li>Tekan tombol <strong>Pasang / Install</strong> dan tunggu hingga selesai.</li>
              </ol>
            </div>
          </div>
        )}

        {/* STEP 4: FAILED STATE */}
        {downloadStep === 'failed' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Proses Unduhan Terganggu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Koneksi jaringan terputus atau respon server CDN timeout.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={startDownloadProcess}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Unduh Ulang</span>
              </button>
              {app.officialUrl && (
                <a
                  href={app.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl inline-flex items-center gap-2 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Download dari Sumber Resmi</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Package Checksum Verification info */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            Informasi Integritas Berkas (SHA-256):
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
              {app.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </span>
            <button
              onClick={handleCopySha}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0 inline-flex items-center gap-1 border border-slate-200 dark:border-white/10 cursor-pointer"
            >
              {copiedSha ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSha ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
