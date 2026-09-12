import React, { useState } from 'react';
import { Download, Check, ShieldCheck, Building2, MapPin, QrCode } from 'lucide-react';
import BackButton from '../navigation/BackButton';

interface QrisDonationViewProps {
  onBack: () => void;
}

export default function QrisDonationView({ onBack }: QrisDonationViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadQr = async () => {
    try {
      setDownloading(true);
      const imageUrl = '/mod-station-qris.png';
      
      // Fetch image as blob for reliable cross-browser download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'mod-station-qris.png';
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Gagal mengunduh gambar QRIS:', err);
      // Fallback: direct anchor trigger
      const a = document.createElement('a');
      a.href = '/mod-station-qris.png';
      a.download = 'mod-station-qris.png';
      a.target = '_blank';
      a.click();
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5" id="qris-donation-page">
      {/* 1. Header with Back Navigation History */}
      <div className="flex items-center gap-3">
        <BackButton onBack={onBack} />
        <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
          Donasi Melalui QRIS
        </h1>
      </div>

      {/* 2. Main Title & Description */}
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Dukung Perkembangan Mod Station
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          Dukung perkembangan Mod Station melalui donasi QRIS. Setiap dukungan yang diberikan membantu pengembangan, pemeliharaan, dan peningkatan layanan Mod Station.
        </p>
      </div>

      {/* 3. QRIS Image Card Display */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col items-center justify-center space-y-4">
        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-white/20 shadow-xs inline-block">
          <img
            src="/mod-station-qris.png"
            alt="Kode QRIS Donasi Mod Station - Fantra Store"
            referrerPolicy="no-referrer"
            className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto"
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Pindai menggunakan aplikasi e-Wallet atau m-Banking Anda</span>
        </div>
      </div>

      {/* 4. QRIS Merchant Information Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-white/10">
          <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Informasi QRIS
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Nama Merchant
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Fantra Store</span>
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              NMID
            </p>
            <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 tracking-tight">
              ID1026477572014-A01
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Lokasi Merchant
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>KOTA BANDAR LAMPUNG</span>
            </p>
          </div>
        </div>
      </div>

      {/* 5. Download QR Button */}
      <button
        onClick={handleDownloadQr}
        disabled={downloading}
        className="w-full h-11 sm:h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-70"
        aria-label="Download QRIS Image"
      >
        {downloadSuccess ? (
          <>
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Berhasil Diunduh</span>
          </>
        ) : downloading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Mengunduh...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download QR</span>
          </>
        )}
      </button>
    </div>
  );
}
