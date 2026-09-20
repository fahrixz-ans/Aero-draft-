import React, { useState, useEffect } from 'react';
import { Copy, Check, QrCode as QrIcon, Building2 } from 'lucide-react';
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
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

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

  const handleCopyAccount = (bankId: string, accountNumber: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(accountNumber);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = accountNumber;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopiedBankId(bankId);
      trackEvent('donation_account_copy', { metadata: { bankId } });

      setTimeout(() => {
        setCopiedBankId(null);
      }, 1800);
    } catch (err) {
      console.error('Failed to copy account number:', err);
    }
  };

  const scrollToSection = (sectionId: string) => {
    trackEvent('donation_method_select', { metadata: { method: sectionId } });
    const element = document.getElementById(sectionId);
    if (element) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      element.focus({ preventScroll: true });
    }
  };

  return (
    <div 
      id="donate-page-root"
      className="w-[calc(100%-32px)] sm:w-full sm:max-w-[680px] lg:max-w-[760px] mx-auto py-8 lg:py-[48px] animate-fade-in font-sans"
    >
      {/* 1. HERO / PAGE TITLE */}
      <div className="text-center">
        <h1 className="text-[32px] leading-[38px] font-bold tracking-[-0.5px] text-slate-900 dark:text-white">
          {t('donation.heading', 'Donasi')}
        </h1>
        <h2 className="text-[18px] leading-[24px] font-semibold text-slate-800 dark:text-slate-100 mt-2">
          {t('donation.subheading', 'Dukung Mod Station')}
        </h2>
        <p className="text-[14px] leading-[21px] font-normal text-slate-500 dark:text-slate-400 max-w-[520px] mx-auto mt-2">
          {t('donation.description', 'Terima kasih telah mendukung perkembangan Mod Station. Pilih metode donasi yang tersedia di bawah ini.')}
        </p>
      </div>

      {/* LOADING SKELETON STATE */}
      {loading && (
        <div className="mt-[40px] space-y-[40px] animate-pulse">
          {/* Method Cards Skeleton */}
          <div className="space-y-4">
            <div className="h-[18px] w-32 bg-slate-200 dark:bg-white/10 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] sm:gap-[12px]">
              <div className="h-[116px] lg:h-[132px] p-[20px] rounded-[16px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10" />
              <div className="h-[116px] lg:h-[132px] p-[20px] rounded-[16px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10" />
            </div>
          </div>

          {/* QRIS Skeleton */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-6 w-24 bg-slate-200 dark:bg-white/10 rounded-md" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded-md" />
            <div className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] lg:w-[240px] lg:h-[240px] p-[12px] rounded-[16px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10" />
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="mt-[40px] p-6 rounded-[16px] border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3">
          <p className="text-[14px] leading-[21px] text-red-600 dark:text-red-400 font-medium">
            {t('donation.errorMsg', 'Gagal memuat data donasi. Silakan coba lagi.')}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 rounded-[10px] bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] transition-colors cursor-pointer"
          >
            {t('donation.retry', 'Coba Lagi')}
          </button>
        </div>
      )}

      {/* CONTENT WHEN READY */}
      {!loading && !error && config && (
        <div className="mt-[40px]">
          
          {/* 2. SECTION TITLE: METODE DONASI */}
          <div className="mb-4">
            <h3 className="text-[13px] leading-[18px] font-semibold tracking-[0.4px] uppercase text-slate-500 dark:text-slate-400 text-left">
              {t('donation.methodsSection', 'METODE DONASI')}
            </h3>
          </div>

          {/* 3. METODE DONASI CARDS (QRIS & TRANSFER BANK) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] sm:gap-[12px]">
            {/* QRIS CARD */}
            <button
              type="button"
              onClick={() => scrollToSection('donation-qris-section')}
              className="h-[116px] lg:h-[132px] p-[20px] rounded-[16px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all text-left flex flex-col justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
              aria-label={t('donation.qrisCardTitle', 'QRIS')}
            >
              <QrIcon className="w-8 h-8 text-slate-900 dark:text-white shrink-0" />
              <div className="mt-2">
                <div className="text-[16px] leading-[22px] font-semibold text-slate-900 dark:text-white">
                  {t('donation.qrisCardTitle', 'QRIS')}
                </div>
                <div className="text-[13px] leading-[18px] font-normal text-slate-500 dark:text-slate-400 mt-[4px]">
                  {t('donation.qrisCardDesc', 'Donasi dengan QRIS')}
                </div>
              </div>
            </button>

            {/* TRANSFER BANK CARD */}
            <button
              type="button"
              onClick={() => scrollToSection('donation-bank-section')}
              className="h-[116px] lg:h-[132px] p-[20px] rounded-[16px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all text-left flex flex-col justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
              aria-label={t('donation.bankCardTitle', 'Transfer Bank')}
            >
              <Building2 className="w-8 h-8 text-slate-900 dark:text-white shrink-0" />
              <div className="mt-2">
                <div className="text-[16px] leading-[22px] font-semibold text-slate-900 dark:text-white">
                  {t('donation.bankCardTitle', 'Transfer Bank')}
                </div>
                <div className="text-[13px] leading-[18px] font-normal text-slate-500 dark:text-slate-400 mt-[4px]">
                  {t('donation.bankCardDesc', 'Donasi melalui rekening bank')}
                </div>
              </div>
            </button>
          </div>

          {/* 4. QRIS SECTION */}
          <div 
            id="donation-qris-section" 
            tabIndex={-1} 
            className="mt-[40px] focus:outline-hidden"
          >
            {config.qris && config.qris.imageUrl ? (
              <div className="flex flex-col items-center text-center">
                <h3 className="text-[22px] leading-[28px] font-bold text-slate-900 dark:text-white">
                  {t('donation.qrisCardTitle', 'QRIS')}
                </h3>
                <p className="text-[14px] leading-[20px] font-medium text-slate-600 dark:text-slate-300 mt-1">
                  {config.qris.merchantName}
                </p>

                {/* QR CODE CONTAINER */}
                <div className="mt-4 p-[12px] border border-slate-200 dark:border-white/10 rounded-[16px] bg-white dark:bg-white/5 shadow-2xs">
                  <img
                    src={config.qris.imageUrl}
                    alt={`Kode QRIS Donasi Mod Station - ${config.qris.merchantName}`}
                    className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] lg:w-[240px] lg:h-[240px] object-contain rounded-[8px]"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* QRIS INSTRUCTION */}
                <p className="text-[13px] leading-[19px] font-normal text-slate-500 dark:text-slate-400 mt-4">
                  {t('donation.qrisInstruction', 'Scan menggunakan aplikasi pembayaran Anda.')}
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-[16px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center">
                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                  {t('donation.qrisEmpty', 'QRIS belum tersedia')}
                </p>
              </div>
            )}
          </div>

          {/* 5. DIVIDER */}
          <div className="mt-[48px] mb-[40px] h-[1px] w-full bg-slate-200 dark:bg-white/10" />

          {/* 6. TRANSFER BANK SECTION */}
          <div 
            id="donation-bank-section" 
            tabIndex={-1} 
            className="focus:outline-hidden"
          >
            <h3 className="text-[13px] leading-[18px] font-semibold tracking-[0.4px] uppercase text-slate-500 dark:text-slate-400 text-left mb-4">
              {t('donation.bankSection', 'TRANSFER BANK')}
            </h3>

            {config.banks && config.banks.length > 0 ? (
              <div className="flex flex-col gap-[12px]">
                {config.banks.map((bank) => {
                  const isCopied = copiedBankId === bank.id;

                  return (
                    <div
                      key={bank.id}
                      className="w-full p-[20px] rounded-[16px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
                    >
                      <h4 className="text-[17px] leading-[23px] font-semibold text-slate-900 dark:text-white mb-3">
                        {bank.bankName}
                      </h4>

                      {/* NAMA REKENING */}
                      <div>
                        <span className="block text-[12px] leading-[17px] font-medium text-slate-500 dark:text-slate-400">
                          {t('donation.accountName', 'Nama Rekening')}
                        </span>
                        <span className="block text-[14px] leading-[20px] font-medium text-slate-900 dark:text-white mt-0.5">
                          {bank.accountHolder}
                        </span>
                      </div>

                      {/* NOMOR REKENING */}
                      <div className="mt-3">
                        <span className="block text-[12px] leading-[17px] font-medium text-slate-500 dark:text-slate-400">
                          {t('donation.accountNumber', 'Nomor Rekening')}
                        </span>
                        <div className="flex items-center justify-between gap-3 mt-0.5">
                          <span className="text-[14px] leading-[20px] font-medium font-mono text-slate-900 dark:text-white tracking-wide">
                            {bank.accountNumber}
                          </span>

                          {/* COPY BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(bank.id, bank.accountNumber)}
                            aria-label={`${t('donation.copy', 'Salin')} ${bank.bankName} ${bank.accountNumber}`}
                            className={`h-[36px] px-[12px] rounded-[10px] text-[13px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                              isCopied
                                ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-600'
                                : 'bg-white dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/20'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-4 h-4 stroke-[2.5]" />
                                <span>{t('donation.copied', 'Tersalin')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 stroke-[2]" />
                                <span>{t('donation.copy', 'Salin')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-[16px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center">
                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                  {t('donation.bankEmpty', 'Data rekening bank belum tersedia')}
                </p>
              </div>
            )}
          </div>

          {/* 7. THANK YOU MESSAGE */}
          <div className="mt-[64px] mb-[32px] text-center">
            <p className="text-[16px] leading-[23px] font-medium text-slate-600 dark:text-slate-300">
              {t('donation.thankYou', 'Terima kasih telah mendukung Mod Station.')}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
