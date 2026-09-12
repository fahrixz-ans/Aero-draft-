import React, { useState } from 'react';
import { ChevronRight, KeyRound, Laptop, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { AeroUser } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SettingsAccountSecurityViewProps {
  user: AeroUser | null;
  onNavigate: (view: string) => void;
  onBack: () => void;
  onSignOut: () => void;
}

export default function SettingsAccountSecurityView({
  user,
  onNavigate,
  onBack,
  onSignOut
}: SettingsAccountSecurityViewProps) {
  const { t, language } = useLanguage();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isGoogleConnected = Boolean(
    user?.photoURL?.includes('googleusercontent') ||
    user?.email?.endsWith('@gmail.com')
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="settings-account-security-view">
      {/* Back button */}
      <div className="flex items-center">
        <BackButton onBack={onBack} label={t('settings.title', 'Pengaturan')} showText={true} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('settings.accountSecurityTitle', 'Akun dan keamanan')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'id' 
            ? 'Kelola kata sandi, otentikasi login, dan sesi perangkat akun Anda.' 
            : 'Manage passwords, authentication, and device sessions for your account.'}
        </p>
      </div>

      {/* Section 1: Informasi Akun */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Informasi Akun
        </h2>
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-white/5 text-xs">
          <div className="px-5 py-3.5 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">{t('profile.email', 'Email')}</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {user?.email || (language === 'id' ? 'Belum masuk' : 'Not signed in')}
            </span>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Nama Pengguna</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {user?.displayName || user?.name || (language === 'id' ? 'Tamu' : 'Guest')}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Keamanan */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Keamanan
        </h2>
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-white/5">
          {/* Ganti Kata Sandi */}
          <button
            onClick={() => onNavigate('settings-change-password')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {t('security.changePassword', 'Ganti Kata Sandi')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Sesi & Perangkat */}
          <button
            onClick={() => onNavigate('settings-sessions')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {t('security.sessions', 'Sesi & Perangkat')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Login dengan Google */}
          <div className="w-full px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.17 21.32 7.23 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.39l4.09-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.18 6.61l4.09 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
              </div>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {t('security.googleLogin', 'Login dengan Google')}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              isGoogleConnected 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-400'
            }`}>
              {isGoogleConnected ? t('security.connected', 'Terhubung') : t('security.notConnected', 'Belum Terhubung')}
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Akun (Keluar) */}
      {user && (
        <div className="space-y-2 pt-2">
          <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-red-50/50 dark:hover:bg-red-950/20 text-red-600 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4" />
                <span className="font-semibold text-sm">
                  {t('common.logout', 'Keluar')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('security.logoutConfirmTitle', 'Keluar dari akun?')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t('security.logoutConfirmText', 'Anda harus masuk kembali untuk mengakses fitur akun dan bookmark Anda.')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Batal')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onSignOut();
                }}
                className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {t('common.logout', 'Keluar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
