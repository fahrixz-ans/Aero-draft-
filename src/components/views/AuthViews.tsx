import React, { useState } from 'react';
import { 
  Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, 
  Eye, EyeOff, Loader2 
} from 'lucide-react';
import BackButton from '../navigation/BackButton';

interface AuthViewsProps {
  mode: 'login' | 'register' | 'forgot-password' | 'verify';
  onNavigate: (view: string) => void;
  onSuccess?: () => void;
  onBack?: () => void;
}

// In-memory temporary storage for auto-login after registration verification
// Banned from localStorage/sessionStorage, so we keep it strictly in-memory
let tempRegistrationCredentials: { email: string; password: string } | null = null;
let lastRegisteredEmail: string = '';

export default function AuthViews({
  mode,
  onNavigate,
  onSuccess,
  onBack
}: AuthViewsProps) {
  const [email, setEmail] = useState(lastRegisteredEmail || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState(''); // for reset password flow
  
  // Password Visibility Toggle States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          setErrorMsg('Silakan isi email dan kata sandi Anda.');
          setIsLoading(false);
          return;
        }

        // Call Auth.js credentials login endpoint
        const res = await fetch('/api/auth/callback/credentials?json=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (res.ok || res.redirected) {
          setSuccessMsg('Login berhasil! Mengalihkan ke beranda...');
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onNavigate('home');
            window.location.reload();
          }, 800);
        } else {
          let errorText = 'Email atau password salah.';
          try {
            const data = await res.json();
            if (data?.error || data?.message) {
              errorText = data.error || data.message;
            }
          } catch (e) {
            // fallback
          }
          setErrorMsg(errorText);
        }
      } else if (mode === 'register') {
        if (!name.trim()) {
          setErrorMsg('Nama lengkap wajib diisi.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Konfirmasi kata sandi tidak cocok.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Kata sandi minimal harus 6 karakter.');
          setIsLoading(false);
          return;
        }
        if (!agreeTerms) {
          setErrorMsg('Anda harus menyetujui syarat & ketentuan layanan.');
          setIsLoading(false);
          return;
        }

        // Call the real backend registration endpoint
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, confirmPassword })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          // Store temporary credentials in memory for auto-login after verification
          tempRegistrationCredentials = { email: email.toLowerCase().trim(), password };
          lastRegisteredEmail = email.toLowerCase().trim();
          
          setSuccessMsg(data.message || 'Registrasi berhasil! Kode verifikasi telah dikirim.');
          setTimeout(() => {
            onNavigate('auth-verification');
          }, 1200);
        } else {
          setErrorMsg(data.error?.message || 'Registrasi gagal. Silakan coba lagi.');
        }
      }
    } catch (err: any) {
      console.error('Auth action error:', err);
      setErrorMsg('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth popup login handler
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const callbackUrl = encodeURIComponent(`${window.location.origin}/api/auth/callback-success`);
      const authUrl = `/api/auth/signin/google?callbackUrl=${callbackUrl}`;
      const authWindow = window.open(authUrl, 'oauth_popup', 'width=600,height=700');
      
      if (!authWindow) {
        setErrorMsg('Silakan aktifkan pop-up browser untuk melanjutkan login dengan Google.');
        setGoogleLoading(false);
      } else {
        const timer = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(timer);
            setGoogleLoading(false);
            if (onSuccess) onSuccess();
            onNavigate('home');
            window.location.reload();
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setErrorMsg('Login Google gagal. Silakan coba lagi.');
      setGoogleLoading(false);
    }
  };

  // Send Forgot Password Code
  const handleSendResetCode = async () => {
    if (!email) {
      setErrorMsg('Silakan masukkan alamat email Anda terlebih dahulu.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Kode verifikasi berhasil dikirim.');
        setIsCodeSent(true);
      } else {
        setErrorMsg(data.error?.message || 'Gagal mengirim kode verifikasi.');
      }
    } catch (err) {
      setErrorMsg('Kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Reset Code & Set New Password
  const handleVerifyAndResetPassword = async () => {
    if (!email || !verificationCode || !newPassword) {
      setErrorMsg('Silakan lengkapi email, kode verifikasi, dan kata sandi baru.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, newPassword })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Kata sandi berhasil diperbarui.');
        setTimeout(() => {
          onNavigate('auth-login');
        }, 1500);
      } else {
        setErrorMsg(data.error?.message || 'Verifikasi gagal.');
      }
    } catch (err) {
      setErrorMsg('Kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Registration Code
  const handleVerifyRegistration = async () => {
    const targetEmail = email || lastRegisteredEmail;
    if (!targetEmail || !verificationCode) {
      setErrorMsg('Silakan lengkapi email dan kode verifikasi.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: verificationCode })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Verifikasi berhasil! Mencoba masuk secara otomatis...');
        
        // Auto-login if we have temporary registration credentials in memory
        if (tempRegistrationCredentials && tempRegistrationCredentials.email === targetEmail) {
          try {
            const loginRes = await fetch('/api/auth/callback/credentials?json=true', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tempRegistrationCredentials)
            });

            if (loginRes.ok) {
              setSuccessMsg('Masuk berhasil! Mengalihkan ke beranda...');
              tempRegistrationCredentials = null; // Clear from memory
              setTimeout(() => {
                if (onSuccess) onSuccess();
                onNavigate('home');
                window.location.reload();
              }, 1000);
              return;
            }
          } catch (e) {
            console.warn('Auto-login failed after verification:', e);
          }
        }

        // Fallback if no auto-login credentials
        setSuccessMsg('Verifikasi berhasil! Silakan masuk dengan akun Anda.');
        setTimeout(() => {
          onNavigate('auth-login');
        }, 1500);
      } else {
        setErrorMsg(data.error?.message || 'Verifikasi registrasi gagal.');
      }
    } catch (err) {
      setErrorMsg('Kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current screen label for the back button
  const getBackLabel = () => {
    switch(mode) {
      case 'login': return 'Login';
      case 'register': return 'Daftar';
      case 'forgot-password': return 'Lupa Kata Sandi';
      case 'verify': return 'Verifikasi';
      default: return 'Kembali';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4" id="auth-views-wrapper">
      {/* Universal compact header with active BackButton */}
      <div className="flex items-center py-4 mb-4 border-b border-slate-100 dark:border-white/5">
        <BackButton onBack={onBack} label={getBackLabel()} showText={true} />
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 shadow-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div 
            onClick={() => onNavigate('home')}
            className="w-14 h-14 mx-auto mb-3 cursor-pointer hover:scale-105 transition-transform"
          >
            <img
              src="/assets/mod-station-logo.svg"
              alt="Mod Station"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {mode === 'login' && 'LOGIN MOD STATION'}
            {mode === 'register' && 'DAFTAR MOD STATION'}
            {mode === 'forgot-password' && 'PULIHKAN AKUN'}
            {mode === 'verify' && 'VERIFIKASI AKUN'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login' && 'Akses bookmark, ulasan, dan sinkronisasi download'}
            {mode === 'register' && 'Gabung dengan komunitas aplikasi Android terbesar'}
            {mode === 'forgot-password' && 'Pemulihan Akun'}
            {mode === 'verify' && 'Kode verifikasi telah dikirimkan ke email anda.'}
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button (Only shown on Login and Register screen) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mb-6">
            <button
              type="button"
              disabled={googleLoading || isLoading}
              onClick={handleGoogleSignIn}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.17 21.32 7.23 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.39l4.09-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.18 6.61l4.09 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              <span>{googleLoading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}</span>
            </button>

            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
              </div>
              <span className="relative px-3 bg-white dark:bg-[#131924] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                atau dengan email
              </span>
            </div>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukan Alamat Email"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('auth-forgotpassword')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukan Kata Sandi"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukan Nama"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukan Email"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukan Kata Sandi"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Masukan Ulang Kata Sandi"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Saya menyetujui <span className="text-blue-600 underline cursor-pointer" onClick={() => onNavigate('terms')}>Syarat & Ketentuan</span> serta <span className="text-blue-600 underline cursor-pointer" onClick={() => onNavigate('privacy')}>Kebijakan Privasi</span> Mod Station.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || googleLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftar...</span>
                </>
              ) : (
                <>
                  <span>Daftar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {mode === 'forgot-password' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukan Email"
                  disabled={isCodeSent}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {isCodeSent && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kata Sandi Baru
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukan Kata Sandi Baru"
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kode
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Masukan Kode verifikasi"
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {!isCodeSent ? (
              <button
                type="button"
                onClick={handleSendResetCode}
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim kode...</span>
                  </>
                ) : (
                  <span>Send</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleVerifyAndResetPassword}
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Verifikasi</span>
                )}
              </button>
            )}
          </div>
        )}

        {/* 4. VERIFICATION MODE */}
        {mode === 'verify' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed">
              Masukan kode verifikasi untuk mendaftar
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kode
              </label>
              <input
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Masukan Kode"
                className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors text-center font-bold tracking-widest text-lg"
              />
            </div>

            <button
              type="button"
              onClick={handleVerifyRegistration}
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Verifikasi</span>
              )}
            </button>
          </div>
        )}

        {/* Switch mode footer links */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-center text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login' && (
            <p>
              Belum punya akun?{' '}
              <button
                onClick={() => onNavigate('auth-registration')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Daftar
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              Sudah punya akun?{' '}
              <button
                onClick={() => onNavigate('auth-login')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Masuk
              </button>
            </p>
          )}

          {(mode === 'forgot-password' || mode === 'verify') && (
            <button
              onClick={() => onNavigate('auth-login')}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Kembali ke Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
