import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, Laptop, LogOut, CheckCircle2, KeyRound, AlertTriangle } from 'lucide-react';
import BackButton from '../navigation/BackButton';

interface SettingsSecurityViewProps {
  onBack: () => void;
}

export default function SettingsSecurityView({ onBack }: SettingsSecurityViewProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Chrome di Windows 11',
      type: 'desktop',
      location: 'Jakarta, Indonesia',
      lastActive: 'Sedang Aktif (Perangkat Ini)',
      isCurrent: true
    },
    {
      id: 'sess-2',
      device: 'Samsung Galaxy S24 Ultra',
      type: 'mobile',
      location: 'Surabaya, Indonesia',
      lastActive: '2 jam yang lalu',
      isCurrent: false
    },
    {
      id: 'sess-3',
      device: 'Safari di macOS Sonoma',
      type: 'desktop',
      location: 'Bandung, Indonesia',
      lastActive: '3 hari yang lalu',
      isCurrent: false
    }
  ]);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setStatusMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    setStatusMsg('Kata sandi berhasil diperbarui!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleTerminateSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleTerminateAllOther = () => {
    setSessions(sessions.filter(s => s.isCurrent));
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="settings-security-view-container">
      {/* Back button */}
      <BackButton onBack={onBack} label="Kembali" showText={true} />

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-2 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Proteksi & Keamanan Akun</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Keamanan & Sesi Perangkat
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola kata sandi, otentikasi dua langkah, dan pantau seluruh perangkat yang terhubung ke akun Mod Station Anda.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Section 1: Ubah Kata Sandi */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-600" />
          <span>Ubah Kata Sandi</span>
        </h2>

        <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Simpan Kata Sandi Baru
          </button>
        </form>
      </div>

      {/* Section 2: Two Factor Authentication (2FA) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Verifikasi 2 Langkah (2FA)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
            Amankan akun Anda dengan meminta kode OTP setiap kali login dari perangkat atau browser baru yang belum dikenal.
          </p>
        </div>

        <button
          onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            twoFactorEnabled
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
          }`}
        >
          {twoFactorEnabled ? '2FA Aktif' : 'Aktifkan 2FA'}
        </button>
      </div>

      {/* Section 3: Sesi Perangkat Aktif */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>Sesi Perangkat yang Sedang Login</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar sesi yang memiliki otorisasi akses ke akun Anda.
            </p>
          </div>

          <button
            onClick={handleTerminateAllOther}
            className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer self-start sm:self-auto"
          >
            Keluar dari Semua Perangkat Lain
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                  {sess.type === 'desktop' ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {sess.device}
                    </span>
                    {sess.isCurrent && (
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-md">
                        Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {sess.location} • {sess.lastActive}
                  </p>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  onClick={() => handleTerminateSession(sess.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Keluarkan Perangkat"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
