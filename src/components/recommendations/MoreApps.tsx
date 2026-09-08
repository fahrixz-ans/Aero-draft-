import React from 'react';
import { Compass } from 'lucide-react';
import { AppItem, mapAppToAppItem } from '../../types/intelligence';
import { AppData } from '../../types';
import { AppRecommendationCard } from '../apps/AppRecommendationCard';

interface MoreAppsProps {
  id?: string;
  title?: string;
  apps: (AppItem | AppData)[];
  onSelectApp: (slug: string) => void;
}

export const MoreApps: React.FC<MoreAppsProps> = ({
  id = 'more-apps-shelf',
  title = 'Lebih Banyak Pilihan',
  apps = [],
  onSelectApp
}) => {
  if (!apps || apps.length === 0) return null;

  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {title}
        </h3>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {apps.map((app) => {
          const item = 'primaryCategory' in app ? app : mapAppToAppItem(app);
          return (
            <AppRecommendationCard
              key={item.id}
              app={item}
              onSelectApp={onSelectApp}
              reason="Jelajahi Ekosistem"
            />
          );
        })}
      </div>
    </section>
  );
};
