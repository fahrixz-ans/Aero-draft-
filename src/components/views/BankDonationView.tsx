import React, { useState } from 'react';
import { Copy, Check, Building2, CreditCard, ShieldCheck } from 'lucide-react';
import BackButton from '../navigation/BackButton';

interface BankDonationViewProps {
  onBack: () => void;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  badgeColor: string;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeTextColor: string;
  code: string;
}

const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'seabank',
    bankName: 'SeaBank',
    accountHolder: 'FAHRI ANDRIAN SAPUTRA',
    accountNumber: '901160911399',
    badgeColor: '#0066FF',
    badgeBgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeBgDark: 'dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40',
    badgeTextColor: 'text-blue-600 dark:text-blue-400',
    code: 'SEABANK'
  },
  {
    id: 'jago',
    bankName: 'Bank Jago',
    accountHolder: 'FAHRI ANDRIAN SAPUTRA',
    accountNumber: '102667101926',
    badgeColor: '#FF6B00',
    badgeBgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeBgDark: 'dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    badgeTextColor: 'text-amber-600 dark:text-amber-400',
    code: 'JAGO'
  }
];

export default function BankDonationView({ onBack }: BankDonationViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, accountNumber: string) => {
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
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2500);
    } catch (err) {
      console.error('Gagal menyalin nomor rekening:', err);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 font-sans" id="bank-donation-page">
      {/* 1. Header with History Back Navigation */}
      <div className="flex items-center gap-3">
        <BackButton onBack={onBack} />
        <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
          Donasi Melalui Bank
        </h1>
      </div>

      {/* 2. Intro Section */}
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Dukung Perkembangan Mod Station
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          Dukung perkembangan Mod Station melalui transfer bank. Setiap dukungan membantu pengembangan, pemeliharaan, dan peningkatan layanan Mod Station.
        </p>
      </div>

      {/* 3. Bank Accounts List */}
      <div className="space-y-4 pt-1">
        {BANK_ACCOUNTS.map((bank) => {
          const isCopied = copiedId === bank.id;

          return (
            <div
              key={bank.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5 transition-all"
            >
              {/* Bank Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shrink-0">
                    <Building2 className={`w-5 h-5 ${bank.badgeTextColor}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {bank.bankName}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      Transfer Bank Online
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${bank.badgeBgLight} ${bank.badgeBgDark} tracking-wide`}>
                  {bank.code}
                </span>
              </div>

              {/* Account Details */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    ATAS NAMA
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {bank.accountHolder}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    NOMOR REKENING
                  </p>
                  <p className="text-base sm:text-lg font-mono font-black text-slate-900 dark:text-white tracking-wider mt-0.5 select-all">
                    {bank.accountNumber}
                  </p>
                </div>
              </div>

              {/* Copy Account Button */}
              <button
                onClick={() => handleCopy(bank.id, bank.accountNumber)}
                aria-label={`Salin nomor rekening ${bank.bankName}`}
                className={`w-full h-11 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] border ${
                  isCopied
                    ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-600'
                    : 'bg-slate-100 dark:bg-white/10 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" />
                    <span>Salin Nomor</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. Security Note */}
      <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-start gap-2.5 text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed font-medium">
          Mod Station tidak pernah meminta PIN, OTP, atau kata sandi perbankan Anda. Seluruh transaksi transfer dilakukan secara mandiri melalui aplikasi perbankan Anda.
        </p>
      </div>
    </div>
  );
}
