import React from 'react';
import { Sparkles } from 'lucide-react';
import { AppItem, mapAppToAppItem } from '../../types/intelligence';
import { AppData } from '../../types';
import { AppRecommendationCard } from '../apps/AppRecommendationCard';

interface PersonalizedAppsProps {
  id?: string;
  apps: (AppItem | AppData)[];
  onSelectApp: (slug: string) => void;
  isAuthenticated?: boolean;
  hasSufficientInteractionData?: boolean;
}

export const PersonalizedApps: React.FC<PersonalizedAppsProps> = ({
  id = 'personalized-apps-shelf',
  apps = [],
  onSelectApp,
  isAuthenticated = false,
  hasSufficientInteractionData = false
}) => {
  if (!apps || apps.length === 0) return null;

  const isPersonalized = isAuthenticated && hasSufficientInteractionData;

  return (
    <section id={id} className="space-y-3">
      <div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Direkomendasikan Untuk Anda
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {isPersonalized
            ? 'Rekomendasi terpersonalisasi berdasarkan interaksi, riwayat pencarian, dan preferensi aplikasi Anda.'
            : 'Pilihan aplikasi populer dan sedang tren di seluruh platform AERO.'}
        </p>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {apps.map((app) => {
          const item = 'primaryCategory' in app ? app : mapAppToAppItem(app);
          return (
            <AppRecommendationCard
              key={item.id}
              app={item}
              onSelectApp={onSelectApp}
              reason={isPersonalized ? 'Cocok Minat Anda' : 'Trending AERO'}
            />
          );
        })}
      </div>
    </section>
  );
};
