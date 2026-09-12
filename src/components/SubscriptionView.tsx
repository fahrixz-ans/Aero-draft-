import React, { useState } from 'react';
import { Crown, Check, CheckCircle2 } from 'lucide-react';
import BackButton from './navigation/BackButton';
import { SubscriptionPlan, UserRole } from '../types';

interface SubscriptionViewProps {
  subscriptionPlan?: SubscriptionPlan;
  userRole?: UserRole;
  user: any;
  onUpgradePlan?: (planId: 'monthly' | 'yearly') => void;
  onSignIn?: () => void;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export default function SubscriptionView({
  subscriptionPlan = 'free',
  userRole = 'user',
  user,
  onUpgradePlan,
  onSignIn,
  onBack,
  onNavigate
}: SubscriptionViewProps) {
  const [loading, setLoading] = useState(false);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';
  const isPremium = subscriptionPlan === 'premium' || isOwnerOrAdmin;

  const handleSubscribe = async () => {
    if (!user) {
      if (onSignIn) onSignIn();
      return;
    }

    setLoading(true);
    try {
      if (onUpgradePlan) {
        await onUpgradePlan('yearly');
      }
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-6" id="premium-view-root">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton onBack={handleBackClick} label="Mod Station Premium" showText={true} />
      </div>

      {/* Hero Visual */}
      <div className="text-center space-y-3 py-2">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <Crown className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Mod Station Premium
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
            Nikmati Mod Station tanpa iklan dan dukungan server prioritas.
          </p>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
            Status Langganan
          </span>
          {isPremium ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3 h-3" />
              <span>Premium Aktif</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200/60 dark:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6]">
              Belum Berlangganan
            </span>
          )}
        </div>

        {isPremium ? (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Langganan Anda aktif. Seluruh banner iklan disembunyikan.</span>
          </div>
        ) : (
          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed pt-1">
            Dapatkan pengalaman penjelajahan dan unduhan yang bersih tanpa gangguan iklan.
          </p>
        )}
      </div>

      {/* Features Plan */}
      <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#1C1C1E] border border-[#D2D2D7]/60 dark:border-[#38383A] space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
          Keuntungan Premium
        </h2>
        <ul className="space-y-2.5 text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
          <li className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Bebas iklan di seluruh aplikasi</span>
          </li>
          <li className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Pengalaman antarmuka lebih bersih dan cepat</span>
          </li>
          <li className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <span>Dukungan pelanggan prioritas</span>
          </li>
        </ul>
      </div>

      {/* Action Button */}
      {!isPremium ? (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span>{loading ? 'Memproses...' : 'Berlangganan Sekarang'}</span>
        </button>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
            Terima kasih telah menjadi anggota Mod Station Premium.
          </p>
        </div>
      )}
    </div>
  );
}

