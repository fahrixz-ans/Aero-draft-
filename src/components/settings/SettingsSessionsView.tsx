import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, CheckCircle2 } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { useLanguage } from '../../context/LanguageContext';

interface SettingsSessionsViewProps {
  onBack: () => void;
}

export default function SettingsSessionsView({ onBack }: SettingsSessionsViewProps) {
  const { t, language } = useLanguage();

  const [currentSession, setCurrentSession] = useState({
    device: 'Browser Standar',
    os: 'Sistem Operasi',
    isMobile: false,
    ip: '127.0.0.1',
    lastActive: 'Aktif saat ini'
  });

  useEffect(() => {
    try {
      const ua = navigator.userAgent;
      let browser = 'Browser Standar';
      let os = 'Sistem Operasi';

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

      setCurrentSession({
        device: browser,
        os,
        isMobile,
        ip: 'Sesi Lokal Browser',
        lastActive: language === 'id' ? 'Aktif saat ini' : 'Currently active'
      });
    } catch (e) {}
  }, [language]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="settings-sessions-view">
      {/* Back button */}
      <div className="flex items-center">
        <BackButton onBack={onBack} label={t('settings.accountSecurityTitle', 'Akun dan keamanan')} showText={true} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('security.sessions', 'Sesi & Perangkat')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'id' 
            ? 'Daftar sesi yang memiliki otorisasi akses ke akun Mod Station Anda.'
            : 'List of authorized sessions accessing your Mod Station account.'}
        </p>
      </div>

      {/* Current Active Session */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          {t('security.currentSession', 'Sesi Saat Ini (Aktif)')}
        </h2>
        <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              {currentSession.isMobile ? <Smartphone className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentSession.device} di {currentSession.os}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  {language === 'id' ? 'Aktif' : 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentSession.lastActive}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
