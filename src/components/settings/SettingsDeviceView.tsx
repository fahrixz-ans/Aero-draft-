import React, { useState, useEffect } from 'react';
import { Smartphone, Laptop, Monitor, CheckCircle2 } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { useLanguage } from '../../context/LanguageContext';

interface SettingsDeviceViewProps {
  onBack: () => void;
}

export default function SettingsDeviceView({ onBack }: SettingsDeviceViewProps) {
  const { t, language } = useLanguage();
  
  const [deviceInfo, setDeviceInfo] = useState({
    browser: 'Tidak tersedia',
    os: 'Tidak tersedia',
    version: 'Tidak tersedia',
    screenRes: 'Tidak tersedia',
    pixelRatio: '1x',
    isMobile: false
  });

  const [apkShaCheck, setApkShaCheck] = useState(() => {
    try {
      return localStorage.getItem('modstation_verify_sha') !== 'false';
    } catch (e) {
      return true;
    }
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    try {
      const ua = navigator.userAgent;
      let browser = 'Browser Standar';
      let os = 'Sistem Operasi Tidak Dikenal';

      // Detect OS
      if (/Windows/i.test(ua)) os = 'Windows';
      else if (/Android/i.test(ua)) os = 'Android';
      else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
      else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
      else if (/Linux/i.test(ua)) os = 'Linux';

      // Detect Browser
      if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
      else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
      else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
      else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
      const screenRes = typeof window !== 'undefined' ? `${window.screen.width} × ${window.screen.height}` : 'Tidak tersedia';
      const pixelRatio = typeof window !== 'undefined' ? `${window.devicePixelRatio || 1}x` : '1x';

      setDeviceInfo({
        browser,
        os,
        version: ua.substring(0, 48) + '...',
        screenRes,
        pixelRatio,
        isMobile
      });
    } catch (e) {
      // Keep defaults
    }
  }, []);

  const handleToggleSha = (checked: boolean) => {
    setApkShaCheck(checked);
    try {
      localStorage.setItem('modstation_verify_sha', checked ? 'true' : 'false');
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="settings-device-view">
      {/* Universal Apple-like Back Header */}
      <div className="flex items-center">
        <BackButton onBack={onBack} label={t('settings.title', 'Pengaturan')} showText={true} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('settings.devicePreferences', 'Preferensi akun dan perangkat')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'id' 
            ? 'Informasi perangkat dan konfigurasi unduhan aplikasi.'
            : 'Device information and application download configurations.'}
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{language === 'id' ? 'Preferensi berhasil disimpan.' : 'Preferences saved successfully.'}</span>
        </div>
      )}

      {/* Section 1: Device Information */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          {t('settings.device.deviceInfo', 'Perangkat Anda')}
        </h2>
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              {deviceInfo.isMobile ? <Smartphone className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {deviceInfo.browser} ({deviceInfo.os})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {deviceInfo.screenRes} • DPI {deviceInfo.pixelRatio}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('settings.device.os', 'Sistem Operasi')}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{deviceInfo.os}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('settings.device.deviceName', 'Browser')}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{deviceInfo.browser}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Resolusi Layar</span>
              <span className="font-semibold text-slate-900 dark:text-white">{deviceInfo.screenRes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Download & Security Preferences */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          {t('settings.device.downloadPref', 'Preferensi Unduhan')}
        </h2>
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Verifikasi Checksum SHA-256
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Otomatis mencocokkan signature berkas APK dengan database keamanan resmi Mod Station saat proses unduh.
              </p>
            </div>
            <input
              type="checkbox"
              checked={apkShaCheck}
              onChange={(e) => handleToggleSha(e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
