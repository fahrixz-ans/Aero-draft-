import React from 'react';
import { Sun, Check } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { useLanguage } from '../../context/LanguageContext';

interface SettingsThemeViewProps {
  onBack: () => void;
  onThemeChange?: (theme: string) => void;
}

export default function SettingsThemeView({ onBack, onThemeChange }: SettingsThemeViewProps) {
  const { t, language } = useLanguage();

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="settings-theme-view">
      {/* Back button */}
      <div className="flex items-center">
        <BackButton onBack={onBack} label={t('settings.title', 'Pengaturan')} showText={true} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t('settings.theme', 'Tema Tampilan')}
        </h1>
        <p className="text-xs text-slate-500">
          {language === 'id' 
            ? 'Mod Station dirancang secara eksklusif dengan tema terang (Light Theme) yang jernih, nyaman di mata, dan konsisten di semua perangkat.' 
            : 'Mod Station is exclusively designed with a clean, high-contrast Light Theme for clarity and optimal reading on all devices.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-sm text-slate-900 block">
              Light Theme (Resmi)
            </span>
            <span className="text-xs text-slate-500 block">
              {language === 'id' ? 'Tema terang aktif secara default' : 'Active light theme by default'}
            </span>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </div>
    </div>
  );
}
