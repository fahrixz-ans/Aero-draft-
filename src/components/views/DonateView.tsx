import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  QrCode, 
  Building2, 
  MessageCircle, 
  Send,
  Share2,
  Instagram
} from 'lucide-react';
import BackButton from '../navigation/BackButton';

interface DonateViewProps {
  onNavigate?: (view: string) => void;
  onBack?: () => void;
  onBackHome?: () => void;
  user?: any;
  onSignIn?: () => void | Promise<void>;
}

export default function DonateView({ onNavigate, onBack }: DonateViewProps) {
  const [qrisOpen, setQrisOpen] = useState(true);
  const [bankOpen, setBankOpen] = useState(false);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const handleCopy = (bankId: string, accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedBank(bankId);
    setTimeout(() => {
      setCopiedBank(null);
    }, 2000);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  const banks = [
    {
      id: 'seabank',
      name: 'SeaBank',
      accountHolder: 'Mod Station Official',
      accountNumber: '901234567890'
    },
    {
      id: 'jago',
      name: 'Bank Jago',
      accountHolder: 'Mod Station Official',
      accountNumber: '102938475610'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="donate-view-root">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton onBack={handleBackClick} label="Dukung Mod Station" showText={true} />
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-3 py-2">
        <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] flex items-center justify-center mx-auto">
          <img 
            src="/assets/mod-station-logo.svg" 
            alt="Mod Station Logo" 
            className="w-10 h-10 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Dukung Mod Station
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6] max-w-md mx-auto leading-relaxed">
            Dukungan Anda membantu keberlangsungan server cepat, pembaruan aplikasi terverifikasi setiap hari, dan platform bebas iklan yang mengganggu.
          </p>
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-3">
        {/* QRIS Accordion */}
        <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden transition-all">
          <button
            onClick={() => setQrisOpen(!qrisOpen)}
            className="w-full p-4 flex items-center justify-between text-left font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-expanded={qrisOpen}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <span>QRIS</span>
            </div>
            {qrisOpen ? (
              <ChevronUp className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            )}
          </button>

          {qrisOpen && (
            <div className="px-5 pb-6 pt-2 border-t border-[#D2D2D7]/40 dark:border-[#38383A] text-center space-y-4">
              <div className="inline-block p-4 rounded-2xl bg-white border border-[#D2D2D7]/80 shadow-xs mx-auto">
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-slate-900 rounded-xl p-3 flex items-center justify-center text-white relative">
                  <QrCode className="w-full h-full text-white" />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Mod Station Official
                </div>
                <div className="text-[#6E6E73] dark:text-[#A1A1A6] font-mono">
                  NMID: ID1020039281928
                </div>
                <div className="text-[#6E6E73] dark:text-[#A1A1A6]">
                  Kota: Jakarta
                </div>
              </div>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] max-w-sm mx-auto">
                Mendukung seluruh aplikasi Mobile Banking dan E-Wallet resmi di Indonesia.
              </p>
            </div>
          )}
        </div>

        {/* Bank Accordion */}
        <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] overflow-hidden transition-all">
          <button
            onClick={() => setBankOpen(!bankOpen)}
            className="w-full p-4 flex items-center justify-between text-left font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-expanded={bankOpen}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span>Transfer Bank</span>
            </div>
            {bankOpen ? (
              <ChevronUp className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            )}
          </button>

          {bankOpen && (
            <div className="p-4 border-t border-[#D2D2D7]/40 dark:border-[#38383A] space-y-3">
              {banks.map((b) => (
                <div 
                  key={b.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-[#D2D2D7]/50 dark:border-[#38383A] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {b.name}
                      </div>
                      <div className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        Atas Nama: <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{b.accountHolder}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F5F5F7] dark:bg-black/20">
                    <span className="font-mono text-xs sm:text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-wider">
                      {b.accountNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(b.id, b.accountNumber)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                    >
                      {copiedBank === b.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appreciation Message */}
      <div className="text-center pt-2">
        <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
          Terima kasih kepada semua pengguna yang telah mendukung Mod Station.
        </p>
      </div>

      {/* Follow Kami Section */}
      <div className="pt-4 border-t border-[#D2D2D7]/60 dark:border-[#38383A] text-center space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
          Follow Kami
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <a
            href="https://whatsapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] hover:bg-slate-200/50 dark:hover:bg-white/10 border border-[#D2D2D7]/40 dark:border-[#38383A] flex flex-col items-center justify-center gap-1 text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium">WhatsApp</span>
          </a>

          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] hover:bg-slate-200/50 dark:hover:bg-white/10 border border-[#D2D2D7]/40 dark:border-[#38383A] flex flex-col items-center justify-center gap-1 text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-medium">Discord</span>
          </a>

          <a
            href="https://t.me/modstation"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] hover:bg-slate-200/50 dark:hover:bg-white/10 border border-[#D2D2D7]/40 dark:border-[#38383A] flex flex-col items-center justify-center gap-1 text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-medium">Telegram</span>
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#1C1C1E] hover:bg-slate-200/50 dark:hover:bg-white/10 border border-[#D2D2D7]/40 dark:border-[#38383A] flex flex-col items-center justify-center gap-1 text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
          >
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="text-xs font-medium">Instagram</span>
          </a>
        </div>
      </div>
    </div>
  );
}

