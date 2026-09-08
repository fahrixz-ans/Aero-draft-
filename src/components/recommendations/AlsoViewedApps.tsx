import React from 'react';
import { Eye } from 'lucide-react';
import { AppItem, mapAppToAppItem } from '../../types/intelligence';
import { AppData } from '../../types';
import { AppRecommendationCard } from '../apps/AppRecommendationCard';

interface AlsoViewedAppsProps {
  id?: string;
  title?: string;
  apps: (AppItem | AppData)[];
  onSelectApp: (slug: string) => void;
}

export const AlsoViewedApps: React.FC<AlsoViewedAppsProps> = ({
  id = 'also-viewed-apps-shelf',
  title = 'Pengguna Juga Melihat',
  apps = [],
  onSelectApp
}) => {
  if (!apps || apps.length === 0) return null;

  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
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
              reason="Populer Ditinjau"
            />
          );
        })}
      </div>
    </section>
  );
};
