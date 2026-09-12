import React, { useState } from 'react';
import { Check, Sun, Moon, Laptop } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { useLanguage } from '../../context/LanguageContext';

export type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsThemeViewProps {
  onBack: () => void;
  currentTheme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function SettingsThemeView({ onBack, onThemeChange }: SettingsThemeViewProps) {
  const { t, language } = useLanguage();

  const [themePref, setThemePref] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem('modstation_theme_pref');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch (e) {}
    return 'system';
  });

  const applyTheme = (pref: ThemePreference) => {
    setThemePref(pref);
    try {
      localStorage.setItem('modstation_theme_pref', pref);

      let effectiveTheme: 'light' | 'dark' = 'light';
      if (pref === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveTheme = isDark ? 'dark' : 'light';
      } else {
        effectiveTheme = pref;
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
  };

  const themeOptions: { id: ThemePreference; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'light', label: t('settings.theme.light', 'Terang'), icon: Sun },
    { id: 'dark', label: t('settings.theme.dark', 'Gelap'), icon: Moon },
    { id: 'system', label: t('settings.theme.system', 'Mengikuti Sistem'), icon: Laptop },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="settings-theme-view">
      {/* Back button */}
      <div className="flex items-center">
        <BackButton onBack={onBack} label={t('settings.title', 'Pengaturan')} showText={true} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('settings.theme', 'Tema')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'id' 
            ? 'Pilih preferensi tampilan warna untuk aplikasi Mod Station.' 
            : 'Select color appearance preference for Mod Station app.'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-white/5">
        {themeOptions.map((opt) => {
          const isSelected = themePref === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => applyTheme(opt.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {opt.label}
                </span>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
