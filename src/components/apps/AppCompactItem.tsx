import React from 'react';
import { Star, Download, ShieldCheck } from 'lucide-react';
import { AppItem, mapAppToAppItem } from '../../types/intelligence';
import { AppData } from '../../types';

interface AppCompactItemProps {
  id?: string;
  app: AppItem | AppData;
  onSelectApp: (slug: string) => void;
  position?: number;
}

export const AppCompactItem: React.FC<AppCompactItemProps> = ({
  id,
  app,
  onSelectApp,
  position
}) => {
  const item: AppItem = 'primaryCategory' in app ? (app as AppItem) : mapAppToAppItem(app as AppData);
  const elementId = id || `app-compact-${item.id}`;

  return (
    <div
      id={elementId}
      onClick={() => onSelectApp(item.slug)}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
    >
      {position !== undefined && (
        <span className="w-5 text-center text-xs font-bold text-gray-400 font-mono">
          {position}
        </span>
      )}

      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-100 dark:border-gray-700/80">
        <img
          src={item.iconUrl || '/favicon.svg'}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/favicon.svg';
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h5 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
          {item.name}
        </h5>
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <span>{item.primaryCategory}</span>
          <span>•</span>
          <span className="flex items-center gap-0.5 text-gray-700 dark:text-gray-300 font-medium">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            {item.rating?.toFixed(1) || '4.5'}
          </span>
        </div>
      </div>
    </div>
  );
};
