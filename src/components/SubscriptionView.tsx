import React, { useState } from 'react';
import { Crown, Check, Zap, Shield, Sparkles, HelpCircle, ArrowRight, Star } from 'lucide-react';
import { SubscriptionPlan, UserRole } from '../types';

interface SubscriptionViewProps {
  subscriptionPlan?: SubscriptionPlan;
  userRole?: UserRole;
  user: any;
  onUpgradePlan?: (planId: 'monthly' | 'yearly') => void;
  onSignIn?: () => void;
}

export default function SubscriptionView({
  subscriptionPlan = 'free',
  userRole = 'user',
  user,
  onUpgradePlan,
  onSignIn
}: SubscriptionViewProps) {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isPremium = subscriptionPlan === 'premium';
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      if (onSignIn) onSignIn();
      return;
    }

    setLoading(true);
    try {
      if (onUpgradePlan) {
        await onUpgradePlan(plan);
      }
      setSuccessMessage(`Berhasil mengaktifkan status Premium (${plan === 'yearly' ? 'Tahunan' : 'Bulanan'})!`);
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="subscription-view">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
          <Crown className="w-3.5 h-3.5" />
          <span>Aero Premium</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Akses Bersih Tanpa Iklan
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Dukung server katalog APK Aero dan nikmati pengalaman eksplorasi serta unduhan langsung tanpa iklan interstitial.
        </p>

        {/* Current Plan Status Banner */}
        {isOwnerOrAdmin ? (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400">
            👑 Akun Administrator / Owner: Bebas iklan secara permanen pada semua perangkat.
          </div>
        ) : isPremium ? (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ✓ Akun Anda sedang aktif dalam paket <strong>Aero Premium</strong>. Semua iklan dan jeda unduhan telah dinonaktifkan.
          </div>
        ) : null}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </div>
        )}
      </div>

      {/* Plan Switcher */}
      <div className="flex justify-center mb-8">
        <div className="p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-1">
          <button
            onClick={() => setSelectedBilling('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedBilling === 'monthly'
                ? 'bg-white dark:bg-[#131924] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setSelectedBilling('yearly')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedBilling === 'yearly'
                ? 'bg-white dark:bg-[#131924] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Tahunan</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-black">
              Hemat 30%
            </span>
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* FREE PLAN */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121722] p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Aero Free
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                Bawaan
              </span>
            </div>

            <div className="mt-4 mb-6">
              <span className="text-3xl font-black text-slate-900 dark:text-white">Gratis</span>
              <span className="text-xs text-slate-400 ml-1">/ selamanya</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Akses lengkap ke seluruh katalog aplikasi & game Android</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Unduhan file APK resmi dan tersertifikasi SHA-256</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-400">
                <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-white/5 text-center text-[10px] shrink-0 font-bold mt-0.5">·</span>
                <span>Menampilkan iklan banner komunitas</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-400">
                <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-white/5 text-center text-[10px] shrink-0 font-bold mt-0.5">·</span>
                <span>Jeda iklan 3 detik sebelum unduhan dimulai</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              disabled={!isPremium}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-400 text-center"
            >
              {isPremium ? 'Beralih ke Free' : 'Paket Aktif Saat Ini'}
            </button>
          </div>
        </div>

        {/* PREMIUM PLAN */}
        <div className="relative rounded-2xl border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-[#121722] p-6 flex flex-col justify-between shadow-lg">
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
            Rekomendasi
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Aero Premium
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                👑 Bebas Iklan
              </span>
            </div>

            <div className="mt-4 mb-6">
              {selectedBilling === 'yearly' ? (
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">Rp 99.000</span>
                  <span className="text-xs text-slate-400 ml-1">/ tahun</span>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Hanya Rp 8.250/bulan</p>
                </div>
              ) : (
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">Rp 12.000</span>
                  <span className="text-xs text-slate-400 ml-1">/ bulan</span>
                </div>
              )}
            </div>

            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2.5 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>100% Bebas Iklan Banner di Seluruh Halaman</span>
              </li>
              <li className="flex items-start gap-2.5 font-bold text-slate-900 dark:text-white">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Unduhan Instan Langsung Tanpa Iklan Interstitial</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Badge Pendukung Eksklusif pada Profil Pengguna</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Prioritas Jalur Bandwidth Unduhan APK Server</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleSubscribe(selectedBilling)}
              disabled={loading || isPremium}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Crown className="w-4 h-4" />
              <span>{isPremium ? 'Status Premium Aktif' : loading ? 'Memproses...' : 'Aktifkan Aero Premium'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Developer Distinction Note (Section 29) */}
      <div className="mt-10 p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] max-w-4xl mx-auto text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <span>Informasi Perbedaan Akun Developer & Status Berlangganan</span>
        </h4>
        <p>
          Status <strong>Developer</strong> dan status <strong>Berlangganan Premium</strong> adalah dua hak akses independen:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
          <div className="p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            • <strong>User + Free:</strong> Iklan aktif
          </div>
          <div className="p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            • <strong>User + Premium:</strong> Bebas iklan
          </div>
          <div className="p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            • <strong>Developer + Free:</strong> Iklan aktif
          </div>
          <div className="p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            • <strong>Developer + Premium:</strong> Bebas iklan
          </div>
        </div>
      </div>
    </div>
  );
}
