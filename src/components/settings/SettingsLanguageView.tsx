import React from 'react';
import { Check } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { useLanguage, AppLanguage } from '../../context/LanguageContext';

interface SettingsLanguageViewProps {
  onBack: () => void;
}

export default function SettingsLanguageView({ onBack }: SettingsLanguageViewProps) {
  const { language, setLanguage, t } = useLanguage();

  const languages: { id: AppLanguage; label: string; subLabel: string }[] = [
    { id: 'id', label: 'Indonesia', subLabel: 'ID' },
    { id: 'en', label: 'English', subLabel: 'EN' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="settings-language-view">
      {/* Universal Apple-like Back Header */}
      <div className="flex items-center">
        <BackButton onBack={onBack} label={t('settings.title', 'Pengaturan')} showText={true} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('settings.language', 'Bahasa')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'id' 
            ? 'Pilih bahasa antarmuka untuk Mod Station.' 
            : 'Select interface language for Mod Station.'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-white/5">
        {languages.map((item) => {
          const isSelected = language === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setLanguage(item.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {item.label}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  ({item.subLabel})
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
