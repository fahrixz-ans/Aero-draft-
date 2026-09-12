import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, Loader2 } from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { useLanguage } from '../../context/LanguageContext';
import { AeroUser as User } from '../../types';
import { getUserPreferences, saveUserPreferences } from '../../services/userService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface SettingsInterestsViewProps {
  user: User | null;
  onBack: () => void;
}

export default function SettingsInterestsView({ user, onBack }: SettingsInterestsViewProps) {
  const { t, language } = useLanguage();

  const [appCategories, setAppCategories] = useState<string[]>([
    'Social', 'Editing', 'Music', 'Education', 'Productivity', 
    'Finance', 'Photography', 'Business', 'Entertainment', 'Tools'
  ]);

  const [gameCategories, setGameCategories] = useState<string[]>([
    'Action', 'Adventure', 'Strategy', 'Casual', 'Racing', 
    'RPG', 'Simulation', 'Arcade'
  ]);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences
  useEffect(() => {
    async function loadPreferences() {
      setIsLoading(true);
      try {
        // First load from localStorage as immediate state
        const saved = localStorage.getItem('modstation_user_interests');
        if (saved) {
          setSelectedInterests(JSON.parse(saved));
        }

        // Then load from Firestore if user is logged in
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
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  // Fetch live categories from Firestore
  useEffect(() => {
    async function fetchLiveCategories() {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        if (!querySnapshot.empty) {
          const apps: string[] = [];
          const games: string[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const name = data.name;
            if (name) {
              const isGame = data.type === 'game' || 
                             data.type === 'games' || 
                             ['Action', 'Adventure', 'Strategy', 'Casual', 'Racing', 'RPG', 'Simulation', 'Arcade'].includes(name);
              if (isGame) {
                if (!games.includes(name)) games.push(name);
              } else {
                if (!apps.includes(name)) apps.push(name);
              }
            }
          });

          if (apps.length > 0) setAppCategories(apps);
          if (games.length > 0) setGameCategories(games);
        }
      } catch (err) {
        console.warn('Error fetching live categories from Firestore, using static fallbacks:', err);
      }
    }

    fetchLiveCategories();
  }, []);

  const toggleInterest = (category: string) => {
    setSelectedInterests((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save locally
      localStorage.setItem('modstation_user_interests', JSON.stringify(selectedInterests));
      
      // Save to Firestore
      await saveUserPreferences(user, { contentPreferences: selectedInterests });
      
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Error saving user preferences:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="settings-interests-view">
      {/* Back button */}
      <div className="flex items-center">
        <BackButton onBack={onBack} label={t('settings.title', 'Pengaturan')} showText={true} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('settings.interests.title', 'Pilih minat Anda')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('settings.interests.subtitle', 'Mengatur kategori aplikasi dan game yang ingin lebih sering direkomendasikan.')}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{language === 'id' ? 'Minat Anda berhasil diperbarui!' : 'Your interests have been updated successfully!'}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-500">{t('common.loading', 'Memuat...')}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Aplikasi */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('settings.interests.appsTitle', 'Aplikasi')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {appCategories.map((cat) => {
                const isSelected = selectedInterests.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleInterest(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-[#131924] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Game */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('settings.interests.gamesTitle', 'Game')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {gameCategories.map((cat) => {
                const isSelected = selectedInterests.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleInterest(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-[#131924] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="w-full sm:w-auto px-8 h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('common.saving', 'Menyimpan...')}</span>
                </>
              ) : (
                <span>{t('common.save', 'Simpan')}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
