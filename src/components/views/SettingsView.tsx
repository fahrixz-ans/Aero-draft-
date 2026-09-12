import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Globe, 
  Laptop, 
  Heart, 
  Play, 
  Moon, 
  Lock, 
  LogIn, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Check, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  KeyRound, 
  LogOut, 
  Sun, 
  Eye, 
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage, AppLanguage } from '../../context/LanguageContext';
import { AeroUser as User } from '../../types';
import { getUserPreferences, saveUserPreferences } from '../../services/userService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type ThemePreference = 'light' | 'dark' | 'system';
export type AutoplayOption = 'always' | 'wifi_only' | 'never';

interface SettingsViewProps {
  user: User | null;
  onNavigate: (view: string) => void;
  onBack?: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function SettingsView({ 
  user, 
  onNavigate, 
  onBack,
  onSignIn,
  onSignOut,
  onThemeChange 
}: SettingsViewProps) {
  const { t, language, setLanguage } = useLanguage();

  // ---------------------------------------------------------------------------
  // ACCORDION STATE
  // ---------------------------------------------------------------------------
  const [activeAccordions, setActiveAccordions] = useState<Record<string, boolean>>({
    preferensi: false,
    preferensiAkun: false,
    minat: false,
    autoplay: false,
    password: false
  });

  const toggleAccordion = (key: string) => {
    setActiveAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // ---------------------------------------------------------------------------
  // MODAL/POPUP STATE
  // ---------------------------------------------------------------------------
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Temporary state for modals until submit is pressed
  const [tempLanguage, setTempLanguage] = useState<AppLanguage>(language);
  const [tempTheme, setTempTheme] = useState<ThemePreference>('system');

  // Load initial theme preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('modstation_theme_pref');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setTempTheme(saved);
      }
    } catch (e) {}
  }, []);

  // Sync temp language with context language on modal open
  useEffect(() => {
    if (showLanguageModal) {
      setTempLanguage(language);
    }
  }, [showLanguageModal, language]);

  // ---------------------------------------------------------------------------
  // 1. PREFERENSI STATE (Tampilan, Notifikasi, Pengalaman)
  // ---------------------------------------------------------------------------
  const [reduceMotion, setReduceMotion] = useState(() => {
    try {
      return localStorage.getItem('modstation_pref_reduce_motion') === 'true';
    } catch (e) { return false; }
  });
  const [compactLayout, setCompactLayout] = useState(() => {
    try {
      return localStorage.getItem('modstation_pref_compact_layout') === 'true';
    } catch (e) { return false; }
  });
  const [pushNotifs, setPushNotifs] = useState(() => {
    try {
      return localStorage.getItem('modstation_pref_push_notifs') !== 'false';
    } catch (e) { return true; }
  });
  const [lowMemory, setLowMemory] = useState(() => {
    try {
      return localStorage.getItem('modstation_pref_low_memory') === 'true';
    } catch (e) { return false; }
  });

  const handleTogglePref = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      localStorage.setItem(`modstation_pref_${key}`, value ? 'true' : 'false');
    } catch (e) {}
  };

  // ---------------------------------------------------------------------------
  // 2. PREFERENSI AKUN & PERANGKAT STATE (Guest only)
  // ---------------------------------------------------------------------------
  const [apkShaCheck, setApkShaCheck] = useState(() => {
    try {
      return localStorage.getItem('modstation_verify_sha') !== 'false';
    } catch (e) { return true; }
  });

  const [deviceInfo, setDeviceInfo] = useState({
    browser: 'Tidak tersedia',
    os: 'Tidak tersedia',
    screenRes: 'Tidak tersedia',
    pixelRatio: '1x',
    isMobile: false
  });

  useEffect(() => {
    try {
      const ua = navigator.userAgent;
      let browser = 'Browser Standar';
      let os = 'Sistem Operasi Tidak Dikenal';

      if (/Windows/i.test(ua)) os = 'Windows';
      else if (/Android/i.test(ua)) os = 'Android';
      else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
      else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
      else if (/Linux/i.test(ua)) os = 'Linux';

      if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
      else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
      else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
      else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
      const screenRes = typeof window !== 'undefined' ? `${window.screen.width} × ${window.screen.height}` : 'Tidak tersedia';
      const pixelRatio = typeof window !== 'undefined' ? `${window.devicePixelRatio || 1}x` : '1x';

      setDeviceInfo({ browser, os, screenRes, pixelRatio, isMobile });
    } catch (e) {}
  }, []);

  const handleToggleSha = (checked: boolean) => {
    setApkShaCheck(checked);
    try {
      localStorage.setItem('modstation_verify_sha', checked ? 'true' : 'false');
    } catch (e) {}
  };

  // ---------------------------------------------------------------------------
  // 3. MINAT STATE (Interests)
  // ---------------------------------------------------------------------------
  const [appCategories, setAppCategories] = useState<string[]>([
    'Social', 'Editing', 'Music', 'Education', 'Productivity', 'Finance', 'Photography', 'Tools'
  ]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [interestsSaving, setInterestsSaving] = useState(false);
  const [interestsSavedSuccess, setInterestsSavedSuccess] = useState(false);

  // Load saved interests
  useEffect(() => {
    async function loadInterests() {
      setInterestsLoading(true);
      try {
        const saved = localStorage.getItem('modstation_user_interests');
        if (saved) {
          setSelectedInterests(JSON.parse(saved));
        }

        if (user) {
          const prefs = await getUserPreferences(user);
          if (prefs && prefs.contentPreferences) {
            setSelectedInterests(prefs.contentPreferences);
            localStorage.setItem('modstation_user_interests', JSON.stringify(prefs.contentPreferences));
          }
        }
      } catch (e) {
        console.warn('Error loading preferences:', e);
      } finally {
        setInterestsLoading(false);
      }
    }
    loadInterests();
  }, [user]);

  // Fetch real categories from Firestore
  useEffect(() => {
    async function fetchCategories() {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        if (!querySnapshot.empty) {
          const loadedCats: string[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name && !loadedCats.includes(data.name)) {
              loadedCats.push(data.name);
            }
          });
          if (loadedCats.length > 0) {
            setAppCategories(loadedCats);
          }
        }
      } catch (err) {
        console.warn('Error fetching Firestore categories:', err);
      }
    }
    fetchCategories();
  }, []);

  const toggleInterest = (category: string) => {
    setSelectedInterests(prev => 
      prev.includes(category) 
        ? prev.filter(item => item !== category) 
        : [...prev, category]
    );
  };

  const handleSaveInterests = async () => {
    setInterestsSaving(true);
    try {
      localStorage.setItem('modstation_user_interests', JSON.stringify(selectedInterests));
      await saveUserPreferences(user, { contentPreferences: selectedInterests });
      setInterestsSavedSuccess(true);
      setTimeout(() => setInterestsSavedSuccess(false), 2000);
    } catch (e) {
      console.error('Error saving interests:', e);
    } finally {
      setInterestsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. PUTAR OTOMATIS VIDEO STATE (Autoplay)
  // ---------------------------------------------------------------------------
  const [autoplayOption, setAutoplayOption] = useState<AutoplayOption>(() => {
    try {
      const saved = localStorage.getItem('modstation_autoplay_video');
      if (saved === 'always' || saved === 'wifi_only' || saved === 'never') return saved;
    } catch (e) {}
    return 'wifi_only';
  });

  const handleSelectAutoplay = (opt: AutoplayOption) => {
    setAutoplayOption(opt);
    try {
      localStorage.setItem('modstation_autoplay_video', opt);
    } catch (e) {}
  };

  // ---------------------------------------------------------------------------
  // 5. KATA SANDI STATE (Password change)
  // ---------------------------------------------------------------------------
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordErrorMsg(language === 'id' ? 'Silakan lengkapi seluruh kolom kata sandi.' : 'Please fill out all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg(language === 'id' ? 'Kata sandi baru minimal harus 6 karakter.' : 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg(language === 'id' ? 'Konfirmasi kata sandi baru tidak cocok.' : 'New password confirmation does not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordErrorMsg(data?.error?.message || data?.message || (language === 'id' ? 'Gagal memperbarui kata sandi. Periksa kata sandi lama Anda.' : 'Failed to update password. Please check your current password.'));
      }
    } catch (err) {
      setPasswordErrorMsg(language === 'id' ? 'Terjadi kesalahan jaringan. Silakan coba lagi.' : 'Network error. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // SUBMIT HANDLERS FOR POPUPS
  // ---------------------------------------------------------------------------
  const handleSubmitLanguage = () => {
    setLanguage(tempLanguage);
    setShowLanguageModal(false);
  };

  const handleSubmitTheme = () => {
    try {
      localStorage.setItem('modstation_theme_pref', tempTheme);

      let effectiveTheme: 'light' | 'dark' = 'light';
      if (tempTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveTheme = isDark ? 'dark' : 'light';
      } else {
        effectiveTheme = tempTheme;
      }

      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (onThemeChange) {
        onThemeChange(effectiveTheme);
      }
    } catch (e) {}
    setShowThemeModal(false);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('home');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in font-sans" id="settings-unified-view">
      
      {/* 1. HEADER PENGATURAN */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handleBackClick}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1C1C1E] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('settings.title', 'Pengaturan')}
        </h1>
      </div>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
        {language === 'id' 
          ? 'Kelola preferensi antarmuka, bahasa, minat konten, dan keamanan akun.'
          : 'Manage interface preferences, language, content interests, and account security.'}
      </p>

      {/* Settings List Container */}
      <div className="space-y-3.5 pt-2">
        
        {/* ROW 1: PREFERENSI (Accordion) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
          <button 
            onClick={() => toggleAccordion('preferensi')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Sliders className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t('settings.preferences', 'Preferensi')}
              </span>
            </div>
            {activeAccordions.preferensi ? (
              <ChevronUp className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            )}
          </button>

          {/* Accordion Content */}
          <div className={`transition-all duration-200 ease-in-out overflow-hidden ${activeAccordions.preferensi ? 'max-h-[500px] border-t border-slate-100 dark:border-white/5' : 'max-h-0'}`}>
            <div className="p-5 space-y-4 text-xs">
              
              {/* Switch 1: Reduce Motion */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {language === 'id' ? 'Tampilan (Kurangi Gerakan)' : 'Display (Reduce Motion)'}
                  </h4>
                  <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                    {language === 'id' 
                      ? 'Batasi transisi dan efek animasi visual pada aplikasi.' 
                      : 'Limit transitions and visual animation effects on the application.'}
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => handleTogglePref('reduce_motion', e.target.checked, setReduceMotion)}
                  className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>

              {/* Switch 2: Compact Layout */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {language === 'id' ? 'Tata Letak Ringkas' : 'Compact Layout'}
                  </h4>
                  <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                    {language === 'id' 
                      ? 'Tampilkan lebih banyak elemen katalog pada layar yang padat.' 
                      : 'Show more catalog elements on dense screens.'}
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={compactLayout}
                  onChange={(e) => handleTogglePref('compact_layout', e.target.checked, setCompactLayout)}
                  className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>

              {/* Switch 3: Push Notifications */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {language === 'id' ? 'Notifikasi' : 'Notifications'}
                  </h4>
                  <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                    {language === 'id' 
                      ? 'Izinkan pemberitahuan langsung mengenai rilis aplikasi baru.' 
                      : 'Allow direct notifications regarding new application releases.'}
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={pushNotifs}
                  onChange={(e) => handleTogglePref('push_notifs', e.target.checked, setPushNotifs)}
                  className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>

              {/* Switch 4: Low Memory Mode */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {language === 'id' ? 'Pengalaman Penggunaan (Memori Rendah)' : 'Usage Experience (Low Memory Mode)'}
                  </h4>
                  <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                    {language === 'id' 
                      ? 'Optimalkan konsumsi RAM dengan menonaktifkan pemuatan gambar berkualitas tinggi di latar belakang.' 
                      : 'Optimize RAM consumption by disabling background loading of high-quality images.'}
                  </p>
                </div>
                <input 
                  type="checkbox"
                  checked={lowMemory}
                  onChange={(e) => handleTogglePref('low_memory', e.target.checked, setLowMemory)}
                  className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </div>

            </div>
          </div>
        </div>

        {/* ROW 2: BAHASA (Popup / Modal trigger) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
          <button 
            onClick={() => setShowLanguageModal(true)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Globe className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t('settings.language', 'Bahasa')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                {language === 'id' ? 'Indonesia' : 'English'}
              </span>
              <X className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6] rotate-45" />
            </div>
          </button>
        </div>

        {/* ROW 3: PREFERENSI AKUN DAN PERANGKAT (Accordion) - Guest Only */}
        {!user && (
          <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
            <button 
              onClick={() => toggleAccordion('preferensiAkun')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <Laptop className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t('settings.devicePreferences', 'Preferensi akun dan perangkat')}
                </span>
              </div>
              {activeAccordions.preferensiAkun ? (
                <ChevronUp className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
              )}
            </button>

            {/* Accordion Content */}
            <div className={`transition-all duration-200 ease-in-out overflow-hidden ${activeAccordions.preferensiAkun ? 'max-h-[500px] border-t border-slate-100 dark:border-white/5' : 'max-h-0'}`}>
              <div className="p-5 space-y-4 text-xs">
                
                {/* Storage option */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {language === 'id' ? 'Unduhan' : 'Downloads'}
                    </h4>
                    <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                      {language === 'id' ? 'Lokasi Penyimpanan: Penyimpanan Internal' : 'Storage Location: Internal Storage'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[#6E6E73] dark:text-[#A1A1A6]">
                    {language === 'id' ? 'Bawaan' : 'Default'}
                  </span>
                </div>

                {/* Switch: Verify Checksum SHA-256 */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {language === 'id' ? 'Verifikasi Checksum SHA-256' : 'Verify SHA-256 Checksum'}
                    </h4>
                    <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                      {language === 'id' 
                        ? 'Otomatis mencocokkan signature berkas APK saat proses unduh demi keamanan.' 
                        : 'Automatically match APK file signatures during download for security.'}
                    </p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={apkShaCheck}
                    onChange={(e) => handleToggleSha(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                </div>

                {/* Device Spec details */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                  <h4 className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {language === 'id' ? 'Spesifikasi Perangkat' : 'Device Specifications'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                    <div>{language === 'id' ? 'Sistem Operasi' : 'Operating System'}: <span className="font-semibold text-slate-900 dark:text-white">{deviceInfo.os}</span></div>
                    <div>{language === 'id' ? 'Peramban' : 'Browser'}: <span className="font-semibold text-slate-900 dark:text-white">{deviceInfo.browser}</span></div>
                    <div>{language === 'id' ? 'Resolusi Layar' : 'Screen Resolution'}: <span className="font-semibold text-slate-900 dark:text-white">{deviceInfo.screenRes}</span></div>
                    <div>{language === 'id' ? 'Kepadatan Piksel' : 'Pixel Density'}: <span className="font-semibold text-slate-900 dark:text-white">{deviceInfo.pixelRatio}</span></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ROW 4: MINAT (Accordion) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
          <button 
            onClick={() => toggleAccordion('minat')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Heart className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t('settings.interests', 'Minat')}
              </span>
            </div>
            {activeAccordions.minat ? (
              <ChevronUp className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            )}
          </button>

          {/* Accordion Content */}
          <div className={`transition-all duration-200 ease-in-out overflow-hidden ${activeAccordions.minat ? 'max-h-[500px] border-t border-slate-100 dark:border-white/5' : 'max-h-0'}`}>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
                {language === 'id' 
                  ? 'Pilih kategori aplikasi dan game yang Anda sukai untuk mengkustomisasi rekomendasi konten.' 
                  : 'Select the application and game categories you like to customize content recommendations.'}
              </p>

              {interestsSavedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{language === 'id' ? 'Kategori minat berhasil diperbarui.' : 'Interest categories updated successfully.'}</span>
                </div>
              )}

              {interestsLoading ? (
                <div className="py-4 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span>{language === 'id' ? 'Memuat kategori...' : 'Loading categories...'}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {appCategories.map(cat => {
                      const isSelected = selectedInterests.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleInterest(cat)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={interestsSaving}
                      onClick={handleSaveInterests}
                      className="px-5 h-8.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {interestsSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('common.saving', 'Menyimpan...')}</span>
                        </>
                      ) : (
                        <span>{language === 'id' ? 'Simpan Minat' : 'Save Interests'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ROW 5: PUTAR OTOMATIS VIDEO (Accordion) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
          <button 
            onClick={() => toggleAccordion('autoplay')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Play className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t('settings.autoplay', 'Putar otomatis video')}
              </span>
            </div>
            {activeAccordions.autoplay ? (
              <ChevronUp className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
            )}
          </button>

          {/* Accordion Content */}
          <div className={`transition-all duration-200 ease-in-out overflow-hidden ${activeAccordions.autoplay ? 'max-h-[500px] border-t border-slate-100 dark:border-white/5' : 'max-h-0'}`}>
            <div className="p-5 space-y-3.5 text-xs">
              {[
                { 
                  id: 'always' as AutoplayOption, 
                  label: language === 'id' ? 'Selalu' : 'Always', 
                  desc: language === 'id' ? 'Putar otomatis video di semua jenis jaringan internet.' : 'Autoplay videos on all types of network connections.' 
                },
                { 
                  id: 'wifi_only' as AutoplayOption, 
                  label: language === 'id' ? 'Wi-Fi & Seluler' : 'Wi-Fi & Cellular', 
                  desc: language === 'id' ? 'Sama seperti Selalu (disesuaikan dengan kestabilan jaringan).' : 'Same as Always (adapted to network stability).' 
                },
                { 
                  id: 'wifi_only' as AutoplayOption, 
                  label: language === 'id' ? 'Wi-Fi saja' : 'Wi-Fi only', 
                  desc: language === 'id' ? 'Hanya putar otomatis saat tersambung ke jaringan Wi-Fi.' : 'Only autoplay videos when connected to a Wi-Fi network.' 
                },
                { 
                  id: 'never' as AutoplayOption, 
                  label: language === 'id' ? 'Jangan pernah' : 'Never', 
                  desc: language === 'id' ? 'Jangan pernah memutar video secara otomatis.' : 'Never play videos automatically.' 
                }
              ].map((opt, idx) => {
                const isSelected = autoplayOption === opt.id;
                return (
                  <button
                    key={`${opt.id}-${idx}`}
                    type="button"
                    onClick={() => handleSelectAutoplay(opt.id)}
                    className="w-full flex items-start gap-3 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.01] p-1 rounded-lg transition-colors"
                  >
                    <input 
                      type="radio" 
                      name="autoplay-group"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{opt.label}</span>
                      <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] leading-normal">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ROW 6: TEMA (Popup / Modal trigger) */}
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
          <button 
            onClick={() => setShowThemeModal(true)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Moon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t('settings.theme', 'Tema')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                {tempTheme === 'light' 
                  ? (language === 'id' ? 'Terang' : 'Light') 
                  : tempTheme === 'dark' 
                    ? (language === 'id' ? 'Gelap' : 'Dark') 
                    : (language === 'id' ? 'Mengikuti Sistem' : 'System Default')}
              </span>
              <X className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6] rotate-45" />
            </div>
          </button>
        </div>

      </div>

      {/* SECTION: AKUN & KEAMANAN */}
      <div className="pt-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {language === 'id' ? 'Akun & Keamanan' : 'Account & Security'}
        </h2>

        {!user ? (
          /* GUEST MODE: SIGN IN CTA ROW ONLY */
          <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
            <button 
              onClick={onSignIn}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t('auth.login', 'Masuk')}
                </span>
              </div>
              <X className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6] rotate-45" />
            </button>
          </div>
        ) : (
          /* LOGGED IN MODE: ACCORDION FOR PASSWORD */
          <div className="space-y-3.5">
            <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
              <button 
                onClick={() => toggleAccordion('password')}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {language === 'id' ? 'Kata Sandi' : 'Password'}
                  </span>
                </div>
                {activeAccordions.password ? (
                  <ChevronUp className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#6E6E73] dark:text-[#A1A1A6]" />
                )}
              </button>

              {/* Password Accordion Content */}
              <div className={`transition-all duration-200 ease-in-out overflow-hidden ${activeAccordions.password ? 'max-h-[600px] border-t border-slate-100 dark:border-white/5' : 'max-h-0'}`}>
                <div className="p-5 space-y-4 text-xs">
                  <p className="text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    {language === 'id' 
                      ? 'Kata sandi Anda dapat diubah melalui pengaturan keamanan akun di bawah ini.' 
                      : 'Your password can be changed through the account security settings below.'}
                  </p>

                  {passwordSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{language === 'id' ? 'Kata sandi Anda telah diganti.' : 'Your password has been changed.'}</span>
                    </div>
                  )}

                  {passwordErrorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4.5">
                    {/* Old Password */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        {language === 'id' ? 'Kata Sandi Saat Ini' : 'Current Password'}
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                        <input 
                          type={showOld ? 'text' : 'password'}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-blue-500 text-[#1D1D1F] dark:text-[#F5F5F7]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOld(!showOld)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        {language === 'id' ? 'Kata Sandi Baru' : 'New Password'}
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                        <input 
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-blue-500 text-[#1D1D1F] dark:text-[#F5F5F7]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        {language === 'id' ? 'Konfirmasi Kata Sandi Baru' : 'Confirm New Password'}
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                        <input 
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:border-blue-500 text-[#1D1D1F] dark:text-[#F5F5F7]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {passwordLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{language === 'id' ? 'Memproses...' : 'Processing...'}</span>
                          </>
                        ) : (
                          <span>{language === 'id' ? 'Ubah Kata Sandi' : 'Change Password'}</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Account Details & Session Card */}
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl p-4.5 space-y-3.5 text-xs">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {(user.displayName || user.email || 'M').substring(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {user.displayName || (language === 'id' ? 'Pengguna' : 'User')}
                  </h4>
                  <p className="text-[#6E6E73] dark:text-[#A1A1A6]">{user.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[#6E6E73] dark:text-[#A1A1A6]">
                  {language === 'id' ? 'Peran Akun:' : 'Account Role:'}
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">{user.role || 'User'}</span>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/45 text-red-600 dark:text-red-400 rounded-xl font-bold transition-all cursor-pointer"
                >
                  {language === 'id' ? 'Keluar Akun' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -----------------------------------------------------------------------
          MODAL 1: BAHASA POPUP
          ----------------------------------------------------------------------- */}
      <AnimatePresence>
        {showLanguageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop with Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLanguageModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t('settings.language', 'Bahasa')}
                </h3>
                <button 
                  onClick={() => setShowLanguageModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-[#6E6E73] dark:text-[#A1A1A6] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] -mt-2">
                {language === 'id' ? 'Pilih bahasa antarmuka Mod Station' : 'Select Mod Station interface language'}
              </p>

              {/* Language Options */}
              <div className="space-y-2 py-1">
                {[
                  { id: 'id' as AppLanguage, label: 'Indonesia' },
                  { id: 'en' as AppLanguage, label: 'English' }
                ].map((item) => {
                  const active = tempLanguage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTempLanguage(item.id)}
                      className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all text-xs font-semibold cursor-pointer ${
                        active
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200/80 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>{item.label}</span>
                      {active && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handleSubmitLanguage}
                  className="w-full h-10.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  {language === 'id' ? 'Kirim' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -----------------------------------------------------------------------
          MODAL 2: TEMA POPUP
          ----------------------------------------------------------------------- */}
      <AnimatePresence>
        {showThemeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop with Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowThemeModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {t('settings.theme', 'Tema')}
                </h3>
                <button 
                  onClick={() => setShowThemeModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-[#6E6E73] dark:text-[#A1A1A6] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] -mt-2">
                {language === 'id' ? 'Pilih tampilan Mod Station' : 'Select Mod Station interface theme'}
              </p>

              {/* Theme Options */}
              <div className="space-y-2 py-1">
                {[
                  { id: 'light' as ThemePreference, label: language === 'id' ? 'Terang' : 'Light', icon: Sun },
                  { id: 'dark' as ThemePreference, label: language === 'id' ? 'Gelap' : 'Dark', icon: Moon },
                  { id: 'system' as ThemePreference, label: language === 'id' ? 'Mengikuti Sistem' : 'System Default', icon: Laptop }
                ].map((item) => {
                  const active = tempTheme === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTempTheme(item.id)}
                      className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all text-xs font-semibold cursor-pointer ${
                        active
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200/80 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp className="w-4 h-4 text-slate-500" />
                        <span>{item.label}</span>
                      </div>
                      {active && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handleSubmitTheme}
                  className="w-full h-10.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  {language === 'id' ? 'Kirim' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -----------------------------------------------------------------------
          MODAL 3: LOGOUT CONFIRMATION POPUP
          ----------------------------------------------------------------------- */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop with Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center items-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center border border-red-200 dark:border-red-950/50">
                <LogOut className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {language === 'id' ? 'Keluar dari akun?' : 'Sign out of your account?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'id' 
                    ? 'Anda harus masuk kembali untuk mengakses fitur akun dan bookmark Anda.' 
                    : 'You will need to sign in again to access your account features and bookmarks.'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  {t('common.cancel', 'Batal')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutModal(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
                >
                  {language === 'id' ? 'Keluar' : 'Sign Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
