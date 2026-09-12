import React, { useState } from 'react';
import { Check } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { useLanguage } from '../../context/LanguageContext';

export type AutoplayOption = 'always' | 'wifi_only' | 'never';

interface SettingsAutoplayViewProps {
  onBack: () => void;
}

export default function SettingsAutoplayView({ onBack }: SettingsAutoplayViewProps) {
  const { t, language } = useLanguage();

  const [selectedOption, setSelectedOption] = useState<AutoplayOption>(() => {
    try {
      const saved = localStorage.getItem('modstation_autoplay_video');
      if (saved === 'always' || saved === 'wifi_only' || saved === 'never') return saved;
    } catch (e) {}
    return 'wifi_only';
  });

  const handleSelect = (option: AutoplayOption) => {
    setSelectedOption(option);
    try {
      localStorage.setItem('modstation_autoplay_video', option);
    } catch (e) {}
  };

  const options: { id: AutoplayOption; label: string; desc: string }[] = [
    { 
      id: 'always', 
      label: t('settings.autoplay.always', 'Selalu'),
      desc: language === 'id' ? 'Putar otomatis preview video di jaringan seluler maupun Wi-Fi.' : 'Autoplay video previews on both cellular data and Wi-Fi.'
    },
    { 
      id: 'wifi_only', 
      label: t('settings.autoplay.wifiOnly', 'Wi-Fi saja'),
      desc: language === 'id' ? 'Hanya putar otomatis saat terhubung ke jaringan Wi-Fi untuk menghemat kuota.' : 'Only autoplay when connected to Wi-Fi to save mobile data.'
    },
    { 
      id: 'never', 
      label: t('settings.autoplay.never', 'Jangan pernah'),
      desc: language === 'id' ? 'Nonaktifkan seluruh pemutaran video otomatis.' : 'Disable all video autoplay previews completely.'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="settings-autoplay-view">
      {/* Back button */}
      <div className="flex items-center">
        <BackButton onBack={onBack} label={t('settings.title', 'Pengaturan')} showText={true} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('settings.autoplay', 'Putar otomatis video')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'id'
            ? 'Atur kebijakan pemutaran otomatis cuplikan game dan demo aplikasi.'
            : 'Configure autoplay behavior for game trailers and app preview clips.'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#131924] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-white/5">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
            >
              <div className="space-y-0.5 pr-4">
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                  {opt.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block leading-normal">
                  {opt.desc}
                </span>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
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
