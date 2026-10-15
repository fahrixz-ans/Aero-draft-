import React, { useState, useEffect } from 'react';
import { QrCode as QrIcon, Check, Download, Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchDonationConfig } from '../../services/donationService';
import { DonationConfigData } from '../../types/donation';
import { trackEvent } from '../../services/analytics/analyticsService';

interface DonateViewProps {
  onNavigate?: (view: string) => void;
  onBack?: () => void;
  onBackHome?: () => void;
  user?: any;
  onSignIn?: () => void | Promise<void>;
}

export default function DonateView({ onNavigate }: DonateViewProps) {
  const { t } = useLanguage();
  
  const [config, setConfig] = useState<DonationConfigData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchDonationConfig();
      setConfig(data);
    } catch (err) {
      console.error('Failed to load donation configuration:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    trackEvent('donation_page_view', { surface: 'donate' });
  }, []);

  const handleDownloadQRIS = async () => {
    const qrisUrl = config?.qris?.imageUrl || '/mod-station-qris.png';
    try {
      const res = await fetch(qrisUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mod-station-qris.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
      trackEvent('donation_qris_download', { metadata: { merchant: config?.qris?.merchantName } });
    } catch (err) {
      console.error('Download QRIS failed:', err);
    }
  };

  return (
    <div 
      id="donate-page-root"
      className="w-[calc(100%-32px)] sm:w-full sm:max-w-[640px] mx-auto py-8 lg:py-12 animate-fade-in font-sans"
    >
      {/* 1. HERO / PAGE TITLE */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mb-3 shadow-xs">
          <Heart className="w-6 h-6 fill-rose-500" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          {t('donation.heading', 'Donasi')}
        </h1>
        <h2 className="text-base font-semibold text-slate-700 mt-1.5">
          {t('donation.subheading', 'Dukung Mod Station')}
        </h2>
        <p className="text-sm font-normal text-slate-500 max-w-[500px] mx-auto mt-2">
          {t('donation.description', 'Seluruh donasi digunakan untuk biaya server, verifikasi aplikasi, dan pemeliharaan Mod Station. Scan QRIS resmi kami di bawah ini.')}
        </p>
      </div>

      {/* LOADING SKELETON STATE */}
      {loading && (
        <div className="mt-8 p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-4 animate-pulse">
          <div className="h-6 w-32 bg-slate-200 rounded-md" />
          <div className="h-4 w-48 bg-slate-100 rounded-md" />
          <div className="w-[220px] h-[220px] rounded-2xl bg-slate-100 border border-slate-200" />
          <div className="h-10 w-44 bg-slate-200 rounded-xl" />
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="mt-8 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-3">
          <p className="text-sm text-red-600 font-medium">
            {t('donation.errorMsg', 'Gagal memuat data donasi. Silakan coba lagi.')}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {t('donation.retry', 'Coba Lagi')}
          </button>
        </div>
      )}

      {/* QRIS SOLE DONATION METHOD */}
      {!loading && !error && config && (
        <div className="mt-8">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold tracking-wide uppercase mb-3">
              <QrIcon className="w-3.5 h-3.5 text-slate-900" />
              <span>Metode Resmi: QRIS</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              {config.qris?.merchantName || 'MOD STATION INDONESIA'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Mendukung semua aplikasi e-wallet & mobile banking (GoPay, OVO, DANA, BCA, Mandiri, BRI, ShopeePay, dll.)
            </p>

            {/* QR CODE CONTAINER */}
            <div className="mt-5 p-3.5 border-2 border-slate-100 rounded-2xl bg-white shadow-xs">
              <img
                src={config.qris?.imageUrl || '/mod-station-qris.png'}
                alt={`Kode QRIS Donasi Mod Station - ${config.qris?.merchantName || 'MOD STATION'}`}
                className="w-[220px] h-[220px] sm:w-[250px] sm:h-[250px] object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/mod-station-qris.png';
                }}
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownloadQRIS}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Gambar QRIS Tersimpan</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh Gambar QRIS</span>
                  </>
                )}
              </button>
            </div>

            {/* INSTRUCTIONS */}
            <div className="mt-6 pt-5 border-t border-slate-100 w-full text-left space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cara Donasi Melalui QRIS:
              </h4>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Buka aplikasi m-Banking atau dompet digital (GoPay, OVO, Dana, LinkAja, ShopeePay, dsb).</li>
                <li>Pilih menu <strong>Pindai / Scan QRIS</strong> di aplikasi Anda.</li>
                <li>Arahkan kamera ke kode QR di atas atau unggah gambar QRIS yang telah diunduh.</li>
                <li>Masukkan nominal donasi yang ingin Anda berikan dan konfirmasi transaksi.</li>
              </ol>
            </div>
          </div>

          {/* THANK YOU */}
          <div className="mt-8 text-center">
            <p className="text-sm font-semibold text-slate-600">
              {t('donation.thankYou', 'Terima kasih atas kontribusi dan dukungan Anda untuk Mod Station!')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
